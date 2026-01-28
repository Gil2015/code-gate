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
  exclude: ['**/package-lock.json'],
  ui: {
    openBrowser: true,
    showLogo: true,
    port: 5175
  },
  limits: {
    maxDiffLines: 10000,
    maxFiles: 100
  },
  reviewMode: 'files',
  language: 'en',
  prompt:`You are a senior code reviewer responsible for ensuring code quality and security meet high standards.

Project Info:
- [Fill in your project info: architecture, standards, business type, etc.]

Review Checklist:
- Code is clean and readable
- Proper naming conventions for functions and variables
- No code duplication
- Correct error handling
- Input validation implemented
- Performance considerations addressed

Provide feedback prioritized by:
- Critical Issues (Must fix)
- Warnings (Should fix)
- Suggestions (Consider improving, avoid unnecessary suggestions if not essential)

Provide specific examples on how to fix the issues.`,
  output: {
    dir: '.review-logs'
  },
  agent: {
    enabled: false,
    maxIterations: 5,
    maxToolCalls: 10
  }
}
