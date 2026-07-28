import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * 返回服务健康状态
   * @returns 健康状态对象
   */
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
