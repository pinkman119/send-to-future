import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RedisService } from '../redis/redis.service';
import { isDev } from '../common/env.util';

/**
 * 接口安全守卫：白名单（配置）中的接口直接放行，其余接口必须携带合法的 JWT，
 * 未登录或凭证无效的用户将被拦截并返回 401。
 *
 * dev 环境增强：当请求未携带（或携带无效）JWT 时，会尝试从 Redis 读取
 * 最近一次 mock 登录签发的 JWT 作为兜底，便于本地联调免登录。
 */
@Injectable()
export class AuthGuard implements CanActivate {
    /** 解析后的白名单规则集合 */
    private readonly whitelist: { prefix: boolean; pattern: string }[];

    /**
     * 注入配置服务、JWT 服务与 Redis 服务，并解析白名单配置
     * @param config - 全局配置服务，用于读取 AUTH_WHITELIST / NODE_ENV
     * @param jwt - JWT 服务，用于校验身份凭证
     * @param redis - Redis 服务，用于 dev 环境读取 mock JWT
     */
    constructor(
        private readonly config: ConfigService,
        private readonly jwt: JwtService,
        private readonly redis: RedisService,
    ) {
        this.whitelist = this.parseWhitelist(
            this.config.get<string>('AUTH_WHITELIST') ?? '',
        );
    }

    /**
     * 解析白名单配置字符串：以逗号分隔，支持以 `*` 结尾的前缀通配。
     * 例："/health,/wechat/*" → 命中 /health 以及所有 /wechat/ 开头的路径。
     * @param raw - 原始配置字符串（逗号分隔）
     * @returns 白名单规则数组
     */
    private parseWhitelist(
        raw: string,
    ): { prefix: boolean; pattern: string }[] {
        return raw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => {
                if (item.endsWith('*')) {
                    return { prefix: true, pattern: item.slice(0, -1) };
                }
                return { prefix: false, pattern: item };
            });
    }

    /**
     * 判断请求路径是否命中白名单
     * @param path - 去除了 query 的请求路径
     * @returns 命中白名单返回 true
     */
    private isWhitelisted(path: string): boolean {
        return this.whitelist.some((item) =>
            item.prefix ? path.startsWith(item.pattern) : path === item.pattern,
        );
    }

    /**
     * 从 Authorization 请求头中提取 Bearer Token
     * @param request - Express 请求对象
     * @returns 提取到的 token，未携带则返回 undefined
     */
    private extractToken(request: Request): string | undefined {
        const header = request.headers.authorization;
        if (!header) return undefined;
        const [scheme, token] = header.split(' ');
        return scheme === 'Bearer' && token ? token : undefined;
    }

    /**
     * 从 Redis 读取最新的 mock JWT（dev 环境兜底用）。
     * Redis 不可用时返回 null，避免影响正常鉴权流程。
     * @returns 最新 mock JWT，或 null
     */
    private async getMockToken(): Promise<string | null> {
        try {
            return await this.redis.get('mock:jwt:latest');
        } catch {
            return null;
        }
    }

    /**
     * 守卫核心逻辑：
     * - 白名单接口直接放行；
     * - 其余接口校验 JWT，无效则抛 401；
     * - dev 环境额外逻辑：当请求未携带（或携带无效）JWT 时，
     *   尝试以 Redis 中最新 mock 登录签发的 JWT 兜底放行。
     * 校验通过后将载荷写入 request.user 供后续处理使用。
     * @param context - 执行上下文
     * @returns 校验通过返回 true
     * @throws {UnauthorizedException} 缺少凭证或凭证无效/过期时抛出
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const path = request.path;

        if (this.isWhitelisted(path)) {
            return true;
        }

        const dev = isDev();
        // dev 环境：预先取 Redis 中最新 mock JWT 作为兜底
        const mockToken = dev ? await this.getMockToken() : null;

        let token = this.extractToken(request);
        if (!token && mockToken) {
            token = mockToken;
        }

        if (!token) {
            throw new UnauthorizedException('未提供身份凭证，请先登录');
        }

        try {
            const payload = await this.jwt.verifyAsync(token);
            request['user'] = payload;
        } catch {
            // token 无效：dev 环境尝试用 Redis 中的 mock JWT 兜底（且仅当它未被当前请求使用过）
            if (dev && mockToken && mockToken !== token) {
                try {
                    const payload = await this.jwt.verifyAsync(mockToken);
                    request['user'] = payload;
                    return true;
                } catch {
                    // mock token 自身也失效，继续抛出
                }
            }
            throw new UnauthorizedException('身份凭证无效或已过期，请重新登录');
        }

        return true;
    }
}
