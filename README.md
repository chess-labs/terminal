# terminal

**terminal** is a command-line chess game where you can play against the powerful [Stockfish](https://stockfishchess.org/) engine.

---

## Features

- Play chess in the terminal
- Powered by Stockfish via UCI protocol
- Lightweight and modular design
- Designed to integrate with a standalone [`core`](https://github.com/chess-labs/core) logic module

---

## Getting Started

### Prerequisites

**Stockfish Engine**: Make sure you have Stockfish installed before running the game:

- **macOS**: `brew install stockfish`
- **Ubuntu**: `sudo apt install stockfish`
- **Windows**: [Download here](https://stockfishchess.org/download/)

### Installation Options

#### Option 1: NPM Global Install (Recommended)

```bash
# Install globally
npm install -g @chess-labs/terminal

# Run the game
terminal-chess
# or simply
chess
```

#### Option 2: Run with npx (No Installation)

```bash
# Run without installing
npx @chess-labs/terminal
```

#### Option 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/chess-labs/terminal.git
cd terminal

# Install dependencies
pnpm install

# Build and run
pnpm start
```

---

## Roadmap

- Integrate chessboard for move validation and state handling
- Improve terminal UI (unicode board)
- Difficulty settings (Elo, skill level, depth)
- PGN export
- Player vs Player mode
