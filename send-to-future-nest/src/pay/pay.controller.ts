import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PayService } from './pay.service';

/**
 * 支付控制器：暴露微信支付结果回调接口。
 * /pay/notify 已在 AUTH_WHITELIST 中（微信回调不带 JWT），由 AuthGuard 直接放行。
 */
@Controller('pay')
export class PayController {
  /**
   * 注入支付服务。
   * @param payService - 支付业务逻辑服务
   */
  constructor(private readonly payService: PayService) { }

  /**
   * 微信支付结果回调：验签/解密（真实环境）后幂等标记订单已支付并清理草稿。
   * 返回微信期望的 SUCCESS 回执；本地联调可直接投递明文交易摘要。
   * @async
   * @param {Request} req - 请求对象（含报文与头部）
   * @param {object} body - 回调报文
   * @param {object} headers - 请求头
   * @returns {Promise<{ code: string; message: string }>} 微信期望的回执
   */
  @Post('notify')
  async notify(@Req() req: Request, @Body() body: object, @Headers() headers: object) {
    return this.payService.handleNotify(body, headers);
  }
}
