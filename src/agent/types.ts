/**
 * Agent 核心类型定义
 */

import type { ToolCall, ToolDefinition } from './tools/types.js'

// ============ Agent 消息类型 ============

export interface AgentMessageBase {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
}

export interface AgentSystemMessage extends AgentMessageBase {
  role: 'system'
  content: string
}

export interface AgentUserMessage extends AgentMessageBase {
  role: 'user'
  content: string
}

export interface AgentAssistantMessage extends AgentMessageBase {
  role: 'assistant'
  tool_calls?: ToolCall[]
  reasoning_content?: string  // DeepSeek Reasoner 模型需要
}

export interface AgentToolMessage extends AgentMessageBase {
  role: 'tool'
  tool_call_id: string
  name: string
}

export type AgentMessage =
  | AgentSystemMessage
  | AgentUserMessage
  | AgentAssistantMessage
  | AgentToolMessage

// ============ Agent 审查输入 ============

export interface AgentReviewInput {
  prompt: string          // 系统 prompt
  diff: string            // diff 内容
  files: string[]         // 变更的文件列表
}

// ============ Agent 审查选项 ============

export interface AgentReviewOptions {
  maxIterations: number   // 最大迭代次数
  maxToolCalls: number    // 最大工具调用次数
  onToolCall?: (call: ToolCall) => void
  onIteration?: (iteration: number, toolCalls: number) => void
}

// ============ Agent 编排器状态 ============

export interface OrchestratorState {
  messages: AgentMessage[]
  iteration: number
  totalToolCalls: number
  done: boolean
}

// ============ Agent Provider 接口 ============

export interface AgentProvider {
  reviewWithAgent(
    input: AgentReviewInput,
    options: AgentReviewOptions
  ): Promise<string>
}

// ============ LLM 调用函数类型 ============

export type LLMCallFunction = (
  messages: AgentMessage[],
  tools: ToolDefinition[]
) => Promise<{
  content: string | null
  toolCalls: ToolCall[]
  reasoning_content?: string  // DeepSeek Reasoner 模型返回
}>

// ============ Agent 编排器接口 ============

export interface AgentOrchestrator {
  run(input: AgentReviewInput, options: AgentReviewOptions): Promise<string>
}
