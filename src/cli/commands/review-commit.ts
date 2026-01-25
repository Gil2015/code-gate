import { runReviewFlow } from '../../core/review.js'
import { loadConfig } from '../../config/index.js'
import { setLanguage, t } from '../../locales/index.js'
import { getCommitFiles, getCommitVsParentDiff, getCommitInfo } from '../../core/git.js'
import { filterFiles } from '../../core/git.js'
import { info, warn } from '../../utils/logger.js'
import { intro } from '@clack/prompts'

export async function runReviewCommit(commitHash: string) {
  const cfg = await loadConfig()
  if (cfg.language) {
    setLanguage(cfg.language)
  }

  // 验证commit hash
  if (!commitHash) {
    console.error('错误: 请提供commit hash')
    process.exit(1)
  }

  // 获取commit信息
  const commitInfo = getCommitInfo(commitHash)
  if (!commitInfo.hash) {
    console.error(`错误: 无效的commit hash: ${commitHash}`)
    process.exit(1)
  }

  // 获取commit的文件列表
  const allFiles = getCommitFiles(commitHash)
  if (allFiles.length === 0) {
    info(`没有找到commit ${commitHash} 中修改的文件`)
    return
  }

  // 根据配置过滤文件
  const filteredFiles = filterFiles(allFiles, cfg.fileTypes, cfg.exclude)

  if (filteredFiles.length === 0) {
    info(`没有符合过滤条件的文件需要审查`)
    return
  }

  // 获取commit的diff
  const diff = getCommitVsParentDiff(commitHash)
  if (!diff) {
    warn(`无法获取commit ${commitHash} 的diff`)
    return
  }

  console.log(`正在审查commit: ${commitInfo.hash.substring(0, 8)}`)
  console.log(`提交信息: ${commitInfo.message}`)
  console.log(`作者: ${commitInfo.author}`)
  console.log(`日期: ${commitInfo.date}`)
  console.log(`修改文件数量: ${filteredFiles.length}`)
  console.log('')

  // 使用现有的审查流程，传入自定义参数
  await runReviewFlow({
    customFiles: filteredFiles,
    customDiff: diff,
    customSubtitle: `Commit: ${commitInfo.hash.substring(0, 8)} | ${commitInfo.message}`,
    customCommitHash: commitHash, // 传递commit hash用于获取特定文件的diff
    onStart: (total: number) => {
      intro(t('cli.initReview'))
      console.log(`准备审查 ${total} 个文件...`)
    },
    onProgress: (file: string, index: number, total: number) => {
      console.log(`已处理: ${file} (${index}/${total})`)
    },
    onServerReady: (url: string) => {
      console.log('')
      console.log(`审查服务器已启动: ${url}`)
    }
  })
}