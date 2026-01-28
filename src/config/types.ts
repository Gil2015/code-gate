export type Provider = 'ollama' | 'deepseek' | 'openai' | 'anthropic' | 'gemini' | 'cohere' | 'mistral' | 'azureOpenAI' | 'aliyun' | 'volcengine' | 'zhipu'

export interface ProviderRequestOptions {
  timeout?: number
  retries?: number
  backoffMs?: number
  temperature?: number
  top_p?: number
  max_tokens?: number
}

export interface ProviderConfig {
  baseURL?: string
  apiKey?: string
  apiKeyEnv?: string
  model?: string
  concurrencyFiles?: number
  request?: ProviderRequestOptions
  [key: string]: any // Allow extra properties
}

export interface AzureOpenAIConfig extends ProviderConfig {
  endpoint?: string
  deployment?: string
  apiVersion?: string
}

export interface AgentConfig {
  enabled: boolean           // 是否启用 Agent 模式
  maxIterations?: number     // 最大迭代次数，默认 5
  maxToolCalls?: number      // 单次迭代最大工具调用数，默认 10
}

export interface Config {
  provider: Provider
  providerOptions?: {
    ollama?: ProviderConfig
    deepseek?: ProviderConfig
    openai?: ProviderConfig
    anthropic?: ProviderConfig
    gemini?: ProviderConfig
    cohere?: ProviderConfig
    mistral?: ProviderConfig
    azureOpenAI?: AzureOpenAIConfig
    aliyun?: ProviderConfig
    volcengine?: ProviderConfig
    zhipu?: ProviderConfig
  }
  fileTypes?: string[]
  exclude?: string[]
  ui?: {
    openBrowser?: boolean
    showLogo?: boolean
    port: number
  }
  limits?: {
    maxDiffLines?: number
    maxFiles?: number
  }
  reviewMode?: 'summary' | 'files' | 'both'
  prompt?: string
  language?: 'zh-CN' | 'en' | 'ja' | 'ko' | 'de' | 'fr'
  output?: {
    dir?: string
  }
  agent?: AgentConfig
}
