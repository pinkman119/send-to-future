import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * AI 内容生成服务（基础骨架）。
 * 当前仅验证“可调用大模型并返回文本”，不接入业务表、不做持久化与接口暴露。
 * 后续可在此基础上扩展信件生成、润色等能力。
 */
@Injectable()
export class AiService {
  private readonly model: ChatOpenAI;
  private readonly prompt: ChatPromptTemplate;

  constructor(private readonly config: ConfigService) {
    this.model = new ChatOpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
      model: this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
      configuration: this.config.get<string>('OPENAI_BASE_URL')
        ? { baseURL: this.config.get<string>('OPENAI_BASE_URL') }
        : undefined,
    });

    this.prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        '你是一个乐于助人的 AI 助手，帮助用户生成温暖、真诚、富有想象力的文字内容。',
      ],
      ['user', '{input}'],
    ]);
  }

  /**
   * 调用大模型生成文本
   * @param input - 用户输入的提示内容
   * @returns 生成的文本字符串
   */
  async generateText(input: string): Promise<string> {
    const chain = this.prompt.pipe(this.model);
    const response = await chain.invoke({ input });
    return typeof response.content === 'string'
      ? response.content
      : String(response.content);
  }
}
