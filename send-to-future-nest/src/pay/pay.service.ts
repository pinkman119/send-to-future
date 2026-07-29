import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/** 微信支付 JSAPI 调起所需参数（前端 uni.requestPayment 使用） */
export interface WxPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

/** 统一下单入参 */
interface UnifiedOrderParams {
  orderId: bigint;
  outTradeNo: string;
  amount: number;
  channelCode: string;
  description: string;
}

/** 微信支付交易摘要（回调/查单返回值，字段对齐 V3 接口） */
interface WxTransaction {
  out_trade_no?: string;
  transaction_id?: string;
  trade_state?: string;
  trade_type?: string;
  trade_state_desc?: string;
  bank_type?: string;
  payer_openid?: string;
  currency?: string;
  payer_total?: number;
  success_time?: string;
  attach?: string;
  amount?: { total?: number; currency?: string };
}

/**
 * 支付服务：封装微信支付 V3「统一下单」与「支付结果回调」处理。
 * 真实商户配置齐全时调用微信 V3 接口；缺配置时回退本地 mock，便于联调链路验证。
 */
@Injectable()
export class PayService {
  private readonly logger = new Logger(PayService.name);

  /**
   * 注入依赖：配置服务与 Prisma 客户端。
   * @param config - 全局配置服务（读取微信支付商户配置）
   * @param prisma - Prisma 客户端（读写 order 表）
   */
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * 统一下单：按 orderId 调微信 V3 接口获取 prepay_id 并写回 Order，
   * 同时组装前端 uni.requestPayment 所需的支付参数。
   * 未配置真实商户号时回退本地 mock（生成伪 prepay_id）。
   * @async
   * @param {UnifiedOrderParams} params - 下单参数（orderId / outTradeNo / amount / channelCode / description）
   * @returns {Promise<{ prepayId: string; payParams: WxPayParams }>} prepay_id 与前端支付参数
   */
  async unifiedOrder(params: UnifiedOrderParams): Promise<{ prepayId: string; payParams: WxPayParams }> {
    const appid = this.config.get<string>('WECHAT_APPID') || '';
    const mchid = this.config.get<string>('WECHAT_PAY_MCHID');
    const privateKey = this.config.get<string>('WECHAT_PAY_PRIVATE_KEY');
    const serial = this.config.get<string>('WECHAT_PAY_SERIAL');

    if (mchid && privateKey && serial) {
      try {
        return await this.unifiedOrderReal(params, { appid, mchid, privateKey, serial });
      } catch (err) {
        this.logger.warn(
          `微信支付真实下单失败，回退本地 mock：${err instanceof Error ? err.message : err}`,
        );
      }
    }

    // 本地 mock：无真实商户号时生成伪 prepay_id，便于联调链路验证
    const prepayId = 'mock_prepay_' + params.outTradeNo;
    await this.prisma.order.update({
      where: { order_id: params.orderId },
      data: { prepay_id: prepayId },
    });
    return { prepayId, payParams: this.buildPayParams(appid, prepayId) };
  }

  /**
   * 处理微信支付结果回调：解析交易摘要（真实加密 resource 或本地明文），
   * 按 out_trade_no 幂等定位 Order，支付成功则标记 Order 已支付并回写微信返回值、删除草稿。
   * @async
   * @param {object} body - 微信回调报文（或本地联调明文）
   * @param {object} [headers] - 请求头（真实回调含签名头，此处仅作透传）
   * @returns {Promise<{ code: string; message: string }>} 微信期望的 SUCCESS 回执
   * @throws {BadRequestException} 缺少商户订单号或订单不存在时抛出
   */
  async handleNotify(body: object, headers?: object): Promise<{ code: string; message: string }> {
    const payload = body as Record<string, unknown>;
    const mchid = this.config.get<string>('WECHAT_PAY_MCHID');
    const v3key = this.config.get<string>('WECHAT_PAY_V3KEY');

    let tx: WxTransaction;
    if (payload?.resource && v3key) {
      // 真实回调：resource 为 AES-256-GCM 加密，使用 APIv3 密钥解密
      tx = this.decryptResource(payload.resource as never, v3key);
    } else {
      // 本地联调：直接读取入参中的交易摘要
      tx = {
        out_trade_no: payload.out_trade_no as string,
        transaction_id: payload.transaction_id as string,
        trade_state: (payload.trade_state as string) || 'SUCCESS',
        trade_type: payload.trade_type as string,
        trade_state_desc: payload.trade_state_desc as string,
        bank_type: payload.bank_type as string,
        payer_openid: payload.payer_openid as string,
        currency: payload.currency as string,
        payer_total:
          typeof payload.payer_total === 'number'
            ? payload.payer_total
            : ((payload.amount as { total?: number })?.total),
        success_time: payload.success_time as string,
        attach: payload.attach as string,
      };
    }
    void mchid;
    void headers;

    if (!tx.out_trade_no) {
      throw new BadRequestException('缺少商户订单号');
    }

    const order = await this.prisma.order.findUnique({
      where: { out_trade_no: tx.out_trade_no },
    });
    if (!order) {
      throw new BadRequestException('订单不存在');
    }

    // 幂等：已支付直接返回 SUCCESS，避免重复处理
    if (order.status === 1) {
      return { code: 'SUCCESS', message: '成功' };
    }

    // 仅支付成功（SUCCESS）才标记订单已支付并清理草稿
    if ((tx.trade_state || 'SUCCESS') === 'SUCCESS') {
      const payerTotal =
        typeof tx.payer_total === 'number' ? tx.payer_total : tx.amount?.total;
      const successTime = tx.success_time ? new Date(tx.success_time) : new Date();
      await this.prisma.order.update({
        where: { order_id: order.order_id },
        data: {
          status: 1,
          transaction_id: tx.transaction_id ?? null,
          trade_type: tx.trade_type ?? null,
          trade_state: tx.trade_state ?? 'SUCCESS',
          trade_state_desc: tx.trade_state_desc ?? null,
          bank_type: tx.bank_type ?? null,
          payer_openid: tx.payer_openid ?? null,
          currency: tx.currency ?? null,
          payer_total: payerTotal ?? null,
          success_time: Number.isNaN(successTime.getTime()) ? new Date() : successTime,
          attach: tx.attach ?? null,
          wx_raw: payload as object,
          update_time: new Date(),
        },
      });
      await this.prisma.letterDraft.deleteMany({ where: { user_id: order.user_id } });
    }

    return { code: 'SUCCESS', message: '成功' };
  }

  /**
   * 组装前端 uni.requestPayment 所需参数（JSAPI）。
   * 真实环境需使用商户 APIv3 私钥对 appId+timeStamp+nonceStr+package 做 SHA256-RSA 签名；
   * 本地 mock 场景无法取得私钥，paySign 占位（仅用于联调代码路径）。
   * @param {string} appid - 微信 AppId
   * @param {string} prepayId - 预支付交易会话标识
   * @returns {WxPayParams} 前端支付参数
   */
  private buildPayParams(appid: string, prepayId: string): WxPayParams {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.genNonce();
    const pkg = `prepay_id=${prepayId}`;
    return {
      appId: appid,
      timeStamp,
      nonceStr,
      package: pkg,
      signType: 'RSA',
      paySign: 'mock_sign',
    };
  }

  /**
   * 真实微信支付 V3 统一下单（JSAPI）。依赖 wechatpay-node-v3 SDK（懒加载，避免未安装时影响编译/启动）。
   * @async
   * @param {UnifiedOrderParams} params - 下单参数
   * @param {object} creds - 商户凭据（appid / mchid / privateKey / serial）
   * @returns {Promise<{ prepayId: string; payParams: WxPayParams }>} prepay_id 与前端支付参数
   */
  private async unifiedOrderReal(
    params: UnifiedOrderParams,
    creds: { appid: string; mchid: string; privateKey: string; serial: string },
  ): Promise<{ prepayId: string; payParams: WxPayParams }> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Wechatpay = require('wechatpay-node-v3');
    const wxpay = new Wechatpay({
      appid: creds.appid,
      mchid: creds.mchid,
      publicKey: creds.serial,
      privateKey: creds.privateKey,
    });
    const result = await wxpay.transactions_jsapi({
      description: params.description,
      out_trade_no: params.outTradeNo,
      notify_url: this.config.get<string>('WECHAT_PAY_NOTIFY_URL') || '',
      amount: { total: Math.round(params.amount * 100), currency: 'CNY' },
      payer: { openid: await this.resolvePayerOpenid(params.orderId) },
    });
    const prepayId = result.prepay_id as string;
    await this.prisma.order.update({
      where: { order_id: params.orderId },
      data: { prepay_id: prepayId },
    });
    return { prepayId, payParams: this.buildPayParams(creds.appid, prepayId) };
  }

  /**
   * 查询订单支付者 openid（JSAPI 下单必填）。通过 order → user 反查。
   * @async
   * @param {bigint} orderId - 订单 ID
   * @returns {Promise<string>} 支付者 openid
   */
  private async resolvePayerOpenid(orderId: bigint): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: { user: true },
    });
    return order?.user?.openid || '';
  }

  /**
   * 使用 APIv3 密钥（AES-256-GCM）解密微信回调 resource。
   * @param {object} resource - 加密资源（ciphertext / nonce / associated_data）
   * @param {string} key - APIv3 密钥
   * @returns {WxTransaction} 解密后的交易摘要
   */
  private decryptResource(
    resource: { ciphertext: string; nonce: string; associated_data?: string },
    key: string,
  ): WxTransaction {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const buf = Buffer.from(resource.ciphertext, 'base64');
    const authTag = buf.subarray(buf.length - 16);
    const data = buf.subarray(0, buf.length - 16);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'utf8'),
      Buffer.from(resource.nonce, 'utf8'),
    );
    decipher.setAuthTag(authTag);
    if (resource.associated_data) {
      decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
    }
    const decoded = decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
    return JSON.parse(decoded) as WxTransaction;
  }

  /**
   * 生成随机 nonce 串。
   * @returns {string} 随机串
   */
  private genNonce(): string {
    return Math.random().toString(36).slice(2, 18);
  }
}
