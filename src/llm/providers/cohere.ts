import { BaseLLMProvider, ReviewInput } from '../base.js'

export class CohereProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.cohere
    const apiKeyEnv = opts?.apiKeyEnv || 'CO_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing Cohere API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    const baseURL = opts?.baseURL || 'https://api.cohere.ai/v1'
    const model = opts?.model || 'command-r-plus'

    try {
      const res = await fetch(`${baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          message: this.buildUserPrompt(input.diff),
          preamble: input.prompt,
          temperature: opts?.request?.temperature,
          p: opts?.request?.top_p
        })
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Cohere API error: ${res.status} ${txt}`)
      }

      const data = await res.json()
      return data.text || ''
    } catch (e: any) {
      throw new Error(`Cohere review failed: ${e.message}`)
    }
  }
}
