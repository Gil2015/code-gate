import { loadConfig } from '../config/index.js'
import { setLanguage, t } from '../locales/index.js'
import { getStagedFiles, getStagedDiff, filterFiles, getStagedDiffForFile, getBranchName, getDiffStats, getCommitMessage } from './git.js'
import { createLLMProvider } from '../llm/index.js'
import { renderHTMLLive, renderHTMLTabs } from '../ui/render/html.js'
import { serveReview, saveOutput, triggerOpen } from '../ui/server.js'
import { info, warn } from '../utils/logger.js'

export interface ReviewFlowOptions {
  onProgress?: (file: string, index: number, total: number) => void
  onServerReady?: (url: string) => void
  onStart?: (total: number) => void
}

export async function runReviewFlow(opts: ReviewFlowOptions = {}): Promise<boolean> {
  const cfg = await loadConfig()
  if (cfg.language) {
    setLanguage(cfg.language)
  }
  const provider = createLLMProvider(cfg)
  const providerName = cfg.provider
  const mode = (cfg.reviewMode || 'files') as 'summary' | 'files' | 'both'
  const modelUsed = cfg.providerOptions?.[providerName]?.model || 'unknown'

  const files = filterFiles(getStagedFiles(), cfg.fileTypes, cfg.exclude)
  if (files.length === 0) {
    // info('code-gate: 没有可审查的文件')
    return true
  }

  let diff = getStagedDiff()
  if (!diff) {
    // warn('code-gate: 未获取到 diff')
    return true
  }

  const prompt = cfg.prompt || ''
  
  let aiInvoked = false
  let aiSucceeded = false
  let status = ''

  // 1. Pre-check for Ollama connectivity if selected
  if (providerName === 'ollama') {
    try {
      const baseURL = cfg.providerOptions?.ollama?.baseURL || 'http://localhost:11434'
      const checkRes = await fetch(baseURL).catch(() => null)
      if (!checkRes) {
        warn(t('cli.ollamaCheckFailed'))
        // Don't block, but user should know AI might fail
        status = t('cli.ollamaCheckFailed')
      }
    } catch {}
  }

  if (opts.onStart) opts.onStart(files.length)

  async function runSummary(): Promise<string> {
    try {
      aiInvoked = true
      const s = await provider.review({ prompt, diff })
      aiSucceeded = true
      return s || ''
    } catch (e: any) {
      warn(`code-gate: LLM 调用失败：${e?.message || e}`)
      status = `LLM 调用失败：${e?.message || e}`
      aiSucceeded = false
      return `未生成 AI 审查结果。\n错误信息：${e?.message || e}`
    }
  }

  const maxFiles = cfg.limits?.maxFiles || files.length
  const list = files.slice(0, maxFiles)
  
  const concurrency = Math.max(1, Math.min(8, cfg.providerOptions?.[providerName]?.concurrencyFiles || 1))
  
  const items: Array<{ file: string; review: string; diff: string; done?: boolean }> = []
  
  // Generate ID with timestamp format: YYYYMMDD-HHmmss (Local Time)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const id = `${year}${month}${day}-${hours}${minutes}${seconds}`
  
  const formattedTime = now.toLocaleString()
  const branchName = getBranchName()
  const commitMsg = getCommitMessage()
  const diffStats = getDiffStats()
  
  // Prefer commit message, fallback to diff stats
  const info = commitMsg || diffStats
  const subtitle = `Branch: ${branchName}${info ? ` | ${info}` : ''}`

  if (mode === 'summary') {
    const s = await runSummary()
    items.push({ file: 'Summary', review: s, diff, done: true })
    const html = renderHTMLLive(
      id,
      { aiInvoked, aiSucceeded, provider: providerName, model: modelUsed, status, datetime: formattedTime, subtitle },
      [{ file: 'Summary', review: s, diff }]
    )
    const url = await serveReview(cfg, html, id, () => ({ files: items, done: true }))
    if (opts.onServerReady) opts.onServerReady(url)
    const finalHtml = renderHTMLTabs(items, {
      aiInvoked,
      aiSucceeded,
      provider: providerName,
      model: modelUsed,
      status,
      datetime: formattedTime,
      subtitle
    })
    saveOutput(cfg, id, finalHtml)
    return false
  }

  const html = renderHTMLLive(id, { aiInvoked, aiSucceeded, provider: providerName, model: modelUsed, status, datetime: formattedTime, subtitle }, [])
  const previewUrl = await serveReview(cfg, html, id, () => {
    const completed = items.filter((it) => it.done)
    const expected = list.length + (mode === 'both' ? 1 : 0)
    const allDone = completed.length >= expected
    return { files: completed, done: allDone }
  }, false)
  
  if (opts.onServerReady && previewUrl) opts.onServerReady(previewUrl)

  let completedCount = 0

  async function runTask(f: string) {
    let fdiff = getStagedDiffForFile(f)
    
    // Check for max diff lines
    const maxDiffLines = cfg.limits?.maxDiffLines || 10000
    const lines = fdiff.split('\n')
    if (lines.length > maxDiffLines) {
      fdiff = lines.slice(0, maxDiffLines).join('\n') + t('cli.diffTruncated', { lines: lines.length })
    }

    let frev = ''
    try {
      aiInvoked = true
      frev = await provider.review({ prompt, diff: fdiff })
      aiSucceeded = aiSucceeded || !!frev
    } catch (e: any) {
      // warn(`code-gate: 文件 ${f} 审查失败：${e?.message || e}`)
    }
    items.push({ file: f, review: frev, diff: fdiff || 'diff --git a/' + f + ' b/' + f, done: true })
    if (mode === 'files' && items.length === 1 && previewUrl) {
      triggerOpen(previewUrl)
    }
    completedCount++
    if (opts.onProgress) opts.onProgress(f, completedCount, list.length)
  }

  const queue = [...list]
  const workers: Promise<void>[] = []
  for (let i = 0; i < Math.max(1, concurrency); i++) {
    const worker = (async () => {
      while (queue.length) {
        const f = queue.shift()
        if (!f) break
        await runTask(f)
      }
    })()
    workers.push(worker)
  }
  await Promise.all(workers)

  if (mode === 'both') {
    const s = await runSummary()
    items.push({ file: 'Summary', review: s, diff, done: true })
  }

  try {
    const finalHtml = renderHTMLTabs(items, {
      aiInvoked,
      aiSucceeded,
      provider: providerName,
      model: modelUsed,
      status,
      datetime: formattedTime,
      subtitle
    })
    saveOutput(cfg, id, finalHtml)
  } catch {}

  return false
}
