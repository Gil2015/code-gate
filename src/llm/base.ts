import { Config } from '../config/types.js'

export interface ReviewInput {
  prompt: string
  diff: string
}

export interface LLMProvider {
  review(input: ReviewInput): Promise<string>
}

export abstract class BaseLLMProvider implements LLMProvider {
  protected config: Config

  constructor(config: Config) {
    this.config = config
  }

  abstract review(input: ReviewInput): Promise<string>

  protected buildUserPrompt(diff: string): string {
    return (
      '请根据以下 git diff 进行代码审查，输出问题清单与改进建议，必要时给出补丁示例：\n\n' + diff
    )
  }
}
