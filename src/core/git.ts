import { spawnSync } from 'node:child_process'

function runGit(args: string[]) {
  const res = spawnSync('git', args, { encoding: 'utf8' })
  if (res.status !== 0) return ''
  return res.stdout || ''
}

export function getStagedFiles(): string[] {
  const out = runGit(['diff', '--staged', '--name-only'])
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function getStagedDiff(): string {
  return runGit(['diff', '--staged'])
}

export function getStagedDiffForFile(file: string): string {
  return runGit(['diff', '--staged', '--', file])
}

export function filterFiles(files: string[], fileTypes?: string[]): string[] {
  if (!fileTypes || fileTypes.length === 0) return files
  const exts = new Set(fileTypes.map((t) => t.replace(/^\./, '').toLowerCase()))
  return files.filter((f) => {
    const m = f.split('.').pop()
    if (!m) return false
    return exts.has(m.toLowerCase())
  })
}
