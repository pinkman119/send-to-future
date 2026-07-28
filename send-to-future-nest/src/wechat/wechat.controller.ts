import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { WechatService } from './wechat.service';

interface WechatLoginBody {
  code?: string;
}

@Controller('wechat')
export class WechatController {
  /**
   *
   * @param wechatService
   */
  constructor(private readonly wechatService: WechatService) { }

  /**
   * 微信静默登录入口：校验 code 后委托 service 完成 code2session 与用户建档。
   * @async
   * @param {WechatLoginBody} body - 请求体，需包含 code
   * @returns {Promise<object>} 登录结果（token 与用户信息）
   * @throws {BadRequestException} 缺少 code 参数时抛出
   */
  @Post('login')
  async login(@Body() body: WechatLoginBody) {
    const code = body?.code;
    if (!code) {
      throw new BadRequestException('缺少 code 参数');
    }
    return this.wechatService.silentLogin(code);
  }

  /**
   * 模拟登录：跳过微信 code2session，便于无开发者工具时联调。
   * 请求体可带：
   *  - { "userId": "123" }：登录已存在的指定用户（不存在则报错）；
   *  - { "openid": "xxx" }：按 openid 建档/识别，不传则自动生成模拟用户；
   *  - 都不传：自动生成随机模拟用户。
   * @param {object} body - 请求体
   * @param {string} [body.openid] - 指定 openid
   * @param {string} [body.userId] - 指定已存在用户的 userId，登录该用户
   * @returns {Promise<object>} 登录结果（结构与真实登录一致）
   */
  @Post('mock-login')
  async mockLogin(@Body() body: { openid?: string; userId?: string }) {
    return this.wechatService.mockLogin(body?.openid, body?.userId);
  }
}
