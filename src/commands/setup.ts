import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

function writeFileSafe(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content, 'utf8')
}

export async function runSetup() {
  const cwd = process.cwd()
  const hooksDir = path.join(cwd, '.githooks')
  const preCommit = path.join(hooksDir, 'pre-commit')
  const binPath = 'npx code-gate hook'
  const script = `#!/usr/bin/env sh\n${binPath}\n`
  writeFileSafe(preCommit, script)
  fs.chmodSync(preCommit, 0o755)
  spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' })
  process.stdout.write('code-gate installed: .githooks/pre-commit\n')
}
