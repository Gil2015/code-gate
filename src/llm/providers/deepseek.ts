import OpenAI from 'openai'
import { BaseAgentProvider, ReviewInput } from '../base.js'
import type { AgentMessage } from '../../agent/types.js'
import type { ToolDefinition, ToolCall } from '../../agent/tools/types.js'

export class DeepSeekProvider extends BaseAgentProvider {
  private client: OpenAI | null = null

  /**
   * 获取或创建 OpenAI 客户端
   */
  private getClient(): OpenAI {
    if (this.client) {
      return this.client
    }

    const opts = this.config.providerOptions?.deepseek
    // Clean up baseURL to avoid issues with copy-pasted configs containing backticks
    const baseURL = (opts?.baseURL || 'https://api.deepseek.com').replace(/`/g, '').trim()
    const apiKeyEnv = opts?.apiKeyEnv || 'DEEPSEEK_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing DeepSeek API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    this.client = new OpenAI({ baseURL, apiKey })
    return this.client
  }

  /**
   * 普通模式审查
   */
  async review(input: ReviewInput): Promise<string> {
    const client = this.getClient()
    const opts = this.config.providerOptions?.deepseek
    const model = opts?.model || 'deepseek-chat'

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

  /**
   * 带工具的 LLM 调用（Agent 模式使用）
   */
  protected async callLLMWithTools(
    messages: AgentMessage[],
    tools: ToolDefinition[]
  ): Promise<{ content: string | null; toolCalls: ToolCall[]; reasoning_content?: string }> {
    const client = this.getClient()
    const opts = this.config.providerOptions?.deepseek
    const model = opts?.model || 'deepseek-chat'

    // 检测是否使用 Reasoner 模型
    const isReasonerModel = model.includes('reasoner')

    // 转换消息格式
    const openaiMessages = messages.map(m => {
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          content: m.content || '',
          tool_call_id: m.tool_call_id
        }
      }

      if (m.role === 'assistant' && m.tool_calls) {
        const assistantMsg: any = {
          role: 'assistant' as const,
          content: m.content,
          tool_calls: m.tool_calls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments)
            }
          }))
        }
        // DeepSeek Reasoner 模型需要保留 reasoning_content
        if (isReasonerModel && (m as any).reasoning_content) {
          assistantMsg.reasoning_content = (m as any).reasoning_content
        }
        return assistantMsg
      }

      return {
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content || ''
      }
    })

    // 调用 API
    const response = await client.chat.completions.create({
      model,
      messages: openaiMessages,
      tools: tools.length > 0 ? tools.map(t => ({
        type: 'function' as const,
        function: t.function
      })) : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      ...opts?.request
    })

    const message = response.choices?.[0]?.message as any

    // 解析工具调用
    const toolCalls: ToolCall[] = (message?.tool_calls || []).map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}')
    }))

    return {
      content: message?.content || null,
      toolCalls,
      // DeepSeek Reasoner 模型会返回 reasoning_content
      reasoning_content: message?.reasoning_content
    }
  }
}
