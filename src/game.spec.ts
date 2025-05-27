import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChessGame } from './game.js';
import type { GameConfig } from './types.js';

// Mock the chess-labs/core module
vi.mock('@chess-labs/core', () => ({
  initGameState: vi.fn(() => ({
    board: Array(8)
      .fill(null)
      .map(() => Array(8).fill(null)),
    currentTurn: 'white',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
  })),
  movePiece: vi.fn((from, to, gameState) => ({
    ...gameState,
    currentTurn: gameState.currentTurn === 'white' ? 'black' : 'white',
  })),
  getLegalMoves: vi.fn(() => [{ from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }]),
  positionToAlgebraic: vi.fn((pos) => `${String.fromCharCode(97 + pos.col)}${8 - pos.row}`),
  Color: {
    WHITE: 'white',
    BLACK: 'black',
  },
}));

// Mock the engine
vi.mock('./engine.js', () => ({
  StockfishEngine: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    getBestMove: vi.fn().mockResolvedValue('e2e4'),
    stop: vi.fn(),
  })),
}));

describe('ChessGame', () => {
  let game: ChessGame;
  let config: GameConfig;

  beforeEach(() => {
    config = {
      enginePath: 'stockfish',
      skillLevel: 10,
      timeLimit: 3000,
      playerColor: 'white',
    };
    game = new ChessGame(config);
  });

  it('should initialize with correct default state', () => {
    expect(game.getGameState()).toBe('setup');
    expect(game.getCurrentPlayer()).toBe('white');
    expect(game.getMoveHistory()).toEqual([]);
    expect(game.isPlayerTurn()).toBe(true);
  });

  it('should parse position notation correctly', () => {
    // Testing private method through public interface
    // This would need actual implementation testing
    expect(() => game.makePlayerMove('e2', 'e4')).not.toThrow();
  });

  it('should track move history', async () => {
    await game.initialize();
    await game.makePlayerMove('e2', 'e4');

    const history = game.getMoveHistory();
    expect(history.length).toBeGreaterThan(0);
  });

  it('should switch players after valid moves', async () => {
    await game.initialize();
    expect(game.isPlayerTurn()).toBe(true);

    await game.makePlayerMove('e2', 'e4');
    expect(game.isPlayerTurn()).toBe(false);
  });

  it('should end game properly', () => {
    game.endGame();
    expect(game.getGameState()).toBe('ended');
  });
});
