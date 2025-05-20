# terminal

**terminal** is a command-line chess game where you can play against the powerful [Stockfish](https://stockfishchess.org/) engine.

---

## Features

- Play chess in the terminal
- Powered by Stockfish via UCI protocol
- Lightweight and modular design
- Designed to integrate with a standalone [`chessboard`](https://github.com/chess-labs/chessboard) logic module (WIP)

---

## Getting Started

### 1. Install Stockfish

- **macOS**: `brew install stockfish`  
- **Ubuntu**: `sudo apt install stockfish`  
- **Windows**: [Download here](https://stockfishchess.org/download/)

### 2. Install dependencies and run

```bash
pnpm install
pnpm start
```

---

## ⚠️ Note: chessboard module in progress

This project is built to work with a separate chessboard TypeScript module that handles all chess rules and board state.
That module is currently under development.

---

## Roadmap
- Integrate chessboard for move validation and state handling
- Improve terminal UI (unicode board)
- Difficulty settings (Elo, skill level, depth)
- PGN export
- Player vs Player mode
