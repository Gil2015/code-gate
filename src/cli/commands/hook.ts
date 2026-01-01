import fs from 'node:fs'
import tty from 'node:tty'
import readline from 'node:readline'
import { runReviewFlow } from '../../core/review.js'
import { loadConfig } from '../../config/index.js'
import { setLanguage, t } from '../../locales/index.js'
import { intro, outro, confirm as clackConfirm, spinner, isCancel, cancel } from '@clack/prompts'
import picocolors from 'picocolors'

// Hack: Try to restore TTY for git hooks
// Removed unsafe global stdin hack
// We will handle TTY explicitly in safeConfirm

const CANCEL_SYMBOL = Symbol('cancel')

function isInteractive() {
  return process.stdin.isTTY && process.stdout.isTTY
}

async function safeConfirm(message: string): Promise<boolean | symbol> {
  if (isInteractive()) {
    return await clackConfirm({ message, initialValue: true, active: 'yes', inactive: 'no' })
  }

  if (!fs.existsSync('/dev/tty')) {
    return false
  }

  return new Promise((resolve) => {
    const fd = fs.openSync('/dev/tty', 'r')
    const input = new tty.ReadStream(fd)
    const output = process.stdout
    
    readline.emitKeypressEvents(input)
    input.setRawMode(true)
    input.resume()

    let value = true // true = yes, false = no
    let isDone = false

    const render = (first = false) => {
      const prefix = picocolors.magenta('◆')
      const bar = picocolors.dim('│')
      
      const yesIcon = value ? picocolors.green('●') : picocolors.dim('○')
      const noIcon = !value ? picocolors.green('●') : picocolors.dim('○')
      
      const yesText = value ? 'yes' : picocolors.dim('yes')
      const noText = !value ? 'no' : picocolors.dim('no')
      
      const options = `${yesIcon} ${yesText} / ${noIcon} ${noText}`

      if (first) {
        output.write(`${prefix}  ${message}\n`)
        output.write(`${bar}  ${options}`)
      } else {
        // Clear current line (options) and rewrite
        // \r: move to start of line
        // \x1b[K: clear line
        output.write(`\r\x1b[K${bar}  ${options}`)
      }
    }

    const cleanup = () => {
      isDone = true
      input.setRawMode(false)
      input.destroy()
      output.write('\n') // End the line
    }

    const confirm = () => {
      cleanup()
      // Final output style: replace the prompt with a completed state
      // Move up 2 lines (options + prompt)
      // \x1b[1A: up 1 line
      output.write('\x1b[1A\r\x1b[K') // Clear options line
      output.write('\x1b[1A\r\x1b[K') // Clear prompt line
      
      const prefix = picocolors.green('✔')
      const text = picocolors.dim(message)
      output.write(`${prefix}  ${text}\n`) // Re-print simplified
      
      resolve(value)
    }

    const cancelOp = () => {
      cleanup()
      output.write('\x1b[1A\r\x1b[K') 
      output.write('\x1b[1A\r\x1b[K')
      
      const prefix = picocolors.red('✖')
      const text = picocolors.dim(message)
      output.write(`${prefix}  ${text}\n`)
      
      resolve(CANCEL_SYMBOL)
    }

    render(true)

    input.on('keypress', (_, key) => {
      if (isDone) return

      if (key.name === 'return' || key.name === 'enter') {
        confirm()
        return
      }

      if (key.ctrl && key.name === 'c') {
        cancelOp()
        return
      }

      if (key.name === 'left' || key.name === 'h') {
        value = true
        render()
      } else if (key.name === 'right' || key.name === 'l') {
        value = false
        render()
      } else if (key.name === 'y') {
        value = true
        render()
      } else if (key.name === 'n') {
        value = false
        render()
      }
    })
  })
}

function printBox(title: string, body: string) {
  process.stdout.write('\n')
  process.stdout.write(picocolors.cyan(`  ➜  ${title}: `))
  process.stdout.write(picocolors.underline(picocolors.white(body)))
  process.stdout.write('\n\n')
}

export async function runHook(force = false) {
  // Load config first to set language
  const cfg = await loadConfig()
  if (cfg.language) {
    setLanguage(cfg.language)
  }

  const canPrompt = isInteractive() || fs.existsSync('/dev/tty')
  if (!canPrompt && !force) {
    process.stdout.write(t('cli.nonInteractive') + '\n')
    process.exit(0)
    return
  }

  console.clear()
  intro(picocolors.bgBlue(picocolors.white(t('cli.welcome'))))

  const shouldReview = await safeConfirm(t('cli.confirmReview'))

  if (shouldReview === CANCEL_SYMBOL || isCancel(shouldReview)) {
    cancel(t('cli.opCancelled'))
    process.exit(0)
  }

  if (!shouldReview) {
    outro(t('cli.reviewSkipped'))
    process.exit(0)
  }

  const s = spinner()
  s.start(t('cli.initReview'))

  let previewUrl = ''

  const ok = await runReviewFlow({
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

  const shouldCommit = await safeConfirm(t('cli.confirmCommit'))

  if (shouldCommit === CANCEL_SYMBOL || isCancel(shouldCommit) || !shouldCommit) {
    cancel(t('cli.commitCancelled'))
    process.exit(1)
  }

  outro(picocolors.green(t('cli.commitConfirmed')))
  process.exit(0)
}
