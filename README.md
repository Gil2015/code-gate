# code-gate

AI 助力的提交时代码 Review 工具，支持本地 Ollama 或 DeepSeek API，审查 `git commit` 的 `staged diff`，并以 GitHub Diff 风格在本地页面展示结果。

## 安装
- `npm i -D code-gate`

## 初始化与集成
- 推荐使用 `init` 命令，选择初始化方式并自动生成配置文件：
  - 原生 Git Hooks：`npx code-gate init -m git`
  - Husky：`npx code-gate init -m husky`
  - simple-git-hooks：`npx code-gate init -m simple`
  - 跳过配置文件生成：`npx code-gate init --no-config`
- 仍支持旧方式：
  - 原生 Git Hooks 快速安装：`npx code-gate setup`
  - 该命令会创建 `.githooks/pre-commit` 并设置 `core.hooksPath`

## 手动初始化（不覆盖现有钩子）
- Husky：
  - 编辑 `.husky/pre-commit`，在原有内容后追加一行：
    - `npx code-gate hook`
  - 确认 `git config core.hooksPath` 输出 `.husky`
- 原生 Git Hooks：
  - 在项目根创建 `.githooks/pre-commit`，内容示例：
    - `#!/usr/bin/env sh`
    - `npx code-gate hook`
  - 设置 `core.hooksPath`：
    - `git config core.hooksPath .githooks`
- 配置文件生成：
  - 在项目根新建 `code-gate.config.json`（可从下文示例复制并按需调整）
  - 如使用 DeepSeek，请在环境变量设置 `DEEPSEEK_API_KEY`

## 命令
- `npx code-gate init` 交互式初始化（可选择 git/husky/simple，并生成配置文件）
- `npx code-gate setup` 快速安装原生 Git Hook
- `npx code-gate hook` 在 Hook 中执行交互式 Review

## 本地开发（link 调试）
- 在 `code-gate` 仓库：
  - `npm install`
  - `npm run build:watch`
  - `npm link`
- 在目标项目：
  - `npm link code-gate`
  - `npx code-gate init -m git`（或 `husky`/`simple`）
  - `git add` + `git commit` 时触发审查流程

## 配置文件
- 推荐使用 `.codegate.js`（支持注释与更灵活的写法），兼容旧的 `code-gate.config.json/.yaml`、`.code-gaterc.{json,yaml}`。
- 示例（`.codegate.js`）：
```js
// provider: 选择使用的 AI 审查引擎，可选值: 'ollama' | 'deepseek'
// providerOptions: 各 Provider 的配置集合（选填）
//   - deepseek: { baseURL, apiKeyEnv, model }
//   - ollama: { baseURL, model }
//   - openai: { baseURL, apiKeyEnv, model }
//   - anthropic: { baseURL, apiKeyEnv, model }
//   - azureOpenAI: { endpoint, apiKeyEnv, deployment, apiVersion }
// fileTypes: 需要审查的文件类型扩展名列表
// ui: 页面与交互设置
//   - openBrowser: 是否自动打开浏览器
//   - port: 预览服务端口
// limits: 限制项
//   - maxDiffLines: 最大 diff 行数
//   - maxFiles: 最大审查文件数
// prompt: 通用提示词
// output: 输出目录配置
//   - dir: 本地输出目录
export default {
  provider: 'deepseek',
  providerOptions: {
    deepseek: { baseURL: 'https://api.deepseek.com', apiKeyEnv: 'DEEPSEEK_API_KEY', model: 'deepseek-chat' },
    ollama: { baseURL: 'http://localhost:11434', model: 'qwen3:8b' }
    // openai: { baseURL: 'https://api.openai.com/v1', apiKeyEnv: 'OPENAI_API_KEY', model: 'gpt-4o-mini' },
    // anthropic: { baseURL: 'https://api.anthropic.com', apiKeyEnv: 'ANTHROPIC_API_KEY', model: 'claude-3-5-sonnet' },
    // azureOpenAI: { endpoint: 'https://your-endpoint.openai.azure.com', apiKeyEnv: 'AZURE_OPENAI_KEY', deployment: 'gpt-4o-mini', apiVersion: '2024-08-01-preview' }
  },
  fileTypes: ['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'py', 'go', 'rs'],
  ui: { openBrowser: true, port: 5175 },
  limits: { maxDiffLines: 10000, maxFiles: 100 },
  prompt: '作为资深代码审查工程师，从安全、性能、代码风格与测试覆盖角度审查本次变更，指出问题与改进建议，并给出必要的示例补丁。',
  output: { dir: '.code-gate' }
}
```

## 使用流程
- 运行 `git commit` 时会询问是否进行 Review：
  - 选择否：正常提交。
  - 选择是：抓取 `staged diff` 调用 AI 审查，生成本地页面并打印预览 URL，再询问是否继续提交。
  - 非交互环境会自动跳过。
  - 如需在非交互环境强制执行，可在 `.husky/pre-commit` 中使用：`npx code-gate hook -f`
  - 页面顶部会显示 AI 状态（是否参与、Provider、Model、错误信息）
  - 默认按文件 Tab 展示：每个文件一个 Tab，Tabs 超出视野时横向滚动，每个文件顶部展示该文件的审查内容

## 故障排查
- 页面只有 diff、没有 AI 审查内容：
  - DeepSeek：确保设置了环境变量 `DEEPSEEK_API_KEY`，并且 `provider` 为 `deepseek`；可在 shell 中 `export DEEPSEEK_API_KEY="your_key"`
  - Ollama：确保本地 Ollama 正在运行（默认 `http://localhost:11434`），并且模型已安装；例如 `ollama list` 查看，`ollama pull qwen2.5-coder`
  - 可在 `code-gate.config.json` 中切换 `provider`，调整 `prompt` 与 `ui.port`
  - 出错时页面顶部会显示原因与解决建议

## DeepSeek 集成
- 使用 OpenAI 兼容接口 `https://api.deepseek.com`，需在环境变量设置密钥：`DEEPSEEK_API_KEY`。
  - 参考文档：https://api-docs.deepseek.com/

## Ollama 集成
- 通过本地 HTTP 接口调用，不内置安装；需用户自行安装与启动 Ollama。
  - 默认地址：`http://localhost:11434`

## 注意
- 不会将密钥写入仓库；配置建议走环境变量。
- 大 Diff 会消耗模型 token，可通过 `limits` 控制。
