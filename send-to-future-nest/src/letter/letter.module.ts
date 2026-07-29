import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { CoordModule } from '../coord/coord.module';
import { PayModule } from '../pay/pay.module';
import { LetterController } from './letter.controller';
import { LetterService } from './letter.service';

/**
 * 信件模块：提供发射草稿（draft）与发射（launch）两类能力。
 * 复用 CoordModule 的坐标建档/校验逻辑沉淀送达联络信息，
 * 复用 PayModule 完成付费渠道的微信支付统一下单。
 */
@Module({
  imports: [ConfigModule, PrismaModule, CoordModule, PayModule],
  controllers: [LetterController],
  providers: [LetterService],
  exports: [LetterService],
})
export class LetterModule {}
