import OpenAI from 'openai'
import { BaseLLMProvider, ReviewInput } from '../base.js'

export class OpenAIProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.openai
    const apiKeyEnv = opts?.apiKeyEnv || 'OPENAI_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing OpenAI API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    const client = new OpenAI({
      baseURL: opts?.baseURL, // Optional, defaults to https://api.openai.com/v1
      apiKey
    })
    const model = opts?.model || 'gpt-4o'

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
