import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Prisma 的 BigInt 字段（如 draft_id / user_id）无法被 JSON.stringify 序列化，
// 统一在响应输出时转为字符串，避免「Do not know how to serialize a BigInt」报错。
(BigInt.prototype as unknown as { toJSON(): string }).toJSON = function (this: bigint) {
  return this.toString();
};

/**
 * 启动 Nest 应用：创建实例、开启 CORS、监听端口
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
