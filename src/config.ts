import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

export type Provider = 'ollama' | 'deepseek'

export interface Config {
  provider: Provider
  review?: {
    provider?: Provider
    enabled?: boolean
    mode?: 'aggregate' | 'per_file'
  }
  ollama?: {
    baseURL?: string
    model?: string
  }
  deepseek?: {
    baseURL?: string
    apiKeyEnv?: string
    model?: string
  }
  fileTypes?: string[]
  scope?:
    | 'staged'
    | 'allChanged'
    | {
        include?: string[]
        exclude?: string[]
      }
  ui?: {
    openBrowser?: boolean
    theme?: 'github'
    port: number
  }
  limits?: {
    maxDiffLines?: number
    maxFiles?: number
  }
  rules?: {
    focus?: Array<'security' | 'performance' | 'style' | 'tests'>
  }
  prompt?: string
  output?: {
    dir?: string
  }
}

const defaultConfig: Config = {
  provider: 'deepseek',
  review: {
    enabled: true,
    mode: 'per_file'
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    model: 'deepseek-chat'
  },
  ollama: {
    baseURL: 'http://localhost:11434',
    model: 'qwen2.5-coder'
  },
  fileTypes: ['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'py', 'go', 'rs'],
  scope: 'staged',
  ui: {
    openBrowser: true,
    theme: 'github',
    port: 5175
  },
  limits: {
    maxDiffLines: 10000,
    maxFiles: 100
  },
  rules: {
    focus: ['security', 'performance', 'style', 'tests']
  },
  prompt:
    '作为资深代码审查工程师，从安全、性能、代码风格与测试覆盖角度审查本次变更，指出问题与改进建议，并给出必要的示例补丁。',
  output: {
    dir: '.code-gate'
  }
}

function findConfigFile(cwd: string): string | undefined {
  const candidates = [
    path.join(cwd, '.codegate.js'),
    path.join(cwd, '.codegate.cjs'),
    path.join(cwd, 'code-gate.config.json'),
    path.join(cwd, 'code-gate.config.yaml'),
    path.join(cwd, 'code-gate.config.yml'),
    path.join(cwd, '.code-gaterc'),
    path.join(cwd, '.code-gaterc.json'),
    path.join(cwd, '.code-gaterc.yaml'),
    path.join(cwd, '.code-gaterc.yml')
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return undefined
}

async function readFile(p: string): Promise<any> {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.js' || ext === '.cjs') {
    const { pathToFileURL } = await import('node:url')
    const mod = await import(pathToFileURL(p).href)
    return mod?.default ?? mod
  }
  const raw = fs.readFileSync(p, 'utf8')
  if (ext === '.yaml' || ext === '.yml') return yaml.parse(raw)
  return JSON.parse(raw)
}

export async function loadConfig(cwd = process.cwd()): Promise<Config> {
  const p = findConfigFile(cwd)
  if (!p) return { ...defaultConfig }
  const user = (await readFile(p)) || {}
  const merged: Config = {
    ...defaultConfig,
    ...user,
    review: { ...defaultConfig.review, ...(user.review || {}) },
    deepseek: { ...defaultConfig.deepseek, ...(user.deepseek || {}) },
    ollama: { ...defaultConfig.ollama, ...(user.ollama || {}) },
    ui: { ...defaultConfig.ui, ...(user.ui || {}) },
    limits: { ...defaultConfig.limits, ...(user.limits || {}) },
    rules: { ...defaultConfig.rules, ...(user.rules || {}) },
    output: { ...defaultConfig.output, ...(user.output || {}) }
  }
  return merged
}
