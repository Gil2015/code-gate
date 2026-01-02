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
  exclude: ['**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'],
  ui: {
    openBrowser: true,
    port: 5175
  },
  limits: {
    maxDiffLines: 10000,
    maxFiles: 100
  },
  reviewMode: 'files',
  language: 'en',
  prompt:
    'As a senior code review engineer, review this change from the perspectives of security, performance, code style, and test coverage. Point out issues and suggestions for improvement, and provide necessary example patches.',
  output: {
    dir: '.review-logs'
  }
}
