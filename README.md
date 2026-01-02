# code-gate

AI 助力的提交时代码 Review 工具，支持本地 Ollama 或云端 AI 服务（DeepSeek, OpenAI, Anthropic, Aliyun Qwen, Volcengine Doubao, Zhipu GLM 等），审查 `git commit` 的 `staged diff`，并以 GitHub Diff 风格在本地页面展示结果。

## 安装
- `npm i -D code-gate`

## 初始化与集成
- 推荐使用 `init` 命令，选择初始化方式并自动生成配置文件：
  - 原生 Git Hooks：`npx code-gate init -m git`
  - Husky：`npx code-gate init -m husky`

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
  - 在项目根新建 `.codegate.js`（可从下文示例复制并按需调整）
  - 如使用云端 API，请在环境变量设置对应的 KEY，或在配置文件中直接指定 `apiKey`（建议加入 `.gitignore`）。

## 命令
- `npx code-gate init` 交互式初始化（可选择 git/husky，自动生成配置文件，并提示是否添加配置至 .gitignore）
- `npx code-gate hook` 在 Hook 中执行交互式 Review（通常由 commit 操作自动触发，无需手动运行）

## 配置文件
- 仅支持 `.codegate.js` 格式。
- 示例：
```js
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
    // azureOpenAI: { endpoint: 'https://your-endpoint.openai.azure.com', apiKeyEnv: 'AZURE_OPENAI_KEY', deployment: 'gpt-4o-mini', apiVersion: '2024-08-01-preview' },
    // aliyun: { baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKeyEnv: 'DASHSCOPE_API_KEY', model: 'qwen-plus' },
    // volcengine: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', apiKeyEnv: 'VOLCENGINE_API_KEY', model: 'doubao-pro-32k' },
    // zhipu: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', apiKeyEnv: 'ZHIPU_API_KEY', model: 'glm-4' }
  },
  fileTypes: [],
  ui: {
    openBrowser: true,
    port: 5175
  },
  limits: {
    maxDiffLines: 10000,
    maxFiles: 100
  },
  reviewMode: 'files',
  prompt: '作为资深代码审查工程师，从安全、性能、代码风格与测试覆盖角度审查本次变更，指出问题与改进建议，并给出必要的示例补丁。',
  output: {
     dir: '.review-logs'
   }
 }
 ```

### 参数说明
| 参数 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `provider` | `string` | `'ollama'` | 选择使用的 AI 审查引擎。可选值: `'ollama'`, `'deepseek'`, `'openai'`, `'anthropic'`, `'aliyun'`, `'volcengine'`, `'zhipu'` 等 |
| `providerOptions` | `object` | `{}` | 各 Provider 的具体配置集合（见下表） |
| `fileTypes` | `string[]` | `[]` | 需要审查的文件类型扩展名列表（白名单）。若为空数组或未配置，则审查所有文件。 |
| `exclude` | `string[]` | `['**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml']` | 不需要审查的文件或目录列表（黑名单），支持 glob 模式匹配（如 `node_modules/**`）。优先级高于 `fileTypes`。 |
| `ui.openBrowser` | `boolean` | `true` | 是否自动打开浏览器预览 |
| `ui.port` | `number` | `5175` | 预览服务端口 |
| `limits.maxDiffLines` | `number` | `10000` | 最大 diff 行数，超出限制可能导致审查不完整或消耗过多 Token |
| `limits.maxFiles` | `number` | `100` | 最大审查文件数 |
| `reviewMode` | `string` | `'files'` | 审查模式：`'summary'` (仅汇总), `'files'` (仅文件详情), `'both'` (两者都有) |
| `language` | `string` | `'en'` | 界面与 Prompt 语言。可选值：`'en'`, `'zh-CN'`, `'ja'`, `'ko'`, `'de'`, `'fr'` |
| `prompt` | `string` | `...` | 发送给 AI 的通用系统提示词 |
| `output.dir` | `string` | `'.review-logs'` | 本地生成报告和静态资源的输出目录 |

### providerOptions 配置
每个 Provider 可配置以下字段，支持 `request` 选项控制请求超时与重试。

**关键参数说明：**
- `baseURL`: API 基础地址（如 `https://api.deepseek.com` 或 `http://localhost:11434`）
- `apiKey`: API 密钥（直接在配置中指定，不推荐提交到仓库）
- `apiKeyEnv`: 存储 API 密钥的环境变量名称（推荐方式，如 `DEEPSEEK_API_KEY`）
- `model`: 使用的模型名称（如 `deepseek-chat`, `qwen2.5-coder`）
- `concurrencyFiles`: 并发审查的文件数量（建议云端 API 设置 4-8，本地模型设置 1）
- `request`: 高级请求配置（见下表“高级配置”）

| Provider | 可配置参数 |
| :--- | :--- |
| **deepseek** | `baseURL`, `apiKey`, `apiKeyEnv`, `model`, `concurrencyFiles`, `request` |
| **ollama** | `baseURL`, `model`, `concurrencyFiles`, `request` |
| **openai** | `baseURL`, `apiKey`, `apiKeyEnv`, `model`, `request` |
| **anthropic** | `baseURL`, `apiKey`, `apiKeyEnv`, `model`, `request` |
| **aliyun** | `baseURL`, `apiKey`, `apiKeyEnv`, `model`, `request` |
| **volcengine** | `baseURL`, `apiKey`, `apiKeyEnv`, `model`, `request` |
| **zhipu** | `baseURL`, `apiKey`, `apiKeyEnv`, `model`, `request` |
| **azureOpenAI** | `endpoint`, `apiKey`, `apiKeyEnv`, `deployment`, `apiVersion`, `request` |

#### 高级配置 (request)
在 `providerOptions.<provider>.request` 中配置，用于控制请求行为：

| 参数 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `timeout` | `number` | `undefined` | 请求超时时间（毫秒）。Ollama 默认建议设大一些（如 15000+） |
| `retries` | `number` | `0` | 请求失败重试次数 |
| `backoffMs` | `number` | `300` | 重试间隔时间（毫秒） |

> **注意**：`concurrencyFiles` 控制并发审查的文件数（默认 DeepSeek=4, Ollama=1, 其他=4）。

## 使用流程
- 运行 `git commit` 时会询问是否进行 Review：
  - 选择否：正常提交。
  - 选择是：抓取 `staged diff` 调用 AI 审查，生成本地页面并打印预览 URL，再询问是否继续提交。
  - 非交互环境会自动跳过。
  - 页面顶部会显示 AI 状态（是否参与、Provider、Model、错误信息）

> **ps**: 如需在非交互环境强制执行，可在 `pre-commit` 中使用：`npx code-gate hook -f`

## 故障排查
- 页面只有 diff、没有 AI 审查内容：
  - 如果provider选择的是第三方服务商，确保环境变量或providerOptions里配置正确。
  - 如果provider选择的是Ollama，确保本地 Ollama 正在运行（默认 `http://localhost:11434`），并且模型已安装；例如 `ollama list` 查看，`ollama pull qwen2.5-coder`

