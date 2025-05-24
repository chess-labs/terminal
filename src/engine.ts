import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { GameConfig, EngineResponse, UCIOption } from './types.js';

export class StockfishEngine extends EventEmitter {
  private process: ChildProcess | null = null;
  private isReady = false;
  private options: Map<string, UCIOption> = new Map();

  constructor(private config: GameConfig) {
    super();
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start Stockfish process
        this.process = spawn(this.config.enginePath, [], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (!this.process.stdout || !this.process.stdin) {
          throw new Error('Failed to start engine process');
        }

        // Handle engine output
        this.process.stdout.on('data', (data: Buffer) => {
          const lines = data.toString().trim().split('\n');
          for (const line of lines) {
            this.handleEngineOutput(line);
          }
        });

        // Handle errors
        this.process.stderr?.on('data', (data: Buffer) => {
          console.error('Engine error:', data.toString());
        });

        this.process.on('exit', (code: number | null) => {
          console.log(`Engine exited with code ${code}`);
          this.isReady = false;
        });

        // Initialize UCI protocol
        this.once('ready', () => {
          this.configureEngine();
          resolve();
        });

        this.sendCommand('uci');

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isReady) {
            reject(new Error('Engine initialization timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleEngineOutput(line: string): void {
    const trimmed = line.trim();

    if (trimmed.startsWith('id name')) {
      console.log(`Engine: ${trimmed.substring(8)}`);
    } else if (trimmed.startsWith('id author')) {
      console.log(`Author: ${trimmed.substring(10)}`);
    } else if (trimmed.startsWith('option name')) {
      this.parseOption(trimmed);
    } else if (trimmed === 'uciok') {
      this.sendCommand('isready');
    } else if (trimmed === 'readyok') {
      this.isReady = true;
      this.emit('ready');
    } else if (trimmed.startsWith('bestmove')) {
      const move = trimmed.split(' ')[1];
      this.emit('bestmove', move);
    } else if (trimmed.startsWith('info')) {
      this.emit('info', trimmed);
    }
  }

  private parseOption(line: string): void {
    // Parse UCI option format: "option name <name> type <type> [default <value>] [min <value>] [max <value>] [var <value>]*"
    const parts = line.split(' ');
    let i = 2; // Skip 'option name'

    const option: Partial<UCIOption> = {};

    // Get option name
    const nameEnd = parts.findIndex((part, index) => index > i && part === 'type');
    option.name = parts.slice(i, nameEnd).join(' ');

    i = nameEnd + 1;
    option.type = parts[i] as UCIOption['type'];
    i++;

    // Parse additional parameters
    while (i < parts.length) {
      const param = parts[i];
      if (param === 'default') {
        option.default = parts[++i];
      } else if (param === 'min') {
        option.min = Number.parseInt(parts[++i]);
      } else if (param === 'max') {
        option.max = Number.parseInt(parts[++i]);
      } else if (param === 'var') {
        if (!option.var) option.var = [];
        option.var.push(parts[++i]);
      }
      i++;
    }

    if (option.name && option.type) {
      this.options.set(option.name, option as UCIOption);
    }
  }

  private configureEngine(): void {
    // Set skill level if provided
    if (this.config.skillLevel !== undefined) {
      if (this.options.has('Skill Level')) {
        this.sendCommand(`setoption name Skill Level value ${this.config.skillLevel}`);
      }
    }

    // Set UCI_LimitStrength for weaker play
    if (this.config.skillLevel && this.config.skillLevel < 20) {
      if (this.options.has('UCI_LimitStrength')) {
        this.sendCommand('setoption name UCI_LimitStrength value true');
      }
    }
  }

  async getBestMove(position: string, timeLimit?: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        reject(new Error('Engine not ready'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Move calculation timeout'));
      }, (timeLimit || this.config.timeLimit || 5000) + 1000);

      this.once('bestmove', (move: string) => {
        clearTimeout(timeout);
        resolve(move);
      });

      // Send position and search command
      this.sendCommand(`position fen ${position}`);

      if (this.config.depth) {
        this.sendCommand(`go depth ${this.config.depth}`);
      } else if (timeLimit || this.config.timeLimit) {
        this.sendCommand(`go movetime ${timeLimit || this.config.timeLimit}`);
      } else {
        this.sendCommand('go depth 10'); // Default depth
      }
    });
  }

  sendCommand(command: string): void {
    if (!this.process?.stdin) {
      throw new Error('Engine process not available');
    }

    console.log(`> ${command}`);
    this.process.stdin.write(`${command}\n`);
  }

  stop(): void {
    if (this.process) {
      this.sendCommand('quit');
      this.process.kill();
      this.process = null;
      this.isReady = false;
    }
  }

  getAvailableOptions(): Map<string, UCIOption> {
    return new Map(this.options);
  }
}
