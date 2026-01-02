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

const HOOK_SCRIPT = `./node_modules/.bin/code-gate-hook`

function initGitHooks(cwd: string) {
  const hooksDir = path.join(cwd, '.githooks')
  const preCommit = path.join(hooksDir, 'pre-commit')
  ensurePreCommitContains(preCommit, HOOK_SCRIPT, 'git')
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
  ensurePreCommitContains(preCommit, HOOK_SCRIPT, 'husky')
  spawnSync('git', ['config', 'core.hooksPath', '.husky'], { cwd, stdio: 'inherit' })
  process.stdout.write('code-gate: initialized with husky (.husky)\n')
}

function generateConfig(cwd: string, force = false) {
  const configPath = path.join(cwd, '.codegate.js')
  if (fs.existsSync(configPath) && !force) return
  const content = `// code-gate config
export default {
  provider: 'ollama',
  providerOptions: {
    ollama: {
      baseURL: 'http://localhost:11434',
      model: 'qwen2.5-coder',
      concurrencyFiles: 1
    },
    deepseek: {
      baseURL: 'https://api.deepseek.com',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      model: 'deepseek-chat',
      concurrencyFiles: 4
    }
    // openai: { baseURL: 'https://api.openai.com/v1', apiKeyEnv: 'OPENAI_API_KEY', model: 'gpt-4o-mini' },
    // anthropic: { baseURL: 'https://api.anthropic.com', apiKeyEnv: 'ANTHROPIC_API_KEY', model: 'claude-3-5-sonnet' },
    // azureOpenAI: { endpoint: 'https://your-endpoint.openai.azure.com', apiKeyEnv: 'AZURE_OPENAI_KEY', deployment: 'gpt-4o-mini', apiVersion: '2024-08-01-preview' }
    // aliyun: { baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKeyEnv: 'DASHSCOPE_API_KEY', model: 'qwen-plus' },
    // volcengine: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', apiKeyEnv: 'VOLCENGINE_API_KEY', model: 'doubao-pro-32k' },
    // zhipu: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', apiKeyEnv: 'ZHIPU_API_KEY', model: 'glm-4' }
  },
  fileTypes: [],
  exclude: ['**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'],
  ui: {
    openBrowser: true,
    port: 5175
  },
  limits: {
    maxDiffLines: 10000,
    maxFiles: 100
  },
  reviewMode: 'files',
  language: 'en',
  prompt: 'As a senior code review engineer, review this change from the perspectives of security, performance, code style, and test coverage. Point out issues and suggestions for improvement, and provide necessary example patches.',
  output: {
     dir: '.review-logs'
   }
 }
 `
  fs.writeFileSync(configPath, content, 'utf8')
  process.stdout.write('code-gate: generated .codegate.js\n')
}

async function checkAndAddToGitignore(cwd: string) {
  const ignoreList = ['.codegate.js', '.review-logs']
  const gitignorePath = path.join(cwd, '.gitignore')
  
  // Filter out already ignored
  let content = ''
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8')
  }
  
  const toAdd = ignoreList.filter(item => !content.includes(item))
  
  if (toAdd.length === 0) return

  log.info(picocolors.yellow('Detected the following files suggested to be added to .gitignore:'))
  for (const item of toAdd) {
    console.log(picocolors.dim(`  - ${item}`))
  }

  const shouldIgnore = await confirm({
    message: 'Add these files to .gitignore?',
    initialValue: true
  })

  if (shouldIgnore === true) {
    const append = (content.endsWith('\n') || content === '') ? '' : '\n'
    fs.appendFileSync(gitignorePath, `${append}${toAdd.join('\n')}\n`, 'utf8')
    log.success(picocolors.green('Updated .gitignore'))
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
  else initGitHooks(cwd)
  if (genConfig) generateConfig(cwd, force)

  await checkAndAddToGitignore(cwd)
  
  outro(picocolors.green('Initialization completed!'))
}
