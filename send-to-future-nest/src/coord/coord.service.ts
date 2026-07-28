import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** 坐标新增/编辑入参 */
interface CreateCoordDto {
  coordType: string;
  coordValue: string;
}

/** 坐标更新入参（至少一项） */
interface UpdateCoordDto {
  coordType?: string;
  coordValue?: string;
}

/** 坐标对外视图（coord_id 转为字符串，便于 JSON 传输） */
export interface CoordView {
  coordId: string;
  coordType: string;
  coordValue: string;
}

/**
 * 坐标服务：围绕 user_coord 表实现按用户隔离的增删改查（软删除）与按类型校验。
 */
@Injectable()
export class CoordService {
  private readonly logger = new Logger(CoordService.name);

  /** 允许的坐标类型枚举，与小程序 coordTypes 对齐 */
  private static readonly ALLOWED_COORD_TYPES = ['phone', 'email', 'wechat', 'address'];

  /** 手机号格式：中国大陆 11 位手机号 */
  private static readonly PHONE_RE = /^1[3-9]\d{9}$/;
  /** 邮箱格式：常见邮箱 */
  private static readonly EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  /**
   * 注入 PrismaService。
   * @param prisma - Prisma 客户端，用于访问 user_coord 等表
   */
  constructor(private readonly prisma: PrismaService) { }

  /**
   * 查询当前用户全部未软删除的坐标。
   * @async
   * @param {bigint} userId - 当前登录用户 ID
   * @returns {Promise<CoordView[]>} 坐标视图数组（可能为空）
   */
  async listCoords(userId: bigint): Promise<CoordView[]> {
    const rows = await this.prisma.userCoord.findMany({
      where: { user_id: userId, delete_time: null },
      orderBy: { create_time: 'asc' },
    });
    return rows.map((r) => this.toView(r));
  }

  /**
   * 新增一条坐标：校验类型与值后落库，返回新建坐标（含 coordId）。
   * @async
   * @param {bigint} userId - 当前登录用户 ID
   * @param {CreateCoordDto} dto - 新增入参（coordType / coordValue）
   * @returns {Promise<CoordView>} 新建的坐标视图
   * @throws {BadRequestException} 类型非法或值校验不通过时抛出
   */
  async createCoord(userId: bigint, dto: CreateCoordDto): Promise<CoordView> {
    const { coordType, coordValue } = dto;
    this.assertAllowedType(coordType);
    this.validateCoordValue(coordType, coordValue);
    const row = await this.prisma.userCoord.create({
      data: {
        user_id: userId,
        coord_type: coordType,
        coord_value: coordValue,
      },
    });
    return this.toView(row);
  }

  /**
   * 更新指定坐标：先校验归属（非本人返回 404），再校验类型/值后更新。
   * @async
   * @param {bigint} userId - 当前登录用户 ID
   * @param {string} coordId - 待更新的坐标 ID（字符串形式的 BigInt）
   * @param {UpdateCoordDto} dto - 更新入参（coordType? / coordValue?，至少一项）
   * @returns {Promise<CoordView>} 更新后的坐标视图
   * @throws {BadRequestException} 入参为空或值校验不通过时抛出
   * @throws {NotFoundException} 坐标不存在或不属于当前用户时抛出
   */
  async updateCoord(userId: bigint, coordId: string, dto: UpdateCoordDto): Promise<CoordView> {
    if (!dto.coordType && !dto.coordValue) {
      throw new BadRequestException('坐标类型和值至少提供一项');
    }
    const existing = await this.prisma.userCoord.findFirst({
      where: { coord_id: BigInt(coordId), delete_time: null },
    });
    if (!existing || existing.user_id !== userId) {
      throw new NotFoundException('坐标不存在');
    }
    // 计算更新后的有效类型，用于按类型校验值
    const nextType = dto.coordType ?? existing.coord_type;
    if (dto.coordType) this.assertAllowedType(dto.coordType);
    if (dto.coordValue) this.validateCoordValue(nextType, dto.coordValue);

    const updated = await this.prisma.userCoord.update({
      where: { coord_id: existing.coord_id },
      data: {
        ...(dto.coordType ? { coord_type: dto.coordType } : {}),
        ...(dto.coordValue ? { coord_value: dto.coordValue } : {}),
      },
    });
    return this.toView(updated);
  }

  /**
   * 软删除指定坐标：先校验归属（非本人返回 404），再置位 delete_time。
   * @async
   * @param {bigint} userId - 当前登录用户 ID
   * @param {string} coordId - 待删除的坐标 ID（字符串形式的 BigInt）
   * @returns {Promise<{ success: boolean }>} 删除结果
   * @throws {NotFoundException} 坐标不存在或不属于当前用户时抛出
   */
  async deleteCoord(userId: bigint, coordId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.userCoord.findFirst({
      where: { coord_id: BigInt(coordId), delete_time: null },
    });
    if (!existing || existing.user_id !== userId) {
      throw new NotFoundException('坐标不存在');
    }
    await this.prisma.userCoord.update({
      where: { coord_id: existing.coord_id },
      data: { delete_time: new Date() },
    });
    return { success: true };
  }

  /**
   * 校验坐标类型是否在允许枚举内。
   * @param {string} type - 坐标类型
   * @throws {BadRequestException} 类型不合法时抛出（含中文提示）
   */
  private assertAllowedType(type: string): void {
    if (!CoordService.ALLOWED_COORD_TYPES.includes(type)) {
      throw new BadRequestException(
        `坐标类型不合法，仅支持：${CoordService.ALLOWED_COORD_TYPES.join(' / ')}`,
      );
    }
  }

  /**
   * 按坐标类型校验值是否合法，不通过则抛出带中文提示的异常。
   * @param {string} type - 坐标类型
   * @param {string} value - 坐标值
   * @throws {BadRequestException} 值不合法时抛出（含中文提示）
   */
  private validateCoordValue(type: string, value: string): void {
    const v = (value ?? '').trim();
    if (!v) {
      throw new BadRequestException('坐标值不能为空');
    }
    switch (type) {
      case 'phone':
        if (!CoordService.PHONE_RE.test(v)) {
          throw new BadRequestException('手机号格式不正确，请填写 11 位中国大陆手机号');
        }
        break;
      case 'email':
        if (!CoordService.EMAIL_RE.test(v)) {
          throw new BadRequestException('邮箱格式不正确，请检查后重新填写');
        }
        break;
      case 'wechat':
      case 'address':
        if (v.length > 255) {
          throw new BadRequestException('坐标值长度不能超过 255 个字符');
        }
        break;
      default:
        throw new BadRequestException('未知的坐标类型');
    }
  }

  /**
   * 将 user_coord 行映射为对外坐标视图（coord_id 转为字符串）。
   * @param {object} row - Prisma 返回的 user_coord 行
   * @returns {CoordView} 坐标视图
   */
  private toView(row: { coord_id: bigint; coord_type: string; coord_value: string }): CoordView {
    return {
      coordId: row.coord_id.toString(),
      coordType: row.coord_type,
      coordValue: row.coord_value,
    };
  }
}
