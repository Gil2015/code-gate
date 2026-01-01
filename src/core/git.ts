import fs from 'node:fs'
import path from 'node:path'
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

export function getBranchName(): string {
  return runGit(['rev-parse', '--abbrev-ref', 'HEAD']).trim()
}

export function getDiffStats(): string {
  return runGit(['diff', '--staged', '--shortstat']).trim()
}

export function getCommitMessage(): string {
  // 1. Try to read .git/COMMIT_EDITMSG (for pre-commit hook)
  try {
    const gitDir = runGit(['rev-parse', '--git-dir']).trim()
    if (gitDir) {
      const msgPath = path.join(gitDir, 'COMMIT_EDITMSG')
      if (fs.existsSync(msgPath)) {
        const msg = fs.readFileSync(msgPath, 'utf8').trim()
        // Get the first line only (subject)
        const subject = msg.split('\n')[0].trim()
        if (subject) return subject
      }
    }
  } catch {}

  // 2. Fallback to HEAD commit message (if not in hook or no pending msg)
  return runGit(['log', '-1', '--pretty=%s']).trim()
}
