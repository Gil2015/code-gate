import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { confirm, intro, outro, log } from '@clack/prompts'
import picocolors from 'picocolors'

function writeFileSafe(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content, 'utf8')
}

function isGitRepo(cwd: string) {
  const res = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd })
  return res.status === 0
}

function initGitHooks(cwd: string) {
  const hooksDir = path.join(cwd, '.githooks')
  const preCommit = path.join(hooksDir, 'pre-commit')
  const hookLine = `npx code-gate hook`
  ensurePreCommitContains(preCommit, hookLine, 'git')
  spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd, stdio: 'inherit' })
  process.stdout.write('code-gate: initialized with native git hooks (.githooks)\n')
}

function ensurePreCommitContains(p: string, line: string, type: 'husky' | 'git') {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8')
    if (!content.includes(line)) {
      fs.writeFileSync(p, content.trimEnd() + '\n' + line + '\n', 'utf8')
    }
    return
  }
  if (type === 'husky') {
    const content = [
      '#!/usr/bin/env sh',
      '. "$(dirname -- "$0")/_/husky.sh"',
      line
    ].join('\n') + '\n'
    writeFileSafe(p, content)
    fs.chmodSync(p, 0o755)
    return
  }
  const content = ['#!/usr/bin/env sh', line].join('\n') + '\n'
  writeFileSafe(p, content)
  fs.chmodSync(p, 0o755)
}

function initHusky(cwd: string) {
  const huskyDir = path.join(cwd, '.husky')
  if (!fs.existsSync(huskyDir)) {
    spawnSync('npx', ['husky', 'init'], { cwd, stdio: 'inherit' })
  }
  const preCommit = path.join(huskyDir, 'pre-commit')
  const hookLine = `npx code-gate hook`
  ensurePreCommitContains(preCommit, hookLine, 'husky')
  spawnSync('git', ['config', 'core.hooksPath', '.husky'], { cwd, stdio: 'inherit' })
  process.stdout.write('code-gate: initialized with husky (.husky)\n')
}

function initSimpleGitHooks(cwd: string) {
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    process.stderr.write('code-gate: package.json not found for simple-git-hooks\n')
    return
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg['simple-git-hooks'] = { ...(pkg['simple-git-hooks'] || {}), 'pre-commit': 'npx code-gate hook' }
  pkg.scripts = { ...(pkg.scripts || {}), postinstall: 'simple-git-hooks' }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8')
  process.stdout.write('code-gate: initialized simple-git-hooks config in package.json\n')
}

function generateConfig(cwd: string, force = false) {
  const configPath = path.join(cwd, '.codegate.js')
  if (fs.existsSync(configPath) && !force) return
  const content = `// code-gate 配置文件
// provider: 选择使用的 AI 审查引擎，可选值: 'ollama' | 'deepseek'
// providerOptions: 各 Provider 的配置集合（选填）
//   - deepseek: { baseURL, apiKey, apiKeyEnv, model }
//   - ollama: { baseURL, model }
//   - openai: { baseURL, apiKey, apiKeyEnv, model }
//   - anthropic: { baseURL, apiKey, apiKeyEnv, model }
//   - gemini: { baseURL, apiKey, apiKeyEnv, model }
//   - cohere: { baseURL, apiKey, apiKeyEnv, model }
//   - mistral: { baseURL, apiKey, apiKeyEnv, model }
//   - azureOpenAI: { endpoint, apiKey, apiKeyEnv, deployment, apiVersion }
//   - aliyun: { baseURL, apiKey, apiKeyEnv, model }
//   - volcengine: { baseURL, apiKey, apiKeyEnv, model }
//   - zhipu: { baseURL, apiKey, apiKeyEnv, model }
//   注：apiKey 优先级：环境变量(apiKeyEnv) > 配置文件(apiKey)
// fileTypes: 需要审查的文件类型扩展名列表
// ui: 页面与交互设置
//   - openBrowser: 是否自动打开浏览器
//   - port: 预览服务端口
// 并发：providerOptions.<provider>.concurrencyFiles 控制按文件的并发审查（默认 DeepSeek=4、Ollama=1，最大 8）
// limits: 限制项
//   - maxDiffLines: 最大 diff 行数
//   - maxFiles: 最大审查文件数
// prompt: 通用提示词
// 行为：reviewMode 审查模式：'summary' | 'files' | 'both'（默认 'files'；'both' 时汇总最后执行）
// output: 输出目录配置
//   - dir: 本地输出目录

export default {
  provider: 'deepseek',
  providerOptions: {
    deepseek: { baseURL: 'https://api.deepseek.com', apiKeyEnv: 'DEEPSEEK_API_KEY', model: 'deepseek-chat', concurrencyFiles: 4, request: { retries: 1, backoffMs: 300 } },
    ollama: { baseURL: 'http://localhost:11434', model: 'qwen3:8b', concurrencyFiles: 1, request: { timeout: 15000, retries: 1, backoffMs: 300 } }
    // openai: { baseURL: 'https://api.openai.com/v1', apiKeyEnv: 'OPENAI_API_KEY', model: 'gpt-4o-mini' },
    // anthropic: { baseURL: 'https://api.anthropic.com', apiKeyEnv: 'ANTHROPIC_API_KEY', model: 'claude-3-5-sonnet' },
    // azureOpenAI: { endpoint: 'https://your-endpoint.openai.azure.com', apiKeyEnv: 'AZURE_OPENAI_KEY', deployment: 'gpt-4o-mini', apiVersion: '2024-08-01-preview' }
    // aliyun: { baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKeyEnv: 'DASHSCOPE_API_KEY', model: 'qwen-plus' },
    // volcengine: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', apiKeyEnv: 'VOLCENGINE_API_KEY', model: 'doubao-pro-32k' },
    // zhipu: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', apiKeyEnv: 'ZHIPU_API_KEY', model: 'glm-4' }
  },
  fileTypes: ['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'py', 'go', 'rs'],
  ui: { openBrowser: true, port: 5175 },
  limits: { maxDiffLines: 10000, maxFiles: 100 },
  reviewMode: 'files',
  prompt: '作为资深代码审查工程师，从安全、性能、代码风格与测试覆盖角度审查本次变更，指出问题与改进建议，并给出必要的示例补丁。',
  output: { dir: '.code-gate' }
}
`
  fs.writeFileSync(configPath, content, 'utf8')
  process.stdout.write('code-gate: generated .codegate.js\n')
}

async function checkAndAddToGitignore(cwd: string) {
  const ignoreList = ['.codegate.js', '.code-gate']
  const gitignorePath = path.join(cwd, '.gitignore')
  
  // Filter out already ignored
  let content = ''
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8')
  }
  
  const toAdd = ignoreList.filter(item => !content.includes(item))
  
  if (toAdd.length === 0) return

  log.info(picocolors.yellow('检测到以下文件建议添加到 .gitignore:'))
  for (const item of toAdd) {
    console.log(picocolors.dim(`  - ${item}`))
  }

  const shouldIgnore = await confirm({
    message: '是否将上述文件添加到 .gitignore 配置中？',
    initialValue: true
  })

  if (shouldIgnore === true) {
    const append = (content.endsWith('\n') || content === '') ? '' : '\n'
    fs.appendFileSync(gitignorePath, `${append}${toAdd.join('\n')}\n`, 'utf8')
    log.success(picocolors.green('已更新 .gitignore'))
  }
}

export async function runInit(method: string, genConfig: boolean, force = false) {
  const cwd = process.cwd()
  
  intro(picocolors.bgBlue(picocolors.white(' Code Gate Init ')))

  if (!isGitRepo(cwd)) {
    log.error('not a git repository')
    process.exit(1)
    return
  }
  if (method === 'husky') initHusky(cwd)
  else if (method === 'simple') initSimpleGitHooks(cwd)
  else initGitHooks(cwd)
  if (genConfig) generateConfig(cwd, force)

  await checkAndAddToGitignore(cwd)
  
  outro(picocolors.green('Initialization completed!'))
}
