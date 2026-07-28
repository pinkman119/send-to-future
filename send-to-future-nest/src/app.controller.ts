import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  /**
   * 健康检查接口
   * @returns 服务健康状态
   */
  @Get('health')
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }
}
