/**
 * read_file 工具实现
 * 读取文件内容，支持分页
 */

import fs from 'node:fs'
import nodePath from 'node:path'
import type { ToolDefinition, ReadFileParams, ReadFileResult } from './types.js'
import { getGitRoot } from '../../core/git.js'

// 安全配置
const MAX_FILE_SIZE = 100 * 1024  // 100KB
const BLOCKED_PATTERNS = ['.env', '.git/objects', 'node_modules']

// 默认值
const DEFAULT_START_LINE = 1
const DEFAULT_MAX_LINES = 200

/**
 * 工具定义
 */
export const readFileTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'read_file',
    description: '读取文件内容，支持分页。用于查看完整的源代码文件、类型定义、配置文件等。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文件路径（相对于项目根目录）'
        },
        startLine: {
          type: 'number',
          description: `起始行号（从 1 开始），默认 ${DEFAULT_START_LINE}`
        },
        maxLines: {
          type: 'number',
          description: `最大读取行数，默认 ${DEFAULT_MAX_LINES}`
        }
      },
      required: ['path']
    }
  }
}

/**
 * 检查路径是否安全
 */
function isPathSafe(filePath: string, root: string, absolutePath: string): { safe: boolean; error?: string } {
  // 检查路径遍历
  if (!absolutePath.startsWith(root)) {
    return { safe: false, error: 'Access denied: path outside project root' }
  }

  // 检查敏感文件
  for (const pattern of BLOCKED_PATTERNS) {
    if (filePath.includes(pattern)) {
      return { safe: false, error: `Access denied: ${pattern} files are blocked` }
    }
  }

  return { safe: true }
}

/**
 * 执行 read_file 工具
 */
export async function executeReadFile(params: ReadFileParams): Promise<ReadFileResult> {
  const {
    path: filePath,
    startLine = DEFAULT_START_LINE,
    maxLines = DEFAULT_MAX_LINES
  } = params

  // 获取项目根目录
  const root = getGitRoot()
  if (!root) {
    throw new Error('Not in a git repository')
  }

  // 解析绝对路径
  const absolutePath = nodePath.resolve(root, filePath)

  // 安全检查
  const safeCheck = isPathSafe(filePath, root, absolutePath)
  if (!safeCheck.safe) {
    throw new Error(safeCheck.error)
  }

  // 检查文件存在
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  // 检查是否为文件
  const stats = fs.statSync(absolutePath)
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${filePath}`)
  }

  // 检查文件大小
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${stats.size} bytes (max ${MAX_FILE_SIZE})`)
  }

  // 读取文件
  const content = fs.readFileSync(absolutePath, 'utf8')
  const lines = content.split('\n')
  const totalLines = lines.length

  // 计算分页范围
  const start = Math.max(1, startLine)
  const end = Math.min(totalLines, start + maxLines - 1)

  // 提取指定范围的行
  const selectedLines = lines.slice(start - 1, end)

  return {
    content: selectedLines.join('\n'),
    startLine: start,
    endLine: end,
    totalLines,
    total: totalLines,
    hasMore: end < totalLines
  }
}
