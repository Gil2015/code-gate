#!/usr/bin/env node --no-warnings

const cliPath = '../dist/cli/index.js'

import(cliPath)
  .then(async (mod) => {
    if (mod && typeof mod.run === 'function') {
      await mod.run()
    } else {
      console.error('code-gate: CLI entry point not found in dist/cli/index.js')
      process.exit(1)
    }
  })
  .catch(async (e) => {
    if (e.code === 'ERR_MODULE_NOT_FOUND') {
      console.error('code-gate is not built yet or path is incorrect. Run `npm run build`.')
      console.error('Error:', e.message)
    } else {
      console.error('Unexpected error:', e)
    }
    process.exit(1)
  })
