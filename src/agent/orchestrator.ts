/**
 * Agent 编排器
 * 实现 Agent 循环逻辑，协调 LLM 调用和工具执行
 */

import type { Config } from '../config/types.js'
import type {
  AgentMessage,
  AgentReviewInput,
  AgentReviewOptions,
  OrchestratorState,
  LLMCallFunction,
  AgentOrchestrator
} from './types.js'
import type { ToolDefinition } from './tools/types.js'
import { toolDefinitions, executeTools } from './tools/index.js'
import { buildAgentSystemPrompt, buildAgentUserPrompt } from './prompts/system.js'

/**
 * 创建 Agent 编排器
 * @param config 配置
 * @param llmCall LLM 调用函数
 */
export function createOrchestrator(
  _config: Config,
  llmCall: LLMCallFunction
): AgentOrchestrator {

  /**
   * 运行 Agent 循环
   */
  async function run(
    input: AgentReviewInput,
    options: AgentReviewOptions
  ): Promise<string> {
    const { maxIterations, maxToolCalls, onToolCall, onIteration } = options

    // 初始化状态
    const state: OrchestratorState = {
      messages: [
        {
          role: 'system',
          content: buildAgentSystemPrompt(input.prompt)
        },
        {
          role: 'user',
          content: buildAgentUserPrompt(input.diff, input.files)
        }
      ],
      iteration: 0,
      totalToolCalls: 0,
      done: false
    }

    // Agent 循环
    while (!state.done && state.iteration < maxIterations) {
      state.iteration++

      // 调用 LLM
      const response = await llmCall(state.messages, toolDefinitions)

      // 没有工具调用，说明 LLM 已经完成审查，返回最终结果
      if (!response.toolCalls || response.toolCalls.length === 0) {
        state.done = true
        return response.content || ''
      }

      // 检查工具调用数限制
      const callsThisIteration = response.toolCalls.length
      if (state.totalToolCalls + callsThisIteration > maxToolCalls) {
        // 超过限制，强制请求最终结果
        state.done = true
        return await requestFinalResult(state, response.content, llmCall)
      }

      // 触发回调
      onIteration?.(state.iteration, callsThisIteration)
      response.toolCalls.forEach(call => onToolCall?.(call))

      // 执行工具调用
      const results = await executeTools(response.toolCalls)
      state.totalToolCalls += callsThisIteration

      // 添加 assistant 消息（包含工具调用）
      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: response.content,
        tool_calls: response.toolCalls
      }
      // DeepSeek Reasoner 模型需要保留 reasoning_content
      if (response.reasoning_content) {
        (assistantMessage as any).reasoning_content = response.reasoning_content
      }
      state.messages.push(assistantMessage)

      // 添加工具结果消息
      for (const result of results) {
        state.messages.push({
          role: 'tool',
          tool_call_id: result.id,
          name: result.name,
          content: result.error
            ? JSON.stringify({ error: result.error })
            : JSON.stringify(result.result)
        })
      }
    }

    // 达到最大迭代次数，强制请求最终结果
    if (!state.done) {
      return await requestFinalResult(state, null, llmCall)
    }

    return ''
  }

  return { run }
}

/**
 * 请求 LLM 输出最终结果
 */
async function requestFinalResult(
  state: OrchestratorState,
  lastContent: string | null,
  llmCall: LLMCallFunction
): Promise<string> {
  // 如果上一次响应有内容，先添加到消息历史
  if (lastContent) {
    state.messages.push({
      role: 'assistant',
      content: lastContent
    })
  }

  // 添加请求最终结果的消息
  state.messages.push({
    role: 'user',
    content: '已达到工具调用次数上限或迭代次数上限。请根据已获取的信息，输出最终的代码审查报告。'
  })

  // 调用 LLM，不提供工具（强制输出文本）
  const emptyTools: ToolDefinition[] = []
  const finalResponse = await llmCall(state.messages, emptyTools)

  return finalResponse.content || ''
}

// 导出类型
export type { AgentOrchestrator } from './types.js'
