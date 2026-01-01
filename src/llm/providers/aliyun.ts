import OpenAI from 'openai'
import { BaseLLMProvider, ReviewInput } from '../base.js'

export class AliyunProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.aliyun
    const baseURL = (opts?.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/`/g, '').trim()
    const apiKeyEnv = opts?.apiKeyEnv || 'DASHSCOPE_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing Aliyun DashScope API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    const client = new OpenAI({ baseURL, apiKey })
    const model = opts?.model || 'qwen-plus'

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
