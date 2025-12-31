import { BaseLLMProvider, ReviewInput } from '../base.js'

export class OllamaProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.ollama
    const baseURL = opts?.baseURL || 'http://localhost:11434'
    const model = opts?.model || 'qwen2.5-coder'
    const timeout = opts?.request?.timeout || 15000

    const chatUrl = `${baseURL}/api/chat`
    const chatBody = {
      model,
      messages: [
        { role: 'system', content: input.prompt },
        { role: 'user', content: this.buildUserPrompt(input.diff) }
      ],
      stream: false
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort('timeout'), timeout)

    try {
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatBody),
        signal: controller.signal
      })

      clearTimeout(timer)

      if (res.ok) {
        const data = await res.json()
        return (
          (data?.message?.content as string) ||
          (data?.messages?.[data.messages.length - 1]?.content as string) ||
          ''
        )
      }
      
      // If chat endpoint fails, try generate endpoint
      const txt = await res.text().catch(() => '')
      return this.fallbackToGenerate(baseURL, model, input, `Request failed: ${res.status} ${txt}`)

    } catch (e: any) {
      clearTimeout(timer)
      return this.fallbackToGenerate(baseURL, model, input, e?.message || String(e))
    }
  }

  private async fallbackToGenerate(baseURL: string, model: string, input: ReviewInput, errorMsg: string): Promise<string> {
    const genUrl = `${baseURL}/api/generate`
    const genBody = {
      model,
      prompt: input.prompt + '\n\n' + this.buildUserPrompt(input.diff),
      stream: false
    }

    try {
      const res = await fetch(genUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genBody)
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Ollama fallback failed: ${res.status} ${txt} (Original error: ${errorMsg})`)
      }

      const data = await res.json()
      return (data?.response as string) || ''
    } catch (e: any) {
      throw new Error(`Ollama review failed: ${e.message} (Original error: ${errorMsg})`)
    }
  }
}
