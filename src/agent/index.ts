/**
 * Agent 模块入口
 */

// 导出编排器
export { createOrchestrator } from './orchestrator.js'

// 导出工具
export { toolDefinitions, executeTool, executeTools } from './tools/index.js'

// 导出 prompts
export { buildAgentSystemPrompt, buildAgentUserPrompt } from './prompts/system.js'

// 导出类型
export type {
  AgentMessage,
  AgentReviewInput,
  AgentReviewOptions,
  OrchestratorState,
  AgentProvider,
  LLMCallFunction,
  AgentOrchestrator
} from './types.js'

export type {
  ToolDefinition,
  ToolCall,
  ToolResult,
  ReadFileParams,
  ReadFileResult,
  SearchContentParams,
  SearchContentResult,
  ListDirectoryParams,
  ListDirectoryResult
} from './tools/types.js'
