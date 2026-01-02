import { Translation } from './types.js'

export const zhTW: Translation = {
  cli: {
    welcome: ' Code Gate AI Review ',
    nonInteractive: 'code-gate: 非交互式環境，跳過審查',
    confirmReview: '需要進行本次提交的代碼 Review 嗎？',
    opCancelled: '操作已取消',
    reviewSkipped: '已跳過 AI 審查',
    initReview: '正在初始化 AI 審查...',
    preparingReview: '準備審查 {total} 個文件...',
    analyzing: '正在分析 [{idx}/{total}] {file}',
    taskSubmitted: 'AI 審查任務已提交',
    previewUrl: '預覽地址',
    confirmCommit: 'Review 已完成，是否繼續提交？',
    commitCancelled: '已取消提交',
    commitConfirmed: '提交確認，繼續執行...',
    diffTruncated: '\n...(Diff 過長已截斷，總行數: {lines})',
    ollamaCheckFailed: '警告: 檢測到 Ollama 服務未啟動或無法連接，AI Review 可能會失敗。',
  },
  ui: {
    title: 'Code Review',
    panelAI: 'AI Review',
    panelDiff: 'Diff',
    statusPending: 'AI: 未參與',
    statusFailed: 'AI: 嘗試失敗',
    statusDone: 'AI: 審核完畢',
    statusProcessing: 'AI: 正在審核剩餘文件...',
    emptyReview: '暫無審查內容',
  },
  prompt: {
    userTemplate: '請根據以下 git diff 進行代碼審查，輸出問題清單與改進建議：\n\n{diff}'
  }
}
