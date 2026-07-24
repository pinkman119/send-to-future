import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LangchainModule } from './langchain/langchain.module';
import { WechatModule } from './wechat/wechat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
    }),
    PrismaModule,
    LangchainModule,
    WechatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
