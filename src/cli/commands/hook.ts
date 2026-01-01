import fs from 'node:fs'
import tty from 'node:tty'
import readline from 'node:readline'
import { runReviewFlow } from '../../core/review.js'
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
  const canPrompt = isInteractive() || fs.existsSync('/dev/tty')
  if (!canPrompt && !force) {
    process.stdout.write('code-gate: non-interactive environment, skipping review\n')
    process.exit(0)
    return
  }

  console.clear()
  intro(picocolors.bgBlue(picocolors.white(' Code Gate AI Review ')))

  const shouldReview = await safeConfirm('需要进行本次提交的代码 Review 吗？')

  if (shouldReview === CANCEL_SYMBOL || isCancel(shouldReview)) {
    cancel('操作已取消')
    process.exit(0)
  }

  if (!shouldReview) {
    outro('已跳过 AI 审查')
    process.exit(0)
  }

  const s = spinner()
  s.start('正在初始化 AI 审查...')

  let previewUrl = ''

  const ok = await runReviewFlow({
    onStart: (total) => {
      s.message(`准备审查 ${total} 个文件...`)
    },
    onProgress: (file, idx, total) => {
      s.message(`正在分析 [${idx}/${total}] ${file}`)
    },
    onServerReady: (url) => {
      previewUrl = url
    }
  })

  s.stop('AI 审查任务已提交')

  if (previewUrl) {
    printBox('预览地址', previewUrl)
  }

  const shouldCommit = await safeConfirm('Review 已完成，是否继续提交？')

  if (shouldCommit === CANCEL_SYMBOL || isCancel(shouldCommit) || !shouldCommit) {
    cancel('已取消提交')
    process.exit(1)
  }

  outro(picocolors.green('提交确认，继续执行...'))
  process.exit(0)
}
