import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { WechatService } from './wechat.service';

interface WechatLoginBody {
  code?: string;
}

@Controller('wechat')
export class WechatController {
  constructor(private readonly wechatService: WechatService) {}

  @Post('login')
  async login(@Body() body: WechatLoginBody) {
    const code = body?.code;
    if (!code) {
      throw new BadRequestException('缺少 code 参数');
    }
    return this.wechatService.silentLogin(code);
  }
}
