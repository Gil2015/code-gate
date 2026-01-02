import { Translation } from './types.js'

export const ja: Translation = {
  cli: {
    welcome: ' Code Gate AI Review ',
    nonInteractive: 'code-gate: 非対話環境のため、レビューをスキップします',
    confirmReview: '今回のコミットのコードレビューを行いますか？',
    opCancelled: '操作がキャンセルされました',
    reviewSkipped: 'AIレビューをスキップしました',
    initReview: 'AIレビューを初期化中...',
    preparingReview: '{total} ファイルのレビューを準備中...',
    analyzing: '[{idx}/{total}] {file} を分析中',
    taskSubmitted: 'AIレビュータスクを送信しました',
    previewUrl: 'プレビュー URL',
    confirmCommit: 'レビューが完了しました。コミットを続行しますか？',
    commitCancelled: 'コミットをキャンセルしました',
    commitConfirmed: 'コミットを確認しました。続行します...',
    diffTruncated: '\n...(長さ制限のためDiffが切り詰められました。総行数: {lines})',
    ollamaCheckFailed: '警告: Ollama サービスが検出されないか、接続できません。AI レビューが失敗する可能性があります。',
  },
  ui: {
    title: 'Code Review',
    panelAI: 'AI Review',
    panelDiff: 'Diff',
    statusPending: 'AI: 待機中',
    statusFailed: 'AI: 失敗',
    statusDone: 'AI: 完了',
    statusProcessing: 'AI: 残りのファイルを処理中...',
    emptyReview: 'レビュー内容はありません',
  },
  prompt: {
    userTemplate: '以下の git diff に基づいてコードレビューを行い、問題点と改善案をリストアップしてください：\n\n{diff}'
  }
}
