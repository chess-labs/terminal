import inquirer from 'inquirer';
import chalk from 'chalk';
import { ChessGame } from './game.js';
import type { GameConfig } from './types.js';

export class ChessCLI {
  private game: ChessGame | null = null;

  async start(): Promise<void> {
    console.log(chalk.bold.blue('🏁 Welcome to Terminal Chess!'));
    console.log(chalk.gray('Play against the powerful Stockfish engine\n'));

    // Get game configuration
    const config = await this.getGameConfig();

    try {
      // Initialize game
      this.game = new ChessGame(config);
      await this.game.initialize();

      // Start game loop
      await this.gameLoop();
    } catch (error) {
      console.error(chalk.red('❌ Failed to start game:'), error);
      process.exit(1);
    }
  }

  private async getGameConfig(): Promise<GameConfig> {
    console.log(chalk.blue('🔧 Game Configuration\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'enginePath',
        message: 'Stockfish executable path:',
        default: 'stockfish',
        validate: (input: string) => {
          return input.trim().length > 0 || 'Please enter a valid path';
        },
      },
      {
        type: 'list',
        name: 'skillLevel',
        message: 'Choose engine difficulty:',
        choices: [
          { name: '🟢 Beginner (Level 1-5)', value: 3 },
          { name: '🟡 Intermediate (Level 6-10)', value: 8 },
          { name: '🟠 Advanced (Level 11-15)', value: 13 },
          { name: '🔴 Expert (Level 16-20)', value: 18 },
          { name: '⚡ Maximum Strength', value: 20 },
        ],
      },
      {
        type: 'number',
        name: 'timeLimit',
        message: 'Engine thinking time (milliseconds):',
        default: 3000,
        validate: (input: number) => {
          return input > 0 || 'Please enter a positive number';
        },
      },
    ]);

    return {
      enginePath: answers.enginePath.trim(),
      skillLevel: answers.skillLevel,
      timeLimit: answers.timeLimit,
    };
  }

  private async gameLoop(): Promise<void> {
    if (!this.game) return;

    console.log(chalk.green('\n✨ Game started! You are playing as White.'));
    console.log(chalk.gray('Enter moves in format: e2 e4 (from-square to-square)'));
    console.log(chalk.gray('Type "quit" to exit, "help" for commands\n'));

    this.game.displayBoard();

    while (this.game.getGameState() === 'playing') {
      try {
        if (this.game.isPlayerTurn()) {
          // Player's turn
          await this.handlePlayerTurn();
        } else {
          // Engine's turn
          await this.game.makeEngineMove();
          this.game.displayBoard();
        }
      } catch (error) {
        console.error(chalk.red('❌ Error during game:'), error);
        break;
      }
    }

    this.game.endGame();
    console.log(chalk.blue('\n👋 Thanks for playing!'));
  }

  private async handlePlayerTurn(): Promise<void> {
    if (!this.game) return;

    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'move',
        message: 'Your move:',
        validate: (input: string) => {
          const trimmed = input.trim().toLowerCase();

          if (trimmed === 'quit' || trimmed === 'help') {
            return true;
          }

          // Basic move format validation
          const parts = trimmed.split(' ');
          if (parts.length !== 2) {
            return 'Please enter move in format: e2 e4';
          }

          const [from, to] = parts;
          if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
            return 'Please enter valid squares (a1-h8)';
          }

          return true;
        },
      },
    ]);

    const input = answer.move.trim().toLowerCase();

    if (input === 'quit') {
      this.game.endGame();
      return;
    }

    if (input === 'help') {
      this.showHelp();
      return;
    }

    // Parse and execute move
    const parts = input.split(' ');
    const [from, to] = parts;

    const result = await this.game.makePlayerMove(from, to);

    if (result.isValid) {
      this.game.displayBoard();
    } else {
      console.log(chalk.yellow('💡 Try again with a valid move'));
    }
  }

  private isValidSquare(square: string): boolean {
    if (square.length !== 2) return false;

    const file = square[0];
    const rank = square[1];

    return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
  }

  private showHelp(): void {
    console.log(chalk.blue('\n📖 Help'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.white('Move format: ') + chalk.yellow('e2 e4') + chalk.gray(' (from-square to-square)'));
    console.log(chalk.white('Examples: ') + chalk.yellow('e2 e4, g1 f3, o-o (castling)'));
    console.log(chalk.white('Commands:'));
    console.log(chalk.yellow('  help') + chalk.gray(' - Show this help'));
    console.log(chalk.yellow('  quit') + chalk.gray(' - Exit the game'));
    console.log(chalk.gray('━'.repeat(50) + '\n'));
  }
}
