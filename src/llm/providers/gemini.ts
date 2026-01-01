import { BaseLLMProvider, ReviewInput } from '../base.js'

export class GeminiProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.gemini
    const apiKeyEnv = opts?.apiKeyEnv || 'GEMINI_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing Gemini API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    const baseURL = opts?.baseURL || 'https://generativelanguage.googleapis.com/v1beta'
    const model = opts?.model || 'gemini-1.5-flash'
    
    const url = `${baseURL}/models/${model}:generateContent?key=${apiKey}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: input.prompt + '\n\n' + this.buildUserPrompt(input.diff) }]
          }],
          generationConfig: {
            temperature: opts?.request?.temperature,
            maxOutputTokens: opts?.request?.max_tokens,
            topP: opts?.request?.top_p
          }
        })
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Gemini API error: ${res.status} ${txt}`)
      }

      const data = await res.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch (e: any) {
      throw new Error(`Gemini review failed: ${e.message}`)
    }
  }
}
