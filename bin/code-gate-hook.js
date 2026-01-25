#!/usr/bin/env node

// Code Gate Hook Entry Point
import('../dist/cli/commands/hook.js').then(({ runHook }) => {
  runHook().catch(console.error);
}).catch(console.error);