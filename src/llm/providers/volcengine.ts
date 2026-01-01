import OpenAI from 'openai'
import { BaseLLMProvider, ReviewInput } from '../base.js'

export class VolcengineProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.volcengine
    const baseURL = (opts?.baseURL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/`/g, '').trim()
    const apiKeyEnv = opts?.apiKeyEnv || 'VOLCENGINE_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing Volcengine API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    const client = new OpenAI({ baseURL, apiKey })
    // Note: Volcengine usually uses an endpoint ID (e.g. ep-2024...) as the model name
    const model = opts?.model

    if (!model) {
      throw new Error('Missing Volcengine model (Endpoint ID). Please configure providerOptions.volcengine.model in .codegate.js')
    }

    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: input.prompt },
        { role: 'user', content: this.buildUserPrompt(input.diff) }
      ],
      ...opts?.request
    })

    return res.choices?.[0]?.message?.content || ''
  }
}
