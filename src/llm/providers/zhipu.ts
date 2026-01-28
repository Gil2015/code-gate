import OpenAI from 'openai'
import { BaseAgentProvider, ReviewInput } from '../base.js'
import type { AgentMessage } from '../../agent/types.js'
import type { ToolDefinition, ToolCall } from '../../agent/tools/types.js'

export class ZhipuProvider extends BaseAgentProvider {
  private client: OpenAI | null = null

  /**
   * 获取或创建 OpenAI 客户端
   */
  private getClient(): OpenAI {
    if (this.client) {
      return this.client
    }

    const opts = this.config.providerOptions?.zhipu
    const baseURL = (opts?.baseURL || 'https://open.bigmodel.cn/api/paas/v4').replace(/`/g, '').trim()
    const apiKeyEnv = opts?.apiKeyEnv || 'ZHIPU_API_KEY'
    const apiKey = process.env[apiKeyEnv] || opts?.apiKey

    if (!apiKey) {
      throw new Error(`Missing Zhipu AI API key. Please set ${apiKeyEnv} in environment variables or configure 'apiKey' in .codegate.js`)
    }

    this.client = new OpenAI({ baseURL, apiKey })
    return this.client
  }

  /**
   * 普通模式审查
   */
  async review(input: ReviewInput): Promise<string> {
    const client = this.getClient()
    const opts = this.config.providerOptions?.zhipu
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

  /**
   * 带工具的 LLM 调用（Agent 模式使用）
   */
  protected async callLLMWithTools(
    messages: AgentMessage[],
    tools: ToolDefinition[]
  ): Promise<{ content: string | null; toolCalls: ToolCall[]; reasoning_content?: string }> {
    const client = this.getClient()
    const opts = this.config.providerOptions?.zhipu
    const model = opts?.model || 'glm-4'

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
        return {
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

    const message = response.choices?.[0]?.message

    // 解析工具调用
    const toolCalls: ToolCall[] = (message?.tool_calls || []).map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}')
    }))

    return {
      content: message?.content || null,
      toolCalls
    }
  }
}
