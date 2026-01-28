import fs from 'node:fs'
import readline from 'node:readline'
import { runReviewFlow } from '../../core/review.js'
import { loadConfig } from '../../config/index.js'
import { setLanguage, t } from '../../locales/index.js'
import { intro, spinner } from '@clack/prompts'
import picocolors from 'picocolors'

function printBox(title: string, body: string) {
  process.stdout.write('\n')
  process.stdout.write(picocolors.cyan(`  ➜  ${title}: `))
  process.stdout.write(picocolors.underline(picocolors.white(body)))
  process.stdout.write('\n\n')
}

export async function runReview(commitHash?: string) {
  // Load config first to set language
  const cfg = await loadConfig()
  
  if (!cfg) {
    console.error(picocolors.red(t('cli.configNotFound')))
    process.exit(1)
  }

  if (cfg.language) {
    setLanguage(cfg.language)
  }

  console.clear()
  intro(picocolors.bgBlue(picocolors.white(t('cli.welcome'))))

  const s = spinner()
  s.start(t('cli.initReview'))

  let previewUrl = ''

  await runReviewFlow({
    commitHash,
    onStart: (total) => {
      s.message(t('cli.preparingReview', { total }))
    },
    onProgress: (file, idx, total) => {
      s.message(t('cli.analyzing', { idx, total, file }))
    },
    onServerReady: (url) => {
      previewUrl = url
    }
  })

  s.stop(t('cli.taskSubmitted'))

  if (previewUrl) {
    printBox(t('cli.previewUrl'), previewUrl)
  }

  // Wait for Enter to exit
  const message = t('cli.pressEnterToExit')
  process.stdout.write(picocolors.dim(message))

  // If stdin is not TTY (e.g. piped), we can't really wait for input in the same way.
  // But for a manual CLI tool, it should be TTY.
  
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', () => {
        process.exit(0)
    })
  } else {
    // Fallback for non-TTY
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    rl.on('line', () => {
        process.exit(0)
    })
  }
}
