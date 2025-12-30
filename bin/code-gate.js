#!/usr/bin/env node
import('../dist/cli.js')
  .then(async (mod) => {
    if (mod && typeof mod.run === 'function') {
      await mod.run()
    } else {
      console.error('code-gate: CLI not found in dist/cli.js')
      process.exit(1)
    }
  })
  .catch(async () => {
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    const path = require('path')
    const url = require('url')
    const fs = require('fs')
    const dist = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'dist', 'cli.js')
    if (fs.existsSync(dist)) {
      const mod = await import(url.pathToFileURL(dist).href)
      if (mod && typeof mod.run === 'function') await mod.run()
      else {
        console.error('code-gate: CLI not found in dist/cli.js')
        process.exit(1)
      }
    } else {
      console.error('code-gate is not built yet. Run `npm run build`.')
      process.exit(1)
    }
  })
