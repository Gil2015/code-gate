/**
 * search_content 工具实现
 * 在项目中搜索文件内容，支持分页
 */

import { spawnSync } from 'node:child_process'
import nodePath from 'node:path'
import type { ToolDefinition, SearchContentParams, SearchContentResult, SearchMatch } from './types.js'
import { getGitRoot } from '../../core/git.js'

// 默认值
const DEFAULT_OFFSET = 0
const DEFAULT_LIMIT = 20
const MAX_CONTENT_LENGTH = 200  // 单行内容最大长度

/**
 * 工具定义
 */
export const searchContentTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'search_content',
    description: '在项目中搜索文件内容，支持正则表达式。用于查找函数定义、方法调用、类定义等。',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: '搜索模式（支持正则表达式）'
        },
        path: {
          type: 'string',
          description: '搜索路径（相对于项目根目录），默认为项目根目录'
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
      required: ['pattern']
    }
  }
}

/**
 * 解析 git grep 输出行
 */
function parseGrepLine(line: string): SearchMatch | null {
  // 格式: file:line:content
  const match = line.match(/^(.+?):(\d+):(.*)$/)
  if (match) {
    return {
      file: match[1],
      line: parseInt(match[2], 10),
      content: match[3].substring(0, MAX_CONTENT_LENGTH)
    }
  }
  return null
}

/**
 * 执行 search_content 工具
 */
export async function executeSearchContent(params: SearchContentParams): Promise<SearchContentResult> {
  const {
    pattern,
    path: searchPath = '.',
    offset = DEFAULT_OFFSET,
    limit = DEFAULT_LIMIT
  } = params

  // 获取项目根目录
  const root = getGitRoot()
  if (!root) {
    throw new Error('Not in a git repository')
  }

  // 解析搜索路径
  const absolutePath = nodePath.resolve(root, searchPath)

  // 安全检查：路径必须在项目根目录内
  if (!absolutePath.startsWith(root)) {
    throw new Error('Access denied: path outside project root')
  }

  // 使用 git grep 进行搜索
  // 优点：自动排除 .gitignore 中的文件，速度快
  const result = spawnSync('git', [
    'grep',
    '-n',                    // 显示行号
    '-I',                    // 忽略二进制文件
    '--no-color',            // 不使用颜色
    '-E',                    // 使用扩展正则表达式
    pattern,
    '--',
    searchPath
  ], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024  // 10MB
  })

  // 解析结果
  const lines = (result.stdout || '').split('\n').filter(Boolean)
  const total = lines.length

  // 分页
  const pagedLines = lines.slice(offset, offset + limit)

  // 解析每一行
  const matches: SearchMatch[] = []
  for (const line of pagedLines) {
    const match = parseGrepLine(line)
    if (match) {
      matches.push(match)
    }
  }

  return {
    matches,
    total,
    hasMore: offset + limit < total
  }
}
