import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CoordService } from './coord.service';

/**
 * 坐标控制器：暴露 /coord 下的列表/新增/修改/删除接口。
 * 受全局 AuthGuard 保护，需携带合法 JWT；当前用户 ID 取自 request.user.userId。
 */
@Controller('coord')
export class CoordController {
  /**
   * 注入坐标服务。
   * @param coordService - 坐标业务逻辑服务
   */
  constructor(private readonly coordService: CoordService) { }

  /**
   * 获取当前用户全部未删除坐标。
   * @async
   * @param {Request} req - 请求对象（含 JWT 解析出的 user）
   * @returns {Promise<object[]>} 坐标视图数组
   */
  @Get()
  async list(@Req() req: Request) {
    const userId = this.resolveUserId(req);
    return this.coordService.listCoords(userId);
  }

  /**
   * 新增一条坐标：请求体需包含 coordType 与 coordValue。
   * @async
   * @param {Request} req - 请求对象（含 JWT 解析出的 user）
   * @param {object} body - 请求体，需包含 coordType 与 coordValue
   * @returns {Promise<object>} 新建的坐标视图
   * @throws {BadRequestException} 缺少 coordType / coordValue 时抛出
   */
  @Post()
  async create(@Req() req: Request, @Body() body: { coordType?: string; coordValue?: string }) {
    const coordType = body?.coordType;
    const coordValue = body?.coordValue;
    if (!coordType || !coordValue) {
      throw new BadRequestException('坐标类型和值均不能为空');
    }
    const userId = this.resolveUserId(req);
    return this.coordService.createCoord(userId, { coordType, coordValue });
  }

  /**
   * 更新指定坐标：请求体可包含 coordType? / coordValue?（至少一项）。
   * @async
   * @param {Request} req - 请求对象（含 JWT 解析出的 user）
   * @param {string} coordId - 坐标 ID（路径参数）
   * @param {object} body - 请求体，可选 coordType / coordValue
   * @returns {Promise<object>} 更新后的坐标视图
   */
  @Put(':coordId')
  async update(
    @Req() req: Request,
    @Param('coordId') coordId: string,
    @Body() body: { coordType?: string; coordValue?: string },
  ) {
    const userId = this.resolveUserId(req);
    return this.coordService.updateCoord(userId, coordId, {
      coordType: body?.coordType,
      coordValue: body?.coordValue,
    });
  }

  /**
   * 软删除指定坐标。
   * @async
   * @param {Request} req - 请求对象（含 JWT 解析出的 user）
   * @param {string} coordId - 坐标 ID（路径参数）
   * @returns {Promise<{ success: boolean }>} 删除结果
   */
  @Delete(':coordId')
  async remove(@Req() req: Request, @Param('coordId') coordId: string) {
    const userId = this.resolveUserId(req);
    return this.coordService.deleteCoord(userId, coordId);
  }

  /**
   * 从请求对象中解析当前登录用户 ID（字符串形式的 BigInt）。
   * @param {Request} req - 请求对象
   * @returns {bigint} 当前用户 ID
   * @throws {BadRequestException} 无法解析用户凭证时抛出
   */
  private resolveUserId(req: Request): bigint {
    const userId = (req as { user?: { userId?: string } }).user?.userId;
    if (!userId) {
      throw new BadRequestException('无法识别当前用户，请重新登录');
    }
    return BigInt(userId);
  }
}
