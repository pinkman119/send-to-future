import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { CoordController } from './coord.controller';
import { CoordService } from './coord.service';

/**
 * 坐标模块：提供用户联络坐标（手机号/邮箱/邮寄地址/微信号）的增删改查能力。
 * 导入全局 ConfigModule 与 PrismaModule，注册 CoordController 与 CoordService。
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [CoordController],
  providers: [CoordService],
  exports: [CoordService],
})
export class CoordModule {}
