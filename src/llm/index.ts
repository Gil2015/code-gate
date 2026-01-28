import { Config } from '../config/types.js'
import { LLMProvider, AgentLLMProvider } from './base.js'
import { DeepSeekProvider } from './providers/deepseek.js'
import { OllamaProvider } from './providers/ollama.js'
import { OpenAIProvider } from './providers/openai.js'
import { AnthropicProvider } from './providers/anthropic.js'
import { GeminiProvider } from './providers/gemini.js'
import { MistralProvider } from './providers/mistral.js'
import { CohereProvider } from './providers/cohere.js'
import { AzureOpenAIProvider } from './providers/azure.js'
import { AliyunProvider } from './providers/aliyun.js'
import { VolcengineProvider } from './providers/volcengine.js'
import { ZhipuProvider } from './providers/zhipu.js'

export * from './base.js'

// 支持 Agent 模式的 Provider 列表
const AGENT_SUPPORTED_PROVIDERS = ['deepseek', 'zhipu'] as const

/**
 * 创建 LLM Provider（普通模式）
 */
export function createLLMProvider(config: Config): LLMProvider {
  switch (config.provider) {
    case 'deepseek':
      return new DeepSeekProvider(config)
    case 'ollama':
      return new OllamaProvider(config)
    case 'openai':
      return new OpenAIProvider(config)
    case 'anthropic':
      return new AnthropicProvider(config)
    case 'gemini':
      return new GeminiProvider(config)
    case 'mistral':
      return new MistralProvider(config)
    case 'cohere':
      return new CohereProvider(config)
    case 'azureOpenAI':
      return new AzureOpenAIProvider(config)
    case 'aliyun':
      return new AliyunProvider(config)
    case 'volcengine':
      return new VolcengineProvider(config)
    case 'zhipu':
      return new ZhipuProvider(config)
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

/**
 * 创建支持 Agent 模式的 Provider
 * 仅 DeepSeek 和 Zhipu 支持 Agent 模式
 */
export function createAgentProvider(config: Config): AgentLLMProvider {
  switch (config.provider) {
    case 'deepseek':
      return new DeepSeekProvider(config)
    case 'zhipu':
      return new ZhipuProvider(config)
    default:
      throw new Error(`Agent mode not supported for provider: ${config.provider}. Supported providers: ${AGENT_SUPPORTED_PROVIDERS.join(', ')}`)
  }
}

/**
 * 检查 Provider 是否支持 Agent 模式
 */
export function supportsAgent(provider: string): boolean {
  return (AGENT_SUPPORTED_PROVIDERS as readonly string[]).includes(provider)
}
