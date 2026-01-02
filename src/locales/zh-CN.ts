import { Translation } from './types.js'

export const zhCN: Translation = {
  cli: {
    welcome: ' Code Gate AI Review ',
    nonInteractive: 'code-gate: 非交互式环境，跳过审查',
    confirmReview: '需要进行本次提交的代码 Review 吗？',
    opCancelled: '操作已取消',
    reviewSkipped: '已跳过 AI 审查',
    initReview: '正在初始化 AI 审查...',
    preparingReview: '准备审查 {total} 个文件...',
    analyzing: '正在分析 [{idx}/{total}] {file}',
    taskSubmitted: 'AI 审查任务已提交',
    previewUrl: '预览地址',
    confirmCommit: 'Review 已完成，是否继续提交？',
    commitCancelled: '已取消提交',
    commitConfirmed: '提交确认，继续执行...',
    diffTruncated: '\n...(Diff 过长已截断，总行数: {lines})',
    ollamaCheckFailed: '警告: 检测到 Ollama 服务未启动或无法连接，AI Review 可能会失败。',
  },
  ui: {
    title: 'Code Review',
    panelAI: 'AI Review',
    panelDiff: 'Diff',
    statusPending: 'AI: 未参与',
    statusFailed: 'AI: 尝试失败',
    statusDone: 'AI: 审核完毕',
    statusProcessing: 'AI: 正在审核剩余文件...',
    emptyReview: '暂无审查内容',
  },
  prompt: {
    userTemplate: '请根据以下 git diff 进行代码审查，输出问题清单与改进建议：\n\n{diff}'
  }
}
