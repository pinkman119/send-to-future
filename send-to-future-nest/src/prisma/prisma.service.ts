import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * 模块初始化时连接 Prisma 数据库
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * 模块销毁时断开 Prisma 数据库连接
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
