import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

export type Provider = 'ollama' | 'deepseek'

export interface Config {
  provider: Provider
  providerOptions?: {
    ollama?: {
      baseURL?: string
      model?: string
      concurrencyFiles?: number
      request?: {
        timeout?: number
        retries?: number
        backoffMs?: number
      }
    }
    deepseek?: {
      baseURL?: string
      apiKeyEnv?: string
      model?: string
      concurrencyFiles?: number
      request?: {
        timeout?: number
        retries?: number
        backoffMs?: number
        temperature?: number
        top_p?: number
        max_tokens?: number
      }
    }
    openai?: {
      baseURL?: string
      apiKeyEnv?: string
      model?: string
      concurrencyFiles?: number
      request?: {
        timeout?: number
        retries?: number
        backoffMs?: number
        temperature?: number
        top_p?: number
        max_tokens?: number
      }
    }
    anthropic?: {
      baseURL?: string
      apiKeyEnv?: string
      model?: string
      concurrencyFiles?: number
      request?: {
        timeout?: number
        retries?: number
        backoffMs?: number
        temperature?: number
        top_p?: number
        max_tokens?: number
      }
    }
    gemini?: {
      baseURL?: string
      apiKeyEnv?: string
      model?: string
      concurrencyFiles?: number
      request?: {
        timeout?: number
        retries?: number
        backoffMs?: number
        temperature?: number
        top_p?: number
        max_tokens?: number
      }
    }
    cohere?: {
      baseURL?: string
      apiKeyEnv?: string
      model?: string
      concurrencyFiles?: number
      request?: {
        timeout?: number
        retries?: number
        backoffMs?: number
        temperature?: number
        top_p?: number
        max_tokens?: number
      }
    }
    mistral?: {
      baseURL?: string
      apiKeyEnv?: string
      model?: string
      concurrencyFiles?: number
      request?: {
        timeout?: number
        retries?: number
        backoffMs?: number
        temperature?: number
        top_p?: number
        max_tokens?: number
      }
    }
    azureOpenAI?: {
      endpoint?: string
      apiKeyEnv?: string
      deployment?: string
      apiVersion?: string
      concurrencyFiles?: number
      request?: {
        timeout?: number
        retries?: number
        backoffMs?: number
        temperature?: number
        top_p?: number
        max_tokens?: number
      }
    }
  }
  fileTypes?: string[]
  ui?: {
    openBrowser?: boolean
    port: number
  }
  limits?: {
    maxDiffLines?: number
    maxFiles?: number
  }
  reviewMode?: 'summary' | 'files' | 'both'
  prompt?: string
  output?: {
    dir?: string
  }
}

const defaultConfig: Config = {
  provider: 'deepseek',
  providerOptions: {
    deepseek: {
      baseURL: 'https://api.deepseek.com',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      model: 'deepseek-chat',
      concurrencyFiles: 4,
      request: { retries: 1, backoffMs: 300 }
    },
    ollama: {
      baseURL: 'http://localhost:11434',
      model: 'qwen2.5-coder',
      concurrencyFiles: 1,
      request: { timeout: 15000, retries: 1, backoffMs: 300 }
    }
  },
  fileTypes: ['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'py', 'go', 'rs'],
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
    dir: '.code-gate'
  }
}

function findConfigFile(cwd: string): string | undefined {
  const candidates = [
    path.join(cwd, '.codegate.js'),
    path.join(cwd, '.codegate.cjs'),
    path.join(cwd, 'code-gate.config.json'),
    path.join(cwd, 'code-gate.config.yaml'),
    path.join(cwd, 'code-gate.config.yml'),
    path.join(cwd, '.code-gaterc'),
    path.join(cwd, '.code-gaterc.json'),
    path.join(cwd, '.code-gaterc.yaml'),
    path.join(cwd, '.code-gaterc.yml')
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return undefined
}

async function readFile(p: string): Promise<any> {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.js' || ext === '.cjs') {
    const { pathToFileURL } = await import('node:url')
    const mod = await import(pathToFileURL(p).href)
    return mod?.default ?? mod
  }
  const raw = fs.readFileSync(p, 'utf8')
  if (ext === '.yaml' || ext === '.yml') return yaml.parse(raw)
  return JSON.parse(raw)
}

export async function loadConfig(cwd = process.cwd()): Promise<Config> {
  const p = findConfigFile(cwd)
  if (!p) return { ...defaultConfig }
  const user = (await readFile(p)) || {}
  const merged: Config = {
    ...defaultConfig,
    ...user,
    ui: { ...defaultConfig.ui, ...(user.ui || {}) },
    limits: { ...defaultConfig.limits, ...(user.limits || {}) },
    providerOptions: {
      ...(defaultConfig.providerOptions || {}),
      ...(user.providerOptions || {}),
      deepseek: {
        ...(defaultConfig.providerOptions?.deepseek || {}),
        ...(user.providerOptions?.deepseek || {}),
        request: {
          ...(defaultConfig.providerOptions?.deepseek?.request || {}),
          ...(user.providerOptions?.deepseek?.request || {})
        }
      },
      ollama: {
        ...(defaultConfig.providerOptions?.ollama || {}),
        ...(user.providerOptions?.ollama || {}),
        request: {
          ...(defaultConfig.providerOptions?.ollama?.request || {}),
          ...(user.providerOptions?.ollama?.request || {})
        }
      },
      openai: {
        ...(defaultConfig.providerOptions?.openai || {}),
        ...(user.providerOptions?.openai || {}),
        request: {
          ...(defaultConfig.providerOptions?.openai?.request || {}),
          ...(user.providerOptions?.openai?.request || {})
        }
      },
      anthropic: {
        ...(defaultConfig.providerOptions?.anthropic || {}),
        ...(user.providerOptions?.anthropic || {}),
        request: {
          ...(defaultConfig.providerOptions?.anthropic?.request || {}),
          ...(user.providerOptions?.anthropic?.request || {})
        }
      },
      gemini: {
        ...(defaultConfig.providerOptions?.gemini || {}),
        ...(user.providerOptions?.gemini || {}),
        request: {
          ...(defaultConfig.providerOptions?.gemini?.request || {}),
          ...(user.providerOptions?.gemini?.request || {})
        }
      },
      cohere: {
        ...(defaultConfig.providerOptions?.cohere || {}),
        ...(user.providerOptions?.cohere || {}),
        request: {
          ...(defaultConfig.providerOptions?.cohere?.request || {}),
          ...(user.providerOptions?.cohere?.request || {})
        }
      },
      mistral: {
        ...(defaultConfig.providerOptions?.mistral || {}),
        ...(user.providerOptions?.mistral || {}),
        request: {
          ...(defaultConfig.providerOptions?.mistral?.request || {}),
          ...(user.providerOptions?.mistral?.request || {})
        }
      },
      azureOpenAI: {
        ...(defaultConfig.providerOptions?.azureOpenAI || {}),
        ...(user.providerOptions?.azureOpenAI || {}),
        request: {
          ...(defaultConfig.providerOptions?.azureOpenAI?.request || {}),
          ...(user.providerOptions?.azureOpenAI?.request || {})
        }
      }
    },
    output: { ...defaultConfig.output, ...(user.output || {}) }
  }
  return merged
}
