import { loadConfig } from '../config.js'
import { getStagedFiles, getStagedDiff, filterFiles, getStagedDiffForFile } from '../git.js'
import { deepseekReview } from '../llm/deepseek.js'
import { ollamaReview } from '../llm/ollama.js'
import { renderHTML, renderHTMLTabs } from '../ui/render.js'
import { serveReview } from '../ui/server.js'
import { info, warn } from '../log.js'

export async function runReviewFlow(): Promise<boolean> {
  const cfg = await loadConfig()
  const providerUsed = (cfg.review?.provider || cfg.provider) as 'deepseek' | 'ollama'
  const modelUsed = providerUsed === 'deepseek' ? cfg.deepseek?.model : cfg.ollama?.model
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
  try {
    if (providerUsed === 'deepseek') {
      const apiKeyEnv = cfg.deepseek?.apiKeyEnv || 'DEEPSEEK_API_KEY'
      if (!process.env[apiKeyEnv]) {
        status = `缺少 DeepSeek 密钥 ${apiKeyEnv}`
        content =
          `未生成 AI 审查结果。\n原因：缺少 DeepSeek 密钥 ${apiKeyEnv}。\n` +
          `解决方案：在当前环境设置 ${apiKeyEnv}，或切换 provider 为 ollama。\n` +
          `示例：export ${apiKeyEnv}="你的密钥"`
        aiInvoked = false
        aiSucceeded = false
      } else {
        aiInvoked = true
        content = await deepseekReview(cfg, { prompt, diff })
        aiSucceeded = !!content
      }
    } else {
      aiInvoked = true
      content = await ollamaReview(cfg, { prompt, diff })
      aiSucceeded = !!content
    }
  } catch (e: any) {
    warn(`code-gate: LLM 调用失败：${e?.message || e}`)
    status = `LLM 调用失败：${e?.message || e}`
    content =
      `未生成 AI 审查结果。\n可能原因：网络不可达、服务未启动或配置错误。\n` +
      `当前 provider：${cfg.provider}\n` +
      (cfg.provider === 'ollama'
        ? `请检查本地 Ollama 是否运行（默认 http://localhost:11434），模型是否可用。\n示例：ollama list`
        : `请检查 ${cfg.deepseek?.apiKeyEnv || 'DEEPSEEK_API_KEY'} 是否已设置、baseURL 是否为 https://api.deepseek.com`)
    aiInvoked = true
    aiSucceeded = false
  }
  if (cfg.review?.mode === 'per_file') {
    const items: Array<{ file: string; review: string; diff: string }> = []
    for (const f of files.slice(0, cfg.limits?.maxFiles || files.length)) {
      const fdiff = getStagedDiffForFile(f)
      let frev = ''
      try {
        if (providerUsed === 'deepseek') {
          const apiKeyEnv = cfg.deepseek?.apiKeyEnv || 'DEEPSEEK_API_KEY'
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
      items.push({ file: f, review: frev, diff: fdiff || 'diff --git a/' + f + ' b/' + f })
    }
    const html = renderHTMLTabs(items, {
      aiInvoked,
      aiSucceeded,
      provider: providerUsed,
      model: modelUsed,
      status
    })
    await serveReview(cfg, html)
  } else {
    const html = renderHTML(diff, content, {
      aiInvoked,
      aiSucceeded,
      provider: providerUsed,
      model: modelUsed,
      status
    })
    await serveReview(cfg, html)
  }
  return false
}
