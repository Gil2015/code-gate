import { Config } from '../config.js'

export interface ReviewInput {
  prompt: string
  diff: string
}

export async function ollamaReview(cfg: Config, input: ReviewInput): Promise<string> {
  const baseURL = cfg.providerOptions?.ollama?.baseURL || 'http://localhost:11434'
  const model = cfg.providerOptions?.ollama?.model || 'qwen2.5-coder'
  const chatUrl = `${baseURL}/api/chat`
  const chatBody = {
    model,
    messages: [
      { role: 'system', content: input.prompt },
      {
        role: 'user',
        content:
          '请根据以下 git diff 进行代码审查，输出问题清单与改进建议，必要时给出补丁示例：\n\n' +
          input.diff
      }
    ],
    stream: false
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort('timeout'), 15000)
  let res: Response
  try {
    res = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatBody),
      signal: controller.signal
    })
  } catch (e: any) {
    clearTimeout(timer)
    // Fallback to generate endpoint on network or abort
    const genUrl = `${baseURL}/api/generate`
    const genBody = {
      model,
      prompt:
        input.prompt +
        '\n\n请根据以下 git diff 进行代码审查，输出问题清单与改进建议，必要时给出补丁示例：\n\n' +
        input.diff,
      stream: false
    }
    const res2 = await fetch(genUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(genBody)
    })
    if (!res2.ok) {
      const txt = await res2.text().catch(() => '')
      throw new Error(`Ollama generate failed: ${res2.status} ${txt}`)
    }
    const data2 = await res2.json()
    return (data2?.response as string) || ''
  }
  clearTimeout(timer)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    // Fallback to generate endpoint on bad status
    const genUrl = `${baseURL}/api/generate`
    const genBody = {
      model,
      prompt:
        input.prompt +
        '\n\n请根据以下 git diff 进行代码审查，输出问题清单与改进建议，必要时给出补丁示例：\n\n' +
        input.diff,
      stream: false
    }
    const res2 = await fetch(genUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(genBody)
    })
    if (!res2.ok) {
      const txt2 = await res2.text().catch(() => '')
      throw new Error(`Ollama request failed: ${res.status} ${txt}; generate failed: ${res2.status} ${txt2}`)
    }
    const data2 = await res2.json()
    return (data2?.response as string) || ''
  }
  const data = await res.json()
  const content =
    (data?.message?.content as string) ||
    (data?.messages?.[data.messages.length - 1]?.content as string) ||
    ''
  return content
}
