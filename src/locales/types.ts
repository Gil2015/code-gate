export interface Translation {
  cli: {
    welcome: string
    nonInteractive: string
    confirmReview: string
    opCancelled: string
    reviewSkipped: string
    initReview: string
    preparingReview: string // with {total} placeholder
    analyzing: string // with {idx}, {total}, {file} placeholders
    taskSubmitted: string
    previewUrl: string
    confirmCommit: string
    commitCancelled: string
    commitConfirmed: string
    diffTruncated: string // with {lines} placeholder
    ollamaCheckFailed: string
  }
  ui: {
    title: string
    panelAI: string
    panelDiff: string
    statusPending: string
    statusFailed: string
    statusDone: string
    statusProcessing: string
    emptyReview: string
  }
  prompt: {
    userTemplate: string // with {diff} placeholder
  }
}
