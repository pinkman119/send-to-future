import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LangchainModule } from './langchain/langchain.module';
import { WechatModule } from './wechat/wechat.module';
import { AuthModule } from './auth/auth.module';
import { CoordModule } from './coord/coord.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
