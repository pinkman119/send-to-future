import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoordService } from '../coord/coord.service';
import { PayService } from '../pay/pay.service';

/** 登录用户载荷（AuthGuard 写入 request.user） */
export interface AuthUser {
  userId: string;
}

/** 单条送达联络引用：coordId 或原始 value 二选一 */
interface ContactRefDto {
  coordId?: string;
  value?: string;
}

/** 发射联络信息（按渠道必填其一/多） */
interface LaunchContactsDto {
  phone?: ContactRefDto;
  email?: ContactRefDto;
  address?: ContactRefDto;
  extra?: string[];
}

/** 发射请求体 */
interface LaunchDto {
  mode?: 'self' | 'someone';
  content: string;
  keyword?: string;
  channelCode: string;
  selectedYears?: number;
  customDate?: string;
  isPublic?: boolean;
  fromName?: string;
  toName?: string;
  contacts?: LaunchContactsDto;
}

/** 草稿保存请求体 */
interface DraftDto {
  mode?: 'self' | 'someone';
  content?: string;
  keyword?: string;
  channelCode?: string;
  isPublic?: boolean;
  selectedYears?: number;
  customDate?: string;
  fromName?: string;
  toName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  extraContacts?: unknown;
}

/** 发射结果（按免费/付费分支返回不同字段） */
export interface LaunchResult {
  launchType: 'free' | 'paid';
  letterId: string;
  orderId?: string;
  outTradeNo?: string;
  payParams?: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  };
}

/**
 * 信件服务：实现发射草稿（upsert/读取/删除）与发射落库（含付费渠道下单）的业务逻辑。
 */
@Injectable()
export class LetterService {
  private readonly logger = new Logger(LetterService.name);

  /** 渠道默认价格（元）：与小程序 priceMap 对齐；>0 视为付费渠道 */
  private static readonly DEFAULT_CHANNEL_PRICES: Record<string, number> = {
    mail: 9.9,
    qqmail: 0,
    sms: 0.99,
    unbreakable: 19.9,
    launch: 0,
  };

  /** 渠道字符串 → Letter.channel_code(Int SmallInt) 映射（保留列类型，不与草稿/订单的字符串渠道码混淆） */
  private static readonly CHANNEL_CODE_NUM: Record<string, number> = {
    mail: 1,
    qqmail: 2,
    sms: 3,
    unbreakable: 4,
    launch: 5,
  };

  /** 各渠道必填联络字段 */
  private static readonly CHANNEL_REQUIRED_FIELDS: Record<string, ('phone' | 'email' | 'address')[]> = {
    mail: ['address'],
    sms: ['phone'],
    unbreakable: ['phone', 'email', 'address'],
    qqmail: [],
    launch: [],
  };

  /** 寄信模式 → Letter.mode(Int SmallInt) 映射 */
  private static readonly MODE_NUM: Record<string, number> = {
    self: 0,
    someone: 1,
  };

  /** 渠道中文描述（用于支付单备注） */
  private static readonly CHANNEL_DESC: Record<string, string> = {
    mail: '手写信件',
    qqmail: 'QQ邮箱',
    sms: '短信推送',
    unbreakable: '牢不可破的誓言',
    launch: '仅发射到星海',
  };

  /** 手机号格式：中国大陆 11 位 */
  private static readonly PHONE_RE = /^1[3-9]\d{9}$/;
  /** 邮箱格式：常见邮箱 */
  private static readonly EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  /**
   * 注入依赖：Prisma 客户端、坐标服务、支付服务与配置服务。
   * @param prisma - Prisma 客户端
   * @param coordService - 坐标服务（复用建档/校验逻辑）
   * @param payService - 支付服务（付费渠道统一下单）
   * @param config - 全局配置服务（读取渠道价格）
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly coordService: CoordService,
    private readonly payService: PayService,
    private readonly config: ConfigService,
  ) { }

  /**
   * 将 Prisma 结果中的 BigInt 字段递归转为字符串，避免 Express 在 JSON.stringify 时
   * 因遇到 BigInt 抛出 "Do not know how to serialize a BigInt"。Date 也会序列化为 ISO 字符串。
   * @template T
   * @param {T} obj - 任意待序列化的对象/数组
   * @returns {T} 等价对象（BigInt→string）
   */
  private serialize<T>(obj: T): T {
    return JSON.parse(
      JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
    ) as T;
  }

  /**
   * 读取渠道价格（元）：优先取环境变量 WECHAT_PAY_PRICE_<CHANNEL>，缺省回退内置默认值。
   * @param {string} channelCode - 渠道编码
   * @returns {number} 该渠道价格（元）
   */
  private getChannelPrice(channelCode: string): number {
    const fromEnv = this.config.get<string>(`WECHAT_PAY_PRICE_${channelCode.toUpperCase()}`);
    if (fromEnv != null && fromEnv !== '') {
      const n = Number(fromEnv);
      if (!Number.isNaN(n)) return n;
    }
    return LetterService.DEFAULT_CHANNEL_PRICES[channelCode] ?? 0;
  }

  /**
   * 保存发射草稿：按 user_id 做 upsert（有则更新、无则新建），刷新 update_time。
   * @async
   * @param {AuthUser} user - 当前登录用户
   * @param {DraftDto} dto - 草稿表单数据
   * @returns {Promise<object>} 保存后的草稿行
   */
  async saveDraft(user: AuthUser, dto: DraftDto): Promise<object> {
    const userId = Number(user.userId);
    const customDate = dto.customDate ? new Date(dto.customDate) : null;
    const blank = (v?: string): string | null => (v && v.trim() ? v : null);
    const data = {
      mode: dto.mode ? LetterService.MODE_NUM[dto.mode] ?? null : null,
      content: blank(dto.content),
      keyword: blank(dto.keyword),
      channel_code: blank(dto.channelCode),
      is_public: dto.isPublic ?? null,
      selected_years: dto.selectedYears ?? null,
      custom_date: customDate,
      from_name: blank(dto.fromName),
      to_name: blank(dto.toName),
      contact_phone: blank(dto.contactPhone),
      contact_email: blank(dto.contactEmail),
      contact_address: blank(dto.contactAddress),
      extra_contacts:
        dto.extraContacts && Array.isArray(dto.extraContacts) && dto.extraContacts.length
          ? dto.extraContacts
          : null,
      update_time: new Date(),
    };
    const saved = await this.prisma.letterDraft.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    });
    return this.serialize(saved);
  }

  /**
   * 读取当前用户的发射草稿（若存在）。
   * @async
   * @param {AuthUser} user - 当前登录用户
   * @returns {Promise<object|null>} 草稿行或 null
   */
  async getDraft(user: AuthUser): Promise<object | null> {
    const userId = BigInt(user.userId);
    const draft = await this.prisma.letterDraft.findUnique({ where: { user_id: userId } });
    return draft ? this.serialize(draft) : null;
  }

  /**
   * 删除当前用户的发射草稿（发射成功后调用）。
   * @async
   * @param {AuthUser} user - 当前登录用户
   * @returns {Promise<{ success: boolean }>} 删除结果
   */
  async deleteDraft(user: AuthUser): Promise<{ success: boolean }> {
    const userId = BigInt(user.userId);
    await this.prisma.letterDraft.deleteMany({ where: { user_id: userId } });
    return { success: true };
  }

  /**
   * 发射信件：四项必填校验 → 联络信息解析/校验 → 落库（免费直接建 Letter+Contact；
   * 付费在同一事务内建 Letter+Contact+Order 并调用支付服务统一下单）。
   * @async
   * @param {AuthUser} user - 当前登录用户
   * @param {LaunchDto} dto - 发射请求体
   * @returns {Promise<LaunchResult>} 发射结果（含免费/付费分支）
   * @throws {BadRequestException} 必填项缺失、渠道非法、联络信息缺失或格式不合法时抛出
   */
  async launch(user: AuthUser, dto: LaunchDto): Promise<LaunchResult> {
    const userId = BigInt(user.userId);

    // 1) 四项必填校验
    const content = (dto.content ?? '').trim();
    const keyword = (dto.keyword ?? '').trim();
    const channelCode = (dto.channelCode ?? '').trim();
    const hasTime = dto.selectedYears != null || !!(dto.customDate && dto.customDate.trim());
    if (!content) throw new BadRequestException('信件内容不能为空');
    if (!keyword) throw new BadRequestException('主题关键词不能为空');
    if (!channelCode) throw new BadRequestException('送达渠道不能为空');
    if (!hasTime) throw new BadRequestException('送达时间不能为空');

    // 2) 渠道合法性与付费判定
    const price = this.getChannelPrice(channelCode);
    if (price === undefined) throw new BadRequestException(`不支持的送达渠道：${channelCode}`);

    // 3) 解析并校验送达联络信息
    const contact = await this.resolveContacts(userId, channelCode, dto.contacts);

    // 4) 计算送达时间
    const { deliverTime, yearsOffset } = this.computeDeliverTime(dto);

    const baseData = {
      sender_id: userId,
      mode: LetterService.MODE_NUM[dto.mode ?? 'self'] ?? 0,
      content,
      keyword: keyword || null,
      channel_code: LetterService.CHANNEL_CODE_NUM[channelCode] ?? 0,
      is_public: dto.isPublic ?? true,
      sent_time: new Date(),
      deliver_time: deliverTime,
      years_offset: yearsOffset,
      status: 0,
      letter_no: this.genLetterNo(),
    };

    if (price > 0) {
      // 付费渠道：同一事务建 Letter + LetterContact + Order(待支付)，再统一下单写回 prepay_id
      const outTradeNo = this.genOutTradeNo();
      const created = await this.prisma.$transaction(async (tx) => {
        const letter = await tx.letter.create({ data: baseData });
        await tx.letterContact.create({
          data: {
            letter_id: letter.letter_id,
            phone: contact.phone ?? null,
            email: contact.email ?? null,
            address: contact.address ?? null,
            extra_contacts: contact.extra ?? null,
          },
        });
        const order = await tx.order.create({
          data: {
            user_id: userId,
            letter_id: letter.letter_id,
            channel_code: channelCode,
            amount: new Prisma.Decimal(price),
            out_trade_no: outTradeNo,
            status: 0,
          },
        });
        return { letter, order };
      });
      const pay = await this.payService.unifiedOrder({
        orderId: created.order.order_id,
        outTradeNo,
        amount: price,
        channelCode,
        description: `星笺·${LetterService.CHANNEL_DESC[channelCode] ?? channelCode}`,
      });
      return {
        launchType: 'paid',
        letterId: created.letter.letter_id.toString(),
        orderId: created.order.order_id.toString(),
        outTradeNo,
        payParams: pay.payParams,
      };
    }

    // 免费渠道：同一事务建 Letter + LetterContact 并删除草稿
    const letter = await this.prisma.$transaction(async (tx) => {
      const created = await tx.letter.create({ data: baseData });
      await tx.letterContact.create({
        data: {
          letter_id: created.letter_id,
          phone: contact.phone ?? null,
          email: contact.email ?? null,
          address: contact.address ?? null,
          extra_contacts: contact.extra ?? null,
        },
      });
      await tx.letterDraft.deleteMany({ where: { user_id: userId } });
      return created;
    });
    return { launchType: 'free', letterId: letter.letter_id.toString() };
  }

  /**
   * 解析并校验送达联络信息：按渠道必填字段逐一解析（coordId 复用或 value 自动建档），
   * 并以正则兜底校验手机号/邮箱格式。
   * @async
   * @param {bigint} userId - 当前登录用户 ID
   * @param {string} channelCode - 渠道编码
   * @param {LaunchContactsDto} [contacts] - 联络信息（各字段可选 coordId / value）
   * @returns {Promise<{ phone?: string; email?: string; address?: string; extra?: string[] }>} 解析后的真实值
   * @throws {BadRequestException} 必填字段缺失、手机号/邮箱格式不合法时抛出
   */
  private async resolveContacts(
    userId: bigint,
    channelCode: string,
    contacts?: LaunchContactsDto,
  ): Promise<{ phone?: string; email?: string; address?: string; extra?: string[] }> {
    const required = LetterService.CHANNEL_REQUIRED_FIELDS[channelCode] || [];
    const result: { phone?: string; email?: string; address?: string; extra?: string[] } = {};

    for (const field of required) {
      const ref = contacts?.[field];
      if (!ref || (!ref.coordId && !ref.value)) {
        throw new BadRequestException(`送达联络信息缺失：${field}`);
      }
    }

    const fields: ('phone' | 'email' | 'address')[] = ['phone', 'email', 'address'];
    for (const field of fields) {
      const ref = contacts?.[field];
      if (ref && (ref.coordId || ref.value)) {
        const resolved = await this.coordService.resolveCoordValue(userId, field, ref);
        if (field === 'phone' && !LetterService.PHONE_RE.test(resolved.value)) {
          throw new BadRequestException('手机号格式不正确，请填写 11 位中国大陆手机号');
        }
        if (field === 'email' && !LetterService.EMAIL_RE.test(resolved.value)) {
          throw new BadRequestException('邮箱格式不正确，请检查后重新填写');
        }
        result[field] = resolved.value;
      }
    }

    if (contacts?.extra && contacts.extra.length) {
      result.extra = contacts.extra.filter((v): v is string => !!v && v.trim().length > 0);
    }
    return result;
  }

  /**
   * 计算送达时间与年限偏移：selectedYears 优先，其次 customDate（ISO YYYY-MM-DD）。
   * @param {LaunchDto} dto - 发射请求体
   * @returns {{ deliverTime: Date | null; yearsOffset: number | null }} 送达时间与年限偏移
   * @throws {BadRequestException} customDate 格式非法时抛出
   */
  private computeDeliverTime(dto: LaunchDto): { deliverTime: Date | null; yearsOffset: number | null } {
    if (dto.selectedYears != null) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + dto.selectedYears);
      return { deliverTime: d, yearsOffset: dto.selectedYears };
    }
    if (dto.customDate && dto.customDate.trim()) {
      const d = new Date(dto.customDate.trim());
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('自定义送达日期格式不正确');
      }
      return { deliverTime: d, yearsOffset: null };
    }
    return { deliverTime: null, yearsOffset: null };
  }

  /**
   * 生成信件编号（letter_no，唯一）：LT + 36 进制时间戳 + 随机串。
   * @returns {string} 信件编号
   */
  private genLetterNo(): string {
    return (
      'LT' +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    );
  }

  /**
   * 生成商户订单号（out_trade_no，唯一）：STF + 时间戳 + 随机串。
   * @returns {string} 商户订单号
   */
  private genOutTradeNo(): string {
    return 'STF' + Date.now().toString() + Math.random().toString(36).slice(2, 8);
  }
}
