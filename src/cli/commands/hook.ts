import fs from 'node:fs'
import readline from 'node:readline'
import { runReviewFlow } from '../../core/review.js'
import { intro, outro, confirm as clackConfirm, spinner, isCancel, cancel } from '@clack/prompts'
import picocolors from 'picocolors'

function isInteractive() {
  return process.stdin.isTTY && process.stdout.isTTY
}

async function safeConfirm(message: string): Promise<boolean | symbol> {
  if (isInteractive()) {
    return await clackConfirm({ message, initialValue: true })
  }

  // Fallback for git hook non-tty environment
  // We need to read from /dev/tty explicitly
  if (!fs.existsSync('/dev/tty')) {
    // Should not happen if checked before
    return false
  }

  return new Promise((resolve) => {
    // Open /dev/tty for reading
    // Note: We cannot easily use fs.createReadStream because we need a raw fd for some cases,
    // but here we just need simple text input.
    const input = fs.createReadStream('/dev/tty')
    const output = process.stdout
    const rl = readline.createInterface({ input, output, terminal: false })

    const prefix = picocolors.magenta('◆')
    const suffix = picocolors.dim('(Y/n)')
    const str = `${prefix}  ${message} ${suffix} `
    
    output.write(str)

    rl.question('', (answer) => {
      rl.close()
      // Manually destroy the stream to release the file descriptor
      input.destroy()

      const val = answer.trim().toLowerCase()
      // Move cursor up and clear line to simulate replacement? 
      // Hard to do reliably in non-TTY. Just let it be.
      // But we can print the result to look like clack.
      // output.write(picocolors.dim(`${val === 'n' ? 'No' : 'Yes'}\n`))
      
      if (val === 'n') resolve(false)
      else resolve(true)
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

  if (isCancel(shouldReview) || !shouldReview) {
    if (isCancel(shouldReview)) cancel('操作已取消')
    else outro('已跳过 AI 审查')
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

  if (isCancel(shouldCommit) || !shouldCommit) {
    cancel('已取消提交')
    process.exit(1)
  }

  outro(picocolors.green('提交确认，继续执行...'))
  process.exit(0)
}
