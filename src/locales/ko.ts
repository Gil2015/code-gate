import { Translation } from './types.js'

export const ko: Translation = {
  cli: {
    welcome: ' Code Gate AI Review ',
    nonInteractive: 'code-gate: 비대화형 환경, 리뷰 건너뜀',
    confirmReview: '이번 커밋에 대해 코드 리뷰를 진행하시겠습니까?',
    opCancelled: '작업이 취소되었습니다',
    reviewSkipped: 'AI 리뷰 건너뜀',
    initReview: 'AI 리뷰 초기화 중...',
    preparingReview: '{total}개 파일 리뷰 준비 중...',
    analyzing: '[{idx}/{total}] {file} 분석 중',
    taskSubmitted: 'AI 리뷰 작업 제출됨',
    previewUrl: '미리보기 URL',
    confirmCommit: '리뷰가 완료되었습니다. 커밋을 계속하시겠습니까?',
    commitCancelled: '커밋 취소됨',
    commitConfirmed: '커밋 확인됨, 계속 진행...',
    diffTruncated: '\n...(길이 제한으로 인해 Diff가 잘렸습니다. 총 라인 수: {lines})',
    ollamaCheckFailed: '경고: Ollama 서비스가 감지되지 않거나 연결할 수 없습니다. AI 리뷰가 실패할 수 있습니다.',
  },
  ui: {
    title: 'Code Review',
    panelAI: 'AI Review',
    panelDiff: 'Diff',
    statusPending: 'AI: 대기 중',
    statusFailed: 'AI: 실패',
    statusDone: 'AI: 완료',
    statusProcessing: 'AI: 남은 파일 처리 중...',
    emptyReview: '리뷰 내용 없음',
  },
  prompt: {
    userTemplate: '다음 git diff를 기반으로 코드 리뷰를 수행하고, 문제점과 개선 제안을 나열해 주세요:\n\n{diff}'
  }
}
