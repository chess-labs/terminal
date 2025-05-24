#!/usr/bin/env node

import { ChessCLI } from './cli.js';

async function main() {
  const cli = new ChessCLI();

  try {
    await cli.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
