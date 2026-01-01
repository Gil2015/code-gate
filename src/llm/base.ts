import { Config } from '../config/types.js'
import { t } from '../locales/index.js'

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
    return t('prompt.userTemplate', { diff })
  }
}
