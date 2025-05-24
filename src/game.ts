import type { Board, Position, GameState as CoreGameState, Move, PieceType } from '@chess-labs/core';
import { initGameState, movePiece, getLegalMoves, positionToAlgebraic, Color } from '@chess-labs/core';
import { StockfishEngine } from './engine.js';
import type { GameConfig, GameState, MoveResult } from './types.js';
import chalk from 'chalk';

export class ChessGame {
  private coreGameState: CoreGameState;
  private engine: StockfishEngine;
  private gameState: GameState = 'setup';
  private moveHistory: string[] = [];

  constructor(private config: GameConfig) {
    this.coreGameState = initGameState();
    this.engine = new StockfishEngine(config);
  }

  async initialize(): Promise<void> {
    console.log(chalk.blue('🔧 Initializing chess engine...'));
    try {
      await this.engine.start();
      console.log(chalk.green('✅ Engine ready!'));
      this.gameState = 'playing';
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize engine:'), error);
      throw error;
    }
  }

  displayBoard(): void {
    console.log(`\n${this.formatBoard()}`);
    console.log(`\nCurrent player: ${chalk.bold(this.coreGameState.currentTurn)}`);
    if (this.moveHistory.length > 0) {
      console.log(`Last move: ${chalk.yellow(this.moveHistory[this.moveHistory.length - 1])}`);
    }
  }

  private formatBoard(): string {
    const pieces = {
      wp: '♙',
      wr: '♖',
      wn: '♘',
      wb: '♗',
      wq: '♕',
      wk: '♔',
      bp: '♟︎',
      br: '♜',
      bn: '♞',
      bb: '♝',
      bq: '♛',
      bk: '♚',
    };

    let result = '  a b c d e f g h\n';

    for (let row = 0; row < 8; row++) {
      result += `${8 - row} `;
      for (let col = 0; col < 8; col++) {
        const piece = this.coreGameState.board[row][col];
        if (piece) {
          const pieceKey = `${piece.color === Color.WHITE ? 'w' : 'b'}${piece.type[0]}` as keyof typeof pieces;
          result += pieces[pieceKey] || '?';
        } else {
          // Alternating background for empty squares
          result += (row + col) % 2 === 0 ? '·' : ' ';
        }
        result += ' ';
      }
      result += `${8 - row}\n`;
    }

    result += '  a b c d e f g h';
    return result;
  }

  async makePlayerMove(from: string, to: string): Promise<MoveResult> {
    if (this.gameState !== 'playing') {
      return { move: `${from}-${to}`, isValid: false };
    }

    try {
      const fromPos = this.parsePosition(from);
      const toPos = this.parsePosition(to);

      // Check if move is legal
      const legalMoves = getLegalMoves(fromPos, this.coreGameState);
      const isLegal = legalMoves.some((move: Move) => move.to.row === toPos.row && move.to.col === toPos.col);

      if (!isLegal) {
        console.log(chalk.red('❌ Illegal move!'));
        return { move: `${from}-${to}`, isValid: false };
      }

      // Execute move
      const newGameState = movePiece(fromPos, toPos, this.coreGameState);
      if (!newGameState) {
        console.log(chalk.red('❌ Invalid move!'));
        return { move: `${from}-${to}`, isValid: false };
      }

      this.coreGameState = newGameState;
      const moveNotation = `${from}-${to}`;
      this.moveHistory.push(moveNotation);

      console.log(chalk.green(`✅ Move made: ${moveNotation}`));

      return { move: moveNotation, isValid: true };
    } catch (error) {
      console.error(chalk.red('❌ Invalid move format or position'));
      return { move: `${from}-${to}`, isValid: false };
    }
  }

  private boardToFen(gameState: CoreGameState): string {
    // Basic FEN conversion - just the board position part
    let fen = '';

    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;

      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];

        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount.toString();
            emptyCount = 0;
          }

          const pieceChar = this.pieceToFenChar(piece);
          fen += pieceChar;
        } else {
          emptyCount++;
        }
      }

      if (emptyCount > 0) {
        fen += emptyCount.toString();
      }

      if (row < 7) fen += '/';
    }

    // Add current turn
    fen += ` ${gameState.currentTurn === Color.WHITE ? 'w' : 'b'}`;

    // Add castling rights (simplified)
    fen += ' KQkq';

    // Add en passant target square (simplified)
    fen += ' -';

    // Add halfmove and fullmove counters (simplified)
    fen += ' 0 1';

    return fen;
  }

  private pieceToFenChar(piece: { type: string; color: Color }): string {
    const chars: { [key: string]: string } = {
      pawn: 'p',
      rook: 'r',
      knight: 'n',
      bishop: 'b',
      queen: 'q',
      king: 'k',
    };

    const char = chars[piece.type] || 'p';
    return piece.color === Color.WHITE ? char.toUpperCase() : char;
  }

  async makeEngineMove(): Promise<MoveResult> {
    if (this.gameState !== 'playing' || this.coreGameState.currentTurn !== Color.BLACK) {
      return { move: '', isValid: false };
    }

    try {
      console.log(chalk.blue('🤖 Engine is thinking...'));

      const fen = this.boardToFen(this.coreGameState);
      const engineMove = await this.engine.getBestMove(fen);

      if (!engineMove || engineMove === '(none)') {
        console.log(chalk.red('❌ Engine could not find a move'));
        return { move: '', isValid: false };
      }

      // Parse UCI move format (e.g., "e2e4")
      const from = engineMove.substring(0, 2);
      const to = engineMove.substring(2, 4);

      const fromPos = this.parsePosition(from);
      const toPos = this.parsePosition(to);

      // Execute engine move
      const newGameState = movePiece(fromPos, toPos, this.coreGameState);
      if (!newGameState) {
        console.log(chalk.red('❌ Engine move failed!'));
        return { move: '', isValid: false };
      }

      this.coreGameState = newGameState;
      this.moveHistory.push(engineMove);

      console.log(chalk.green(`🤖 Engine played: ${engineMove}`));

      return { move: engineMove, isValid: true };
    } catch (error) {
      console.error(chalk.red('❌ Engine move failed:'), error);
      return { move: '', isValid: false };
    }
  }

  private parsePosition(notation: string): Position {
    if (notation.length !== 2) {
      throw new Error('Invalid position notation');
    }

    const col = notation.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const row = 8 - Number.parseInt(notation[1]); // '1' = row 7, '8' = row 0

    if (col < 0 || col > 7 || row < 0 || row > 7) {
      throw new Error('Position out of bounds');
    }

    return { row, col };
  }

  private formatPosition(pos: Position): string {
    const col = String.fromCharCode(97 + pos.col); // 0 = 'a', 1 = 'b', etc.
    const row = (8 - pos.row).toString(); // row 0 = '8', row 7 = '1'
    return col + row;
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getCurrentPlayer(): 'white' | 'black' {
    return this.coreGameState.currentTurn === Color.WHITE ? 'white' : 'black';
  }

  getMoveHistory(): string[] {
    return [...this.moveHistory];
  }

  isPlayerTurn(): boolean {
    return this.coreGameState.currentTurn === Color.WHITE;
  }

  endGame(): void {
    console.log(chalk.blue('🏁 Game ended'));
    this.gameState = 'ended';
    this.engine.stop();
  }
}
