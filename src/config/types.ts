export type Provider = 'ollama' | 'deepseek' | 'openai' | 'anthropic' | 'gemini' | 'cohere' | 'mistral' | 'azureOpenAI'

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
