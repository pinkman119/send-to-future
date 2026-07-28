import { BadRequestException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface Code2SessionResult {
  openid?: string;
  unionid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  /**
   * 注入依赖：配置服务、HTTP（调用微信）、JWT 服务、Prisma 客户端、Redis 客户端。
   * @param config
   * @param http
   * @param jwt
   * @param prisma
   * @param redis
   */
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) { }

  /**
   * 调用微信 code2session 接口，用登录 code 换取 openid / unionid / session_key
   * @param code - 微信登录凭证 code
   * @returns 微信返回的会话信息
   */
  async code2Session(code: string): Promise<Code2SessionResult> {
    const appid = this.config.get<string>('WECHAT_APPID');
    const secret = this.config.get<string>('WECHAT_SECRET');
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const { data } = await firstValueFrom(
      this.http.get<Code2SessionResult>(url, {
        params: {
          appid,
          secret,
          js_code: code,
          grant_type: 'authorization_code',
        },
      }),
    );
    return data;
  }

  /**
   * 静默登录：真实 code → code2session 换取 openid → upsert 用户 → 签发 JWT。
   * @async
   * @param {string} code - 微信登录凭证 code
   * @returns {Promise<object>} 包含 token 与用户信息的登录结果
   */
  async silentLogin(code: string) {
    const wx = await this.code2Session(code);
    if (!wx.openid || wx.errcode) {
      throw new UnauthorizedException(wx.errmsg || '微信登录凭证校验失败');
    }
    return this.upsertAndSign(wx);
  }

  /**
   * 模拟登录：跳过微信 code2session，便于本地联调。
   * 优先逻辑：
   *  - 传入 userId：登录「已存在」的指定用户（不存在则报错）；
   *  - 否则传入 openid：按 openid 建档/识别（用户不存在则模拟创建）；
   *  - 两者都不传：自动生成随机 openid，每次为不同模拟用户。
   * 签发的 JWT 会写入 Redis（mock:jwt:latest / mock:jwt:{openid}），
   * 供 dev 环境守卫做免登录兜底。
   * @async
   * @param {string} [providedOpenid] - 可选，指定 openid
   * @param {string} [providedUserId] - 可选，指定已存在用户的 userId，登录该用户
   * @returns {Promise<object>} 包含 token 与用户信息的登录结果
   */
  async mockLogin(providedOpenid?: string, providedUserId?: string) {
    // 指定 userId：登录已存在的用户，不新建
    if (providedUserId && providedUserId.trim()) {
      const user = await this.findUserById(providedUserId.trim());
      const result = this.signForUser(user);
      await this.storeMockJwt(user.openid, result.token);
      return result;
    }

    const openid =
      providedOpenid && providedOpenid.trim()
        ? providedOpenid.trim()
        : `mock_${Math.random().toString(36).slice(2, 12)}`;
    const wx: Code2SessionResult = {
      openid,
      session_key: 'mock_session_key',
    };
    const result = await this.upsertAndSign(wx);
    await this.storeMockJwt(openid, result.token);
    return result;
  }

  /**
   * 将模拟登录签发的 JWT 写入 Redis，供 dev 环境守卫做免登录兜底。
   * 以 mock:jwt:latest 存放最新一份，并以 mock:jwt:{openid} 按用户存放。
   * 写入为尽力而为：Redis 不可用时仅告警，不影响登录返回。
   * @param openid - 模拟用户 openid
   * @param token - 签发的 JWT
   */
  private async storeMockJwt(openid: string, token: string): Promise<void> {
    const ttl = 60 * 60 * 24 * 30; // 30 天，与 JWT 过期时间一致
    try {
      await this.redis.set('mock:jwt:latest', token, 'EX', ttl);
      await this.redis.set(`mock:jwt:${openid}`, token, 'EX', ttl);
    } catch (err) {
      this.logger.warn(
        `保存 mock JWT 到 Redis 失败：${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /**
   * 按 userId 查找已存在的用户；userId 非法或用户不存在时抛出 BadRequestException。
   * @param rawUserId - 前端传入的 userId 字符串
   * @returns 查到的用户实体
   */
  private async findUserById(rawUserId: string): Promise<User> {
    let userId: bigint;
    try {
      userId = BigInt(rawUserId);
    } catch {
      throw new BadRequestException(`非法的 userId：${rawUserId}`);
    }
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!user) {
      throw new BadRequestException(`指定的用户不存在：${rawUserId}`);
    }
    return user;
  }

  /**
   * 为已确定的用户签发 JWT 并组装登录返回体（mock 指定用户与 upsert 共用）。
   * @param user - 用户实体
   * @returns 包含 token 与用户信息的登录结果（isNewUser 默认 false）
   */
  private signForUser(user: User) {
    const token = this.jwt.sign({ userId: user.user_id.toString() });
    return {
      token,
      user: {
        userId: user.user_id.toString(),
        planetCode: user.planet_code,
        nickname: user.nickname,
        isNewUser: false,
      },
    };
  }

  /**
   * 以 openid 为键 upsert 用户并签发 JWT（真实登录与模拟登录共用）。
   * @async
   * @param {Code2SessionResult} wx - 含 openid / unionid / session_key 的微信结果
   * @returns {Promise<object>} 包含 token 与用户信息的登录结果
   */
  private async upsertAndSign(wx: Code2SessionResult) {
    const existing = await this.prisma.user.findUnique({
      where: { openid: wx.openid },
    });

    let user;
    let isNewUser = false;

    if (existing) {
      user = await this.prisma.user.update({
        where: { openid: wx.openid },
        data: {
          session_key: wx.session_key ?? existing.session_key,
          unionid: wx.unionid ?? existing.unionid,
          last_login_at: new Date(),
        },
      });
    } else {
      const planetCode = await this.generateUniquePlanetCode();
      user = await this.prisma.user.create({
        data: {
          openid: wx.openid,
          unionid: wx.unionid,
          session_key: wx.session_key,
          last_login_at: new Date(),
          planet_code: planetCode,
          nickname: `微信用户${wx.openid.slice(-6)}`,
        },
      });
      isNewUser = true;
    }

    const result = this.signForUser(user);
    return { ...result, user: { ...result.user, isNewUser } };
  }

  /**
   * 生成 6 位 planet_code：首字符大写字母，后 5 位为大小写字母+数字；冲突则重试
   * @returns 唯一 planet_code
   * @throws 重试次数过多时抛出错误
   */
  private async generateUniquePlanetCode(): Promise<string> {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      let code = upper[Math.floor(Math.random() * upper.length)];
      for (let j = 0; j < 5; j++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      const collision = await this.prisma.user.findUnique({
        where: { planet_code: code },
      });
      if (!collision) return code;
    }
    throw new Error('生成 planet_code 失败：重试次数过多');
  }
}
