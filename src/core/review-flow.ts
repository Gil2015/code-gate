import { loadConfig } from '../config.js'
import { getStagedFiles, getStagedDiff, filterFiles, getStagedDiffForFile } from '../git.js'
import { deepseekReview } from '../llm/deepseek.js'
import { ollamaReview } from '../llm/ollama.js'
import { renderHTMLLive, renderHTMLTabs } from '../ui/render.js'
import { serveReview, saveOutput, triggerOpen } from '../ui/server.js'
import { info, warn } from '../log.js'

export async function runReviewFlow(): Promise<boolean> {
  const cfg = await loadConfig()
  const providerUsed = cfg.provider as 'deepseek' | 'ollama'
  const mode = (cfg.reviewMode || 'files') as 'summary' | 'files' | 'both'
  const modelUsed =
    providerUsed === 'deepseek'
      ? cfg.providerOptions?.deepseek?.model
      : cfg.providerOptions?.ollama?.model
  const files = filterFiles(getStagedFiles(), cfg.fileTypes)
  if (files.length === 0) {
    info('code-gate: 没有可审查的文件')
    return true
  }
  let diff = getStagedDiff()
  if (!diff) {
    warn('code-gate: 未获取到 diff')
    return true
  }
  const prompt = cfg.prompt || ''
  let content = ''
  let aiInvoked = false
  let aiSucceeded = false
  let status = ''
  async function runSummary(): Promise<string> {
    try {
      if (providerUsed === 'deepseek') {
        const apiKeyEnv = cfg.providerOptions?.deepseek?.apiKeyEnv || 'DEEPSEEK_API_KEY'
        if (!process.env[apiKeyEnv]) {
          status = `缺少 DeepSeek 密钥 ${apiKeyEnv}`
          aiInvoked = false
          aiSucceeded = false
          return (
            `未生成 AI 审查结果。\n原因：缺少 DeepSeek 密钥 ${apiKeyEnv}。\n` +
            `解决方案：在当前环境设置 ${apiKeyEnv}，或切换 provider 为 ollama。\n` +
            `示例：export ${apiKeyEnv}="你的密钥"`
          )
        } else {
          aiInvoked = true
          const s = await deepseekReview(cfg, { prompt, diff })
          aiSucceeded = !!s
          return s || ''
        }
      } else {
        aiInvoked = true
        const s = await ollamaReview(cfg, { prompt, diff })
        aiSucceeded = !!s
        return s || ''
      }
    } catch (e: any) {
      warn(`code-gate: LLM 调用失败：${e?.message || e}`)
      status = `LLM 调用失败：${e?.message || e}`
      aiInvoked = true
      aiSucceeded = false
      return (
        `未生成 AI 审查结果。\n可能原因：网络不可达、服务未启动或配置错误。\n` +
        `当前 provider：${cfg.provider}\n` +
        (cfg.provider === 'ollama'
          ? `请检查本地 Ollama 是否运行（默认 http://localhost:11434），模型是否可用。\n示例：ollama list`
          : `请检查 ${cfg.providerOptions?.deepseek?.apiKeyEnv || 'DEEPSEEK_API_KEY'} 是否已设置、baseURL 是否为 https://api.deepseek.com`)
      )
    }
  }
  const maxFiles = cfg.limits?.maxFiles || files.length
  const list = files.slice(0, maxFiles)
  const rawConcurrency =
    providerUsed === 'deepseek'
      ? cfg.providerOptions?.deepseek?.concurrencyFiles ?? 4
      : cfg.providerOptions?.ollama?.concurrencyFiles ?? 1
  const concurrency = Math.max(1, Math.min(8, rawConcurrency || 1))
  const items: Array<{ file: string; review: string; diff: string; done?: boolean }> = []
  const id = Date.now().toString(36)
  if (mode === 'summary') {
    const s = await runSummary()
    items.push({ file: 'Summary', review: s, diff, done: true })
    const html = renderHTMLLive(
      id,
      { aiInvoked, aiSucceeded, provider: providerUsed, model: modelUsed, status },
      [{ file: 'Summary', review: s, diff }]
    )
    await serveReview(cfg, html, id, () => ({ files: items, done: true }))
    const finalHtml = renderHTMLTabs(items, {
      aiInvoked,
      aiSucceeded,
      provider: providerUsed,
      model: modelUsed,
      status
    })
    saveOutput(cfg, id, finalHtml)
    return false
  }
  const html = renderHTMLLive(id, { aiInvoked, aiSucceeded, provider: providerUsed, model: modelUsed, status }, [])
  const previewUrl = await serveReview(cfg, html, id, () => {
    const completed = items.filter((it) => it.done)
    const expected = list.length + (mode === 'both' ? 1 : 0)
    const allDone = completed.length >= expected
    return { files: completed, done: allDone }
  }, false)
  async function runTask(f: string) {
    const fdiff = getStagedDiffForFile(f)
    let frev = ''
    try {
      if (providerUsed === 'deepseek') {
        const apiKeyEnv = cfg.providerOptions?.deepseek?.apiKeyEnv || 'DEEPSEEK_API_KEY'
        if (process.env[apiKeyEnv]) {
          aiInvoked = true
          frev = await deepseekReview(cfg, { prompt, diff: fdiff })
          aiSucceeded = aiSucceeded || !!frev
        }
      } else {
        aiInvoked = true
        frev = await ollamaReview(cfg, { prompt, diff: fdiff })
        aiSucceeded = aiSucceeded || !!frev
      }
    } catch (e: any) {
      warn(`code-gate: 文件 ${f} 审查失败：${e?.message || e}`)
    }
    items.push({ file: f, review: frev, diff: fdiff || 'diff --git a/' + f + ' b/' + f, done: true })
    if (mode === 'files' && items.length === 1 && previewUrl) {
      triggerOpen(previewUrl)
    }
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
      provider: providerUsed,
      model: modelUsed,
      status
    })
    saveOutput(cfg, id, finalHtml)
  } catch {}
  return false
}
