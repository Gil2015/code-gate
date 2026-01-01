import { BaseLLMProvider, ReviewInput } from '../base.js'

export class MistralProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.mistral
    const apiKeyEnv = opts?.apiKeyEnv || 'MISTRAL_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing Mistral API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    const baseURL = opts?.baseURL || 'https://api.mistral.ai/v1'
    const model = opts?.model || 'mistral-large-latest'

    try {
      const res = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: input.prompt },
            { role: 'user', content: this.buildUserPrompt(input.diff) }
          ],
          temperature: opts?.request?.temperature,
          max_tokens: opts?.request?.max_tokens,
          top_p: opts?.request?.top_p
        })
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Mistral API error: ${res.status} ${txt}`)
      }

      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (e: any) {
      throw new Error(`Mistral review failed: ${e.message}`)
    }
  }
}
