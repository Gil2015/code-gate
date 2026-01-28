/**
 * Agent 工具类型定义
 */

// ============ 通用分页类型 ============

export interface PaginationParams {
  offset?: number
  limit?: number
}

export interface PaginationResult {
  total: number
  hasMore: boolean
}

// ============ read_file 工具 ============

export interface ReadFileParams {
  path: string
  startLine?: number    // 默认 1
  maxLines?: number     // 默认 200
}

export interface ReadFileResult extends PaginationResult {
  content: string
  startLine: number
  endLine: number
  totalLines: number
}

// ============ search_content 工具 ============

export interface SearchContentParams extends PaginationParams {
  pattern: string
  path?: string         // 默认项目根目录
  // offset 默认 0, limit 默认 20
}

export interface SearchMatch {
  file: string
  line: number
  content: string
}

export interface SearchContentResult extends PaginationResult {
  matches: SearchMatch[]
}

// ============ list_directory 工具 ============

export interface ListDirectoryParams extends PaginationParams {
  path: string
  depth?: number        // 默认 1
  // offset 默认 0, limit 默认 50
}

export interface DirectoryEntry {
  name: string
  type: 'file' | 'dir'
  size?: number
}

export interface ListDirectoryResult extends PaginationResult {
  entries: DirectoryEntry[]
}

// ============ 工具调用类型 ============

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  id: string
  name: string
  result: unknown
  error?: string
}

// ============ 工具定义（OpenAI Function Calling 格式） ============

export interface ToolFunctionDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface ToolDefinition {
  type: 'function'
  function: ToolFunctionDefinition
}

// ============ 工具执行器类型 ============

export type ToolExecutor<P = unknown, R = unknown> = (params: P) => Promise<R>
