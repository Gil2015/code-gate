/**
 * 工具注册入口
 * 统一管理所有 Agent 工具的定义和执行
 */

import type { ToolDefinition, ToolCall, ToolResult } from './types.js'
import { readFileTool, executeReadFile } from './read-file.js'
import { searchContentTool, executeSearchContent } from './search-content.js'
import { listDirectoryTool, executeListDirectory } from './list-directory.js'

// ============ 工具定义列表 ============

export const toolDefinitions: ToolDefinition[] = [
  readFileTool,
  searchContentTool,
  listDirectoryTool
]

// ============ 工具执行器映射 ============

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolExecutorFn = (args: any) => Promise<unknown>

const executors: Record<string, ToolExecutorFn> = {
  read_file: executeReadFile,
  search_content: executeSearchContent,
  list_directory: executeListDirectory
}

// ============ 工具执行函数 ============

/**
 * 执行单个工具调用
 */
export async function executeTool(call: ToolCall): Promise<ToolResult> {
  const executor = executors[call.name]

  if (!executor) {
    return {
      id: call.id,
      name: call.name,
      result: null,
      error: `Unknown tool: ${call.name}`
    }
  }

  try {
    const result = await executor(call.arguments)
    return {
      id: call.id,
      name: call.name,
      result
    }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e)
    return {
      id: call.id,
      name: call.name,
      result: null,
      error
    }
  }
}

/**
 * 并行执行多个工具调用
 */
export async function executeTools(calls: ToolCall[]): Promise<ToolResult[]> {
  return Promise.all(calls.map(executeTool))
}

// ============ 导出类型 ============

export type { ToolDefinition, ToolCall, ToolResult } from './types.js'
