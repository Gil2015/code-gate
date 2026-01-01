import OpenAI from 'openai'
import { BaseLLMProvider, ReviewInput } from '../base.js'

export class ZhipuProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.zhipu
    const baseURL = (opts?.baseURL || 'https://open.bigmodel.cn/api/paas/v4').replace(/`/g, '').trim()
    const apiKeyEnv = opts?.apiKeyEnv || 'ZHIPU_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing Zhipu AI API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    const client = new OpenAI({ baseURL, apiKey })
    const model = opts?.model || 'glm-4'

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
