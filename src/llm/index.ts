import { Config } from '../config/types.js'
import { LLMProvider } from './base.js'
import { DeepSeekProvider } from './providers/deepseek.js'
import { OllamaProvider } from './providers/ollama.js'
import { OpenAIProvider } from './providers/openai.js'
import { AnthropicProvider } from './providers/anthropic.js'
import { GeminiProvider } from './providers/gemini.js'
import { MistralProvider } from './providers/mistral.js'
import { CohereProvider } from './providers/cohere.js'
import { AzureOpenAIProvider } from './providers/azure.js'

export * from './base.js'

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
    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}
