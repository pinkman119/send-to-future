import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { LetterService, AuthUser } from './letter.service';

/**
 * 信件控制器：暴露发射草稿与发射接口。
 * 受全局 AuthGuard 保护（非白名单），需携带合法 JWT；当前用户取自 request.user.userId。
 */
@Controller('letter')
export class LetterController {
  /**
   * 注入信件服务。
   * @param letterService - 信件业务逻辑服务
   */
  constructor(private readonly letterService: LetterService) { }

  /**
   * 保存发射草稿（upsert，按用户唯一）。
   * @async
   * @param {Request} req - 请求对象（含 JWT 解析出的 user）
   * @param {object} body - 草稿表单数据
   * @returns {Promise<object>} 保存后的草稿行
   */
  @Post('draft')
  async saveDraft(@Req() req: Request, @Body() body: object) {
    const user = (req as unknown as { user: AuthUser }).user;
    return this.letterService.saveDraft(user, body as never);
  }

  /**
   * 读取当前用户的发射草稿（存在则返回，否则返回 null）。
   * @async
   * @param {Request} req - 请求对象（含 JWT 解析出的 user）
   * @returns {Promise<object|null>} 草稿行或 null
   */
  @Get('draft')
  async getDraft(@Req() req: Request) {
    const user = (req as unknown as { user: AuthUser }).user;
    return this.letterService.getDraft(user);
  }

  /**
   * 发射信件：四项必填校验 + 联络解析 + 落库（免费直接成功，付费返回支付参数）。
   * @async
   * @param {Request} req - 请求对象（含 JWT 解析出的 user）
   * @param {object} body - 发射请求体
   * @returns {Promise<object>} 发射结果（含免费/付费分支）
   */
  @Post('launch')
  async launch(@Req() req: Request, @Body() body: object) {
    const user = (req as unknown as { user: AuthUser }).user;
    return this.letterService.launch(user, body as never);
  }
}
