import readline from 'node:readline'
import fs from 'node:fs'
import { runReviewFlow } from '../core/review-flow.js'

function isInteractive() {
  return process.stdin.isTTY && process.stdout.isTTY
}

function askYesNo(question: string) {
  const input =
    process.stdin.isTTY ? process.stdin : (fs.existsSync('/dev/tty') ? fs.createReadStream('/dev/tty') : process.stdin)
  return new Promise<boolean>((resolve) => {
    const rl = readline.createInterface({ input, output: process.stdout })
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

function startProgress(title: string) {
  let i = 0
  const marks = ['.', '..', '...', '....']
  process.stdout.write(`${title}`)
  const timer = setInterval(() => {
    i = (i + 1) % marks.length
    process.stdout.write(`${marks[i]}`)
  }, 500)
  return () => {
    clearInterval(timer)
    process.stdout.write('\n')
  }
}

export async function runHook(force = false) {
  const canPrompt = isInteractive() || fs.existsSync('/dev/tty')
  if (!canPrompt && !force) {
    process.stdout.write('code-gate: non-interactive environment, skipping review\n')
    process.exit(0)
    return
  }
  const yes = await askYesNo('\n========================================\n需要进行本次提交的代码 Review 吗？(🟢Y/🔴N)\n========================================\n')
  if (!yes) {
    process.stdin.pause()
    setImmediate(() => process.exit(0))
    return
  }
  const stop = startProgress('正在进行 AI 审查')
  const ok = await runReviewFlow()
  stop()
  if (!ok) {
    const cont = await askYesNo('\n========================================\nReview 已完成，是否继续提交？(🟢Y/🔴N)\n========================================\n')
    if (cont) {
      process.stdin.pause()
      setImmediate(() => process.exit(0))
    } else {
      process.stdout.write('已取消提交\n')
      process.stdin.pause()
      setImmediate(() => process.exit(1))
    }
  } else {
    const cont = await askYesNo('\n========================================\nReview 已完成，是否继续提交？(🟢Y/🔴N)\n========================================\n')
    if (cont) {
      process.stdin.pause()
      setImmediate(() => process.exit(0))
    } else {
      process.stdout.write('已取消提交\n')
      process.stdin.pause()
      setImmediate(() => process.exit(1))
    }
  }
}
