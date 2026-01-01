import OpenAI from 'openai'
import { BaseLLMProvider, ReviewInput } from '../base.js'

export class AnthropicProvider extends BaseLLMProvider {
  async review(input: ReviewInput): Promise<string> {
    const opts = this.config.providerOptions?.anthropic
    const apiKeyEnv = opts?.apiKeyEnv || 'ANTHROPIC_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing Anthropic API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    // OpenAI SDK compatible client for Anthropic via baseURL if using a proxy, 
    // BUT usually Anthropic has its own SDK. 
    // For simplicity and uniformity, we can try to use the 'anthropic-openai' adapter OR 
    // just implement a simple fetch for Anthropic API since we don't want to add too many heavy dependencies.
    // However, the user asked for "robustness".
    // Let's use the OpenAI SDK with a custom baseURL if the user provides a compatible proxy,
    // OR we can use the `anthropic` package. But `openai` package is already installed.
    // Let's implement a direct fetch to avoid adding another dependency if possible, OR
    // just use OpenAI SDK structure if the user is using a proxy.
    // WAIT, for Anthropic native API we should use `fetch`.
    
    const baseURL = opts?.baseURL || 'https://api.anthropic.com/v1'
    const model = opts?.model || 'claude-3-5-sonnet-20240620'
    
    try {
      const res = await fetch(`${baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model,
          max_tokens: opts?.request?.max_tokens || 4096,
          messages: [
            { role: 'user', content: `${input.prompt}\n\n${this.buildUserPrompt(input.diff)}` } // Anthropic system prompt is separate usually, but this works
          ],
          system: input.prompt, // New Anthropic API supports system param
          temperature: opts?.request?.temperature
        })
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Anthropic API error: ${res.status} ${txt}`)
      }

      const data = await res.json()
      return data.content?.[0]?.text || ''
    } catch (e: any) {
      throw new Error(`Anthropic review failed: ${e.message}`)
    }
  }
}
