import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis 服务：封装 ioredis 客户端，作为全局可用的键值存储。
 * 主要用途：存放 mock 登录等场景下的临时凭证（JWT）。
 *
 * 连接参数来自环境变量：
 * - REDIS_HOST（默认 localhost）
 * - REDIS_PORT（默认 6379）
 * - REDIS_PASSWORD（可选）
 * - REDIS_DB（默认 0）
 */
@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
    /**
     * 根据配置创建 ioredis 客户端。
     * 连接失败不会阻塞应用启动（ioredis 异步重连，仅触发 error 事件）。
     * @param config - 全局配置服务
     */
    constructor(config: ConfigService) {
        super({
            host: config.get<string>('REDIS_HOST') ?? 'localhost',
            port: Number(config.get<string>('REDIS_PORT') ?? 6379),
            password: config.get<string>('REDIS_PASSWORD') || undefined,
            db: Number(config.get<string>('REDIS_DB') ?? 0),
            maxRetriesPerRequest: 3,
        });

        this.on('error', (err) => {
            // 仅记录，不向上抛出，避免未连接时拖垮整个应用
            // eslint-disable-next-line no-console
            console.warn(`[Redis] 连接异常：${err.message}`);
        });
    }

    /**
     * 应用关闭时断开 Redis 连接
     */
    async onModuleDestroy(): Promise<void> {
        await this.quit();
    }
}
