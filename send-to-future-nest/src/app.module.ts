import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LangchainModule } from './langchain/langchain.module';
import { WechatModule } from './wechat/wechat.module';
import { AuthModule } from './auth/auth.module';
import { CoordModule } from './coord/coord.module';
import { LetterModule } from './letter/letter.module';
import { PayModule } from './pay/pay.module';
import { RedisModule } from './redis/redis.module';
import { isProd } from './common/env.util';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: isProd() ? '.env.production' : '.env.development',
    }),
    RedisModule,
    PrismaModule,
    LangchainModule,
    WechatModule,
    AuthModule,
    CoordModule,
    LetterModule,
    PayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
