import OpenAI from 'openai'
import { BaseLLMProvider, ReviewInput } from '../base.js'

export class AzureOpenAIProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.azureOpenAI
    const apiKeyEnv = opts?.apiKeyEnv || 'AZURE_OPENAI_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey
    
    // Azure specific config
    const endpoint = opts?.endpoint
    const deployment = opts?.deployment
    const apiVersion = opts?.apiVersion || '2024-08-01-preview'

    if (!apiKey) {
      throw new Error(`Missing Azure OpenAI API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }
    if (!endpoint) {
      throw new Error('Missing Azure OpenAI endpoint in config')
    }
    if (!deployment) {
      throw new Error('Missing Azure OpenAI deployment name in config')
    }

    const client = new OpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${deployment}`,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': apiKey }
    })

    const res = await client.chat.completions.create({
      model: deployment, // Azure uses deployment name as model
      messages: [
        { role: 'system', content: input.prompt },
        { role: 'user', content: this.buildUserPrompt(input.diff) }
      ],
      ...opts?.request
    })

    return res.choices?.[0]?.message?.content || ''
  }
}
