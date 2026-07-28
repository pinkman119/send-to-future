import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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
