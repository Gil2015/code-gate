import { loadConfig } from '../config/index.js'
import { setLanguage, t } from '../locales/index.js'
import {
  getStagedFiles,
  getStagedDiff,
  filterFiles,
  getStagedDiffForFile,
  getBranchName,
  getDiffStats,
  getCommitMessage,
  getFilesFromCommit,
  getDiffFromCommit,
  getDiffForFileFromCommit,
  getCommitMessageFromHash,
  getDiffStatsFromCommit
} from './git.js'
import { createLLMProvider, createAgentProvider, supportsAgent } from '../llm/index.js'
import type { AgentLLMProvider } from '../llm/base.js'
import { renderHTMLLive, renderHTMLTabs } from '../ui/render/html.js'
import { serveReview, saveOutput, triggerOpen } from '../ui/server.js'
import { info as logInfo, warn } from '../utils/logger.js'

export interface ReviewFlowOptions {
  onProgress?: (file: string, index: number, total: number) => void
  onServerReady?: (url: string) => void
  onStart?: (total: number, agentMode: boolean) => void
  onAgentToolCall?: (toolName: string) => void
  commitHash?: string
}

export async function runReviewFlow(opts: ReviewFlowOptions = {}): Promise<boolean> {
  const cfg = await loadConfig()
  
  if (!cfg) {
    // Should be handled by CLI, but just in case
    return true
  }

  if (cfg.language) {
    setLanguage(cfg.language)
  }
  
  const getFiles = opts.commitHash ? () => getFilesFromCommit(opts.commitHash!) : getStagedFiles
  const getDiff = opts.commitHash ? () => getDiffFromCommit(opts.commitHash!) : getStagedDiff
  const getFileDiff = opts.commitHash ? (f: string) => getDiffForFileFromCommit(opts.commitHash!, f) : getStagedDiffForFile
  const getMsg = opts.commitHash ? () => getCommitMessageFromHash(opts.commitHash!) : getCommitMessage
  const getStats = opts.commitHash ? () => getDiffStatsFromCommit(opts.commitHash!) : getDiffStats

  const providerName = cfg.provider
  const mode = (cfg.reviewMode || 'files') as 'summary' | 'files' | 'both'
  const modelUsed = cfg.providerOptions?.[providerName]?.model || 'unknown'

  // 判断是否启用 Agent 模式
  const agentEnabled = cfg.agent?.enabled === true && supportsAgent(providerName)
  const provider = agentEnabled ? createAgentProvider(cfg) : createLLMProvider(cfg)

  // Agent 模式配置
  const agentOptions = agentEnabled ? {
    maxIterations: cfg.agent?.maxIterations ?? 5,
    maxToolCalls: cfg.agent?.maxToolCalls ?? 10,
    onToolCall: (call: { name: string }) => {
      if (opts.onAgentToolCall) {
        opts.onAgentToolCall(call.name)
      }
    },
    onIteration: (_iteration: number, _toolCalls: number) => {
      // 迭代信息通过 onAgentToolCall 传递
    }
  } : null

  const allFiles = getFiles()
  
  if (allFiles.length === 0) {
    logInfo(t('cli.noFiles'))
    return true
  }

  const files = filterFiles(allFiles, cfg.fileTypes, cfg.exclude)
  if (files.length === 0) {
    logInfo(t('cli.noFilesAfterFilter'))
    return true
  }

  // Agent 模式或 summary 模式需要获取全局 diff
  // Agent 模式会将所有文件一起审查，需要完整的 diff
  let diff = ''
  if (mode === 'summary' || mode === 'both' || agentEnabled) {
    diff = getDiff()
    if (!diff) {
      warn('code-gate: 无法获取完整 Diff (可能文件过大)')
      if (agentEnabled) {
        warn('code-gate: Agent 模式需要完整 Diff，将回退到普通模式')
      }
    }
  }

  const prompt = cfg.prompt || ''
  
  let aiInvoked = false
  let aiSucceeded = false
  let status = ''

  // 1. Pre-check for Ollama connectivity if selected
  if (providerName === 'ollama') {
    try {
      const baseURL = cfg.providerOptions?.ollama?.baseURL || 'http://localhost:11434'
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1000) // 1s timeout
      const checkRes = await fetch(baseURL, { signal: controller.signal }).catch(() => null)
      clearTimeout(timeoutId)
      if (!checkRes) {
        warn(t('cli.ollamaCheckFailed'))
        // Don't block, but user should know AI might fail
        status = t('cli.ollamaCheckFailed')
      }
    } catch {}
  }

  if (opts.onStart) opts.onStart(files.length, agentEnabled)

  async function runSummary(): Promise<string> {
    try {
      aiInvoked = true
      let s: string

      // 根据模式选择审查方式
      if (agentEnabled && agentOptions) {
        // Agent 模式
        s = await (provider as AgentLLMProvider).reviewWithAgent(
          { prompt, diff, files: list },
          agentOptions
        )
      } else {
        // 普通模式
        s = await provider.review({ prompt, diff })
      }

      aiSucceeded = true
      return s || ''
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e)
      warn(`code-gate: LLM 调用失败：${errMsg}`)
      status = `LLM 调用失败：${errMsg}`
      aiSucceeded = false
      return `未生成 AI 审查结果。\n错误信息：${errMsg}`
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
  const commitMsg = getMsg()
  const diffStats = getStats()
  
  // Prefer commit message, fallback to diff stats
  const info = commitMsg || diffStats
  const subtitle = `Branch: ${branchName}${info ? ` | ${info}` : ''}`

  if (mode === 'summary') {
    const s = await runSummary()
    items.push({ file: 'Summary', review: s, diff, done: true })
    const html = renderHTMLLive(
      id,
      { aiInvoked, aiSucceeded, provider: providerName, model: modelUsed, status, datetime: formattedTime, subtitle, showLogo: cfg.ui?.showLogo },
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

  // ============ Agent 模式：所有文件合并审查 ============
  if (agentEnabled && agentOptions && diff) {
    logInfo('Agent 模式：合并审查所有变更文件')

    const html = renderHTMLLive(id, { aiInvoked, aiSucceeded, provider: providerName, model: modelUsed, status, datetime: formattedTime, subtitle, showLogo: cfg.ui?.showLogo }, [])
    const previewUrl = await serveReview(cfg, html, id, () => {
      const completed = items.filter((it) => it.done)
      return { files: completed, done: completed.length > 0 }
    }, false)

    if (opts.onServerReady && previewUrl) opts.onServerReady(previewUrl)

    // 执行 Agent 审查（所有文件一起）
    let agentReview = ''
    try {
      aiInvoked = true
      logInfo(`Agent 开始审查 ${list.length} 个文件...`)

      agentReview = await (provider as AgentLLMProvider).reviewWithAgent(
        { prompt, diff, files: list },
        agentOptions
      )

      aiSucceeded = !!agentReview
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e)
      warn(`code-gate: Agent 审查失败：${errMsg}`)
      agentReview = `Agent 审查失败。\n错误信息：${errMsg}`
    }

    // 将审查结果作为 Summary 显示，diff 为完整 diff
    items.push({ file: 'Agent Review', review: agentReview, diff, done: true })

    if (previewUrl) {
      triggerOpen(previewUrl)
    }

    if (opts.onProgress) opts.onProgress('Agent Review', 1, 1)

    // 如果是 both 模式，不需要再次生成 summary（Agent 已经是综合审查）
  } else {
    // ============ 普通模式：逐个文件审查 ============
    const html = renderHTMLLive(id, { aiInvoked, aiSucceeded, provider: providerName, model: modelUsed, status, datetime: formattedTime, subtitle, showLogo: cfg.ui?.showLogo }, [])
    const previewUrl = await serveReview(cfg, html, id, () => {
      const completed = items.filter((it) => it.done)
      const expected = list.length + (mode === 'both' ? 1 : 0)
      const allDone = completed.length >= expected
      return { files: completed, done: allDone }
    }, false)

    if (opts.onServerReady && previewUrl) opts.onServerReady(previewUrl)

    let completedCount = 0

    async function runTask(f: string) {
      let fdiff = getFileDiff(f)

      // Check for max diff lines
      const maxDiffLines = cfg?.limits?.maxDiffLines || 10000
      const lines = fdiff.split('\n')
      if (lines.length > maxDiffLines) {
        fdiff = lines.slice(0, maxDiffLines).join('\n') + t('cli.diffTruncated', { lines: lines.length })
      }

      let frev = ''
      try {
        aiInvoked = true
        frev = await provider.review({ prompt, diff: fdiff })
        aiSucceeded = aiSucceeded || !!frev
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e)
        warn(`code-gate: 文件 ${f} 审查失败：${errMsg}`)
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
  }

  try {
    const finalHtml = renderHTMLTabs(items, {
      aiInvoked,
      aiSucceeded,
      provider: providerName,
      model: modelUsed,
      status,
      datetime: formattedTime,
      subtitle,
      showLogo: cfg.ui?.showLogo
    })
    saveOutput(cfg, id, finalHtml)
  } catch {}

  return false
}
