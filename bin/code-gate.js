#!/usr/bin/env node

// Code Gate CLI Entry Point
import('../dist/cli/index.js').then(({ run }) => {
  run().catch(console.error);
}).catch(console.error);