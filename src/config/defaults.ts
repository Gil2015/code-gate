import { Config } from './types.js'

export const defaultConfig: Config = {
  provider: 'ollama',
  providerOptions: {
    deepseek: {
      baseURL: 'https://api.deepseek.com',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      model: 'deepseek-chat',
      concurrencyFiles: 4
    },
    ollama: {
      baseURL: 'http://localhost:11434',
      model: 'qwen2.5-coder',
      concurrencyFiles: 1
    }
  },
  fileTypes: [],
  ui: {
    openBrowser: true,
    port: 5175
  },
  limits: {
    maxDiffLines: 10000,
    maxFiles: 100
  },
  reviewMode: 'files',
  prompt:
    '作为资深代码审查工程师，从安全、性能、代码风格与测试覆盖角度审查本次变更，指出问题与改进建议，并给出必要的示例补丁。',
  output: {
    dir: '.review-logs'
  }
}
