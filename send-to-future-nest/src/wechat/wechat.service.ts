import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

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

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // 调用微信 code2session 换取 openid / unionid / session_key
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

  // 静默登录：以 openid 为键 upsert 用户，签发 JWT
  async silentLogin(code: string) {
    const wx = await this.code2Session(code);
    if (!wx.openid || wx.errcode) {
      throw new UnauthorizedException(wx.errmsg || '微信登录凭证校验失败');
    }

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

    const token = this.jwt.sign({ userId: user.user_id.toString() });

    return {
      token,
      user: {
        userId: user.user_id.toString(),
        planetCode: user.planet_code,
        nickname: user.nickname,
        isNewUser,
      },
    };
  }

  // 生成 6 位 planet_code：首字符大写字母，后 5 位大小写字母+数字；冲突则重试
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
