import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadConfig } from '../config/index.js'

function withTempConfig(content: any, ext = '.json') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-gate-test-'))
  const file = path.join(dir, `code-gate.config${ext}`)
  fs.writeFileSync(file, ext === '.json' ? JSON.stringify(content) : content, 'utf8')
  return { dir, file }
}

async function run() {
  const { dir } = withTempConfig({
    provider: 'deepseek',
    ui: { port: 6000, openBrowser: false },
    prompt: '通用提示词'
  })
  const cfg = await loadConfig(dir)
  if (cfg.ui?.port !== 6000) throw new Error('ui.port merge failed')
  if (cfg.prompt !== '通用提示词') throw new Error('prompt merge failed')
  process.stdout.write('config.test passed\n')
}

run().catch((e) => {
  process.stderr.write(String(e) + '\n')
  process.exit(1)
})
