import { Translation } from './types.js'

export const en: Translation = {
  cli: {
    welcome: ' Code Gate AI Review ',
    nonInteractive: 'code-gate: non-interactive environment, skipping review',
    confirmReview: 'Do you want to review this commit?',
    opCancelled: 'Operation cancelled',
    reviewSkipped: 'AI Review skipped',
    initReview: 'Initializing AI Review...',
    preparingReview: 'Preparing to review {total} files...',
    analyzing: 'Analyzing [{idx}/{total}] {file}',
    taskSubmitted: 'AI Review task submitted',
    previewUrl: 'Preview URL',
    confirmCommit: 'Review completed. Continue to commit?',
    commitCancelled: 'Commit cancelled',
    commitConfirmed: 'Commit confirmed, proceeding...',
    diffTruncated: '\n...(Diff truncated due to length, total lines: {lines})',
    ollamaCheckFailed: 'Warning: Ollama service seems unavailable. AI Review might fail.',
  },
  ui: {
    title: 'Code Review',
    panelAI: 'AI Review',
    panelDiff: 'Diff',
    statusPending: 'AI: Pending',
    statusFailed: 'AI: Failed',
    statusDone: 'AI: Done',
    statusProcessing: 'AI: Processing remaining files...',
    emptyReview: 'No review content available',
  },
  prompt: {
    userTemplate: 'Please review the code based on the following git diff, and provide a list of issues and suggestions for improvement:\n\n{diff}'
  }
}
