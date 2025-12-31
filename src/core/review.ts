import { loadConfig } from '../config/index.js'
import { getStagedFiles, getStagedDiff, filterFiles, getStagedDiffForFile } from './git.js'
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
  const provider = createLLMProvider(cfg)
  const providerName = cfg.provider
  const mode = (cfg.reviewMode || 'files') as 'summary' | 'files' | 'both'
  const modelUsed = cfg.providerOptions?.[providerName]?.model || 'unknown'

  const files = filterFiles(getStagedFiles(), cfg.fileTypes)
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
  const id = Date.now().toString(36)

  if (mode === 'summary') {
    const s = await runSummary()
    items.push({ file: 'Summary', review: s, diff, done: true })
    const html = renderHTMLLive(
      id,
      { aiInvoked, aiSucceeded, provider: providerName, model: modelUsed, status },
      [{ file: 'Summary', review: s, diff }]
    )
    const url = await serveReview(cfg, html, id, () => ({ files: items, done: true }))
    if (opts.onServerReady) opts.onServerReady(url)
    const finalHtml = renderHTMLTabs(items, {
      aiInvoked,
      aiSucceeded,
      provider: providerName,
      model: modelUsed,
      status
    })
    saveOutput(cfg, id, finalHtml)
    return false
  }

  const html = renderHTMLLive(id, { aiInvoked, aiSucceeded, provider: providerName, model: modelUsed, status }, [])
  const previewUrl = await serveReview(cfg, html, id, () => {
    const completed = items.filter((it) => it.done)
    const expected = list.length + (mode === 'both' ? 1 : 0)
    const allDone = completed.length >= expected
    return { files: completed, done: allDone }
  }, false)
  
  if (opts.onServerReady && previewUrl) opts.onServerReady(previewUrl)

  let completedCount = 0

  async function runTask(f: string) {
    const fdiff = getStagedDiffForFile(f)
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
      status
    })
    saveOutput(cfg, id, finalHtml)
  } catch {}

  return false
}
