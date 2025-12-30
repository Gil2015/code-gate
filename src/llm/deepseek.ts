import OpenAI from 'openai'
import { Config } from '../config.js'

export interface ReviewInput {
  prompt: string
  diff: string
}

export async function deepseekReview(cfg: Config, input: ReviewInput): Promise<string> {
  const baseURL =
    (cfg.providerOptions?.deepseek?.baseURL || 'https://api.deepseek.com').replace(/`/g, '').trim()
  const apiKeyEnv = cfg.providerOptions?.deepseek?.apiKeyEnv || 'DEEPSEEK_API_KEY'
  const apiKey = process.env[apiKeyEnv]
  if (!apiKey) throw new Error(`Missing DeepSeek API key in ${apiKeyEnv}`)
  const client = new OpenAI({ baseURL, apiKey })
  const model = cfg.providerOptions?.deepseek?.model || 'deepseek-chat'
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: input.prompt },
      {
        role: 'user',
        content:
          '请根据以下 git diff 进行代码审查，输出问题清单与改进建议，必要时给出补丁示例：\n\n' +
          input.diff
      }
    ]
  })
  const content = res.choices?.[0]?.message?.content || ''
  return content
}
