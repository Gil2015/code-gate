/**
 * list_directory 工具实现
 * 列出目录内容，支持递归和分页
 */

import fs from 'node:fs'
import nodePath from 'node:path'
import type { ToolDefinition, ListDirectoryParams, ListDirectoryResult, DirectoryEntry } from './types.js'
import { getGitRoot } from '../../core/git.js'

// 默认值
const DEFAULT_DEPTH = 1
const DEFAULT_OFFSET = 0
const DEFAULT_LIMIT = 50

// 排除的目录/文件
const EXCLUDED_NAMES = [
  'node_modules',
  '.git',
  '.idea',
  '.vscode',
  'dist',
  'build',
  'coverage',
  '__pycache__',
  '.DS_Store',
  'Thumbs.db'
]

/**
 * 工具定义
 */
export const listDirectoryTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'list_directory',
    description: '列出目录内容，了解项目结构。可以递归列出子目录。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '目录路径（相对于项目根目录）'
        },
        depth: {
          type: 'number',
          description: `递归深度，默认 ${DEFAULT_DEPTH}（只列出直接子项）`
        },
        offset: {
          type: 'number',
          description: `跳过前 N 条结果，默认 ${DEFAULT_OFFSET}`
        },
        limit: {
          type: 'number',
          description: `返回最大条数，默认 ${DEFAULT_LIMIT}`
        }
      },
      required: ['path']
    }
  }
}

/**
 * 判断是否应该排除
 */
function shouldExclude(name: string): boolean {
  // 排除隐藏文件（以 . 开头，但不包括 . 和 ..）
  if (name.startsWith('.') && name !== '.' && name !== '..') {
    // 允许一些常见的配置文件
    const allowedDotFiles = ['.codegate.js', '.codegate.ts', '.codegate.json', '.eslintrc.js', '.prettierrc']
    if (!allowedDotFiles.some(f => name.startsWith(f.split('.')[1]))) {
      return true
    }
  }

  return EXCLUDED_NAMES.includes(name)
}

/**
 * 递归收集目录内容
 */
function collectEntries(
  dirPath: string,
  basePath: string,
  maxDepth: number,
  currentDepth: number = 0
): DirectoryEntry[] {
  if (currentDepth >= maxDepth) {
    return []
  }

  const entries: DirectoryEntry[] = []

  try {
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      // 跳过排除的文件/目录
      if (shouldExclude(item)) {
        continue
      }

      const fullPath = nodePath.join(dirPath, item)
      const relativePath = nodePath.relative(basePath, fullPath)

      try {
        const stats = fs.statSync(fullPath)

        if (stats.isDirectory()) {
          entries.push({
            name: relativePath,
            type: 'dir'
          })

          // 递归子目录
          if (currentDepth + 1 < maxDepth) {
            const subEntries = collectEntries(fullPath, basePath, maxDepth, currentDepth + 1)
            entries.push(...subEntries)
          }
        } else if (stats.isFile()) {
          entries.push({
            name: relativePath,
            type: 'file',
            size: stats.size
          })
        }
      } catch {
        // 忽略无法访问的文件
      }
    }
  } catch {
    // 忽略无法访问的目录
  }

  return entries
}

/**
 * 执行 list_directory 工具
 */
export async function executeListDirectory(params: ListDirectoryParams): Promise<ListDirectoryResult> {
  const {
    path: dirPath,
    depth = DEFAULT_DEPTH,
    offset = DEFAULT_OFFSET,
    limit = DEFAULT_LIMIT
  } = params

  // 获取项目根目录
  const root = getGitRoot()
  if (!root) {
    throw new Error('Not in a git repository')
  }

  // 解析目录路径
  const absolutePath = nodePath.resolve(root, dirPath)

  // 安全检查：路径必须在项目根目录内
  if (!absolutePath.startsWith(root)) {
    throw new Error('Access denied: path outside project root')
  }

  // 检查目录存在
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Directory not found: ${dirPath}`)
  }

  // 检查是否为目录
  const stats = fs.statSync(absolutePath)
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`)
  }

  // 收集所有条目
  const allEntries = collectEntries(absolutePath, absolutePath, depth)
  const total = allEntries.length

  // 排序：目录在前，文件在后；同类型按名称排序
  allEntries.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  // 分页
  const pagedEntries = allEntries.slice(offset, offset + limit)

  return {
    entries: pagedEntries,
    total,
    hasMore: offset + limit < total
  }
}
