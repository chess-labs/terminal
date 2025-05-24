export interface UCIOption {
  name: string;
  type: 'check' | 'spin' | 'combo' | 'button' | 'string';
  default?: string | number | boolean;
  min?: number;
  max?: number;
  var?: string[];
}

export interface GameConfig {
  enginePath: string;
  timeLimit?: number; // milliseconds
  depth?: number;
  skillLevel?: number; // 1-20
}

export interface MoveResult {
  move: string;
  isValid: boolean;
  gameOver?: boolean;
  winner?: 'white' | 'black' | 'draw';
}

export interface EngineResponse {
  type: 'info' | 'bestmove' | 'ready' | 'error';
  data: string;
}

export type GameState = 'setup' | 'playing' | 'ended';
