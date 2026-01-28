import { Config } from '../config/types.js'
import { t } from '../locales/index.js'
import type {
  AgentReviewInput,
  AgentReviewOptions,
  AgentProvider,
  AgentMessage,
  LLMCallFunction
} from '../agent/types.js'
import type { ToolDefinition, ToolCall } from '../agent/tools/types.js'
import { createOrchestrator } from '../agent/orchestrator.js'

// ============ 基础审查接口 ============

export interface ReviewInput {
  prompt: string
  diff: string
}

export interface LLMProvider {
  review(input: ReviewInput): Promise<string>
}

// ============ Agent Provider 接口 ============

export interface AgentLLMProvider extends LLMProvider, AgentProvider {}

// ============ 基础 Provider 类 ============

export abstract class BaseLLMProvider implements LLMProvider {
  protected config: Config

  constructor(config: Config) {
    this.config = config
  }

  abstract review(input: ReviewInput): Promise<string>

  protected buildUserPrompt(diff: string): string {
    return t('prompt.userTemplate', { diff })
  }
}

// ============ Agent Provider 基类 ============

export abstract class BaseAgentProvider extends BaseLLMProvider implements AgentLLMProvider {

  /**
   * Agent 模式审查
   * 使用工具调用获取更多上下文
   */
  async reviewWithAgent(
    input: AgentReviewInput,
    options: AgentReviewOptions
  ): Promise<string> {
    // 创建编排器
    const orchestrator = createOrchestrator(
      this.config,
      this.callLLMWithTools.bind(this) as LLMCallFunction
    )

    // 运行 Agent 循环
    return orchestrator.run(input, options)
  }

  /**
   * 带工具的 LLM 调用
   * 子类必须实现此方法
   */
  protected abstract callLLMWithTools(
    messages: AgentMessage[],
    tools: ToolDefinition[]
  ): Promise<{
    content: string | null
    toolCalls: ToolCall[]
    reasoning_content?: string  // DeepSeek Reasoner 模型返回
  }>
}
