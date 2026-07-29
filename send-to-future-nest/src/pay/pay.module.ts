import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';

/**
 * 支付模块：提供微信支付「统一下单」与「支付结果回调」能力。
 * 导入全局 ConfigModule 与 PrismaModule，注册 PayController 与 PayService。
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PayController],
  providers: [PayService],
  exports: [PayService],
})
export class PayModule {}
