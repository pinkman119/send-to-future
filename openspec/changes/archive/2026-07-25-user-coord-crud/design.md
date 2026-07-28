## Context

项目由后端 `send-to-future-nest`（NestJS + Prisma + PostgreSQL）与微信小程序 `send-to-future`（uni-app 编译到 mp-weixin）组成。现状：

- 小程序「我的星球」页 `pages/earth/earth.vue` 的「坐标」子标签页已具备完整 UI：可新增/编辑/删除手机号、邮箱、邮寄地址、微信号（`coordTypes` 定义 `phone`/`wechat`/`email`/`address` 四类）。但坐标数据仅存于前端 `globalData.myCoords` / `setStorageSync`，刷新或换设备即丢失，且无法跨端同步。
- 后端 `UserCoord` 模型已存在（`prisma/schema.prisma`），字段为 `coord_id`(PK)、`user_id`(FK→User)、`coord_type`(VarChar16)、`coord_value`(VarChar255)、`create_time`/`update_time`/`delete_time`(软删除)，无需新增迁移。
- 后端已具备 `AuthGuard`（白名单放行、其余需 JWT）、`PrismaService`、`WechatService`（静默登录签发 JWT），基础设施齐备。
- 既有变更 `letter-launch-and-draft` 已约定手机号 `^1[3-9]\d{9}$`、邮箱 `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` 的服务端校验规则——本设计与之保持一致。

本次目标：把「地球-坐标」从纯前端 Demo 升级为端到端可持久化能力——后端基于 `user_coord` 提供按用户维度的增删改查（软删除）接口，前端坐标操作改为调用后端，真正落库。

## Goals / Non-Goals

**Goals:**

- 后端 `coord` 模块：列表查询、新增、修改、删除（软删除）四类接口，全部按 `request.user.userId` 隔离数据。
- 四类坐标类型枚举在服务端收敛为 `phone`/`email`/`wechat`/`address`，并按类型做服务端校验。
- 小程序 `earth.vue` 坐标子标签页改为调用后端接口（列表加载、增、改、删），以接口返回为准，移除对 `globalData.myCoords` 的本地读写。

**Non-Goals:**

- 不新增数据库迁移：`UserCoord` 模型与 `user_coord` 表已满足需求。
- 不实现坐标的「去重/唯一性约束」（允许同一用户同一类型多条记录，由前端按 `coord_id` 管理）。
- 不实现坐标的批量导入/导出、分享给他人、跨用户可见等能力。
- 不改动 `letter-launch-and-draft` 已落地的地址回填逻辑（其读取 `user_coord` 的语义保持不变）。

## Decisions

1. **新增独立 `CoordModule`**：后端新建 `src/coord/coord.module.ts`、`coord.controller.ts`、`coord.service.ts`，导入 `PrismaModule`，在 `AppModule` 注册。相比把坐标逻辑塞进 `WechatModule` 或 `AppService`，独立模块职责清晰、与现有 `letter`/`pay` 模块风格一致。

2. **数据隔离以 `user_id` 为准，接口从 JWT 取用户**：所有 coord 操作以 `request.user.userId`（AuthGuard 写入）解析出的 `BigInt` 用户 ID 为过滤条件，杜绝越权读写他人坐标。更新/删除前先按 `coord_id` 查库校验归属，非本人记录返回 403（或 404 以避免暴露存在性）。

3. **坐标类型枚举在服务端 `coord.service.ts` 内以常量数组 `ALLOWED_COORD_TYPES` 收敛**：`['phone','email','wechat','address']`，与小程序 `coordTypes` 对齐；入参 `coord_type` 不在数组内直接 400。相比在 Prisma schema 用枚举类型（`enum`），复用现有 `VarChar(16)` 字段、在服务层校验成本更低，且不触碰既有 schema。

4. **按类型服务端校验**：`phone` → `^1[3-9]\d{9}$`；`email` → `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`；`wechat`/`address` → 非空且长度 ≤ 255。校验集中在 `CoordService.validateCoordValue(type, value)` 私有方法，新增与修改共用；任一不通过返回 400（含中文错误提示）。前端仅做即时提示，后端为最终校验。

5. **删除走软删除**：`delete` 接口不物理删除，而是 `update` 置位 `delete_time = new Date()`。列表查询 `where: { user_id, delete_time: null }`，已删记录自然排除。与既有 `delete_time` 字段设计一致，便于审计与未来恢复。

6. **接口契约（REST 风格，全部需登录）**：
   - `GET /coord`：返回当前用户全部未删除坐标数组 `[{ coordId, coordType, coordValue }]`。
   - `POST /coord`：请求体 `{ coordType, coordValue }`，校验后建记录，返回新建坐标（含 `coordId`）。
   - `PUT /coord/:coordId`：请求体 `{ coordType?, coordValue? }`（至少一项），校验归属 + 类型/值规则后更新，返回更新后坐标。
   - `DELETE /coord/:coordId`：校验归属后软删除，返回成功。
   - 统一经现有 `utils/request.js`（已带 `Authorization: Bearer`）。

7. **前端 `earth.vue` 改造**：进入页面 `renderPage` 时调用 `GET /coord` 拉取坐标并渲染 `myCoords`（保留 `coordTypes` 元信息映射）；`saveCoord` 区分新增（`POST`）/编辑（`PUT coordId`）；`deleteCoord` 改为调 `DELETE coordId`；成功后以接口最新列表刷新 UI。移除 `globalData.myCoords` 读写（坐标不再落地本地）。

## Risks / Trade-offs

- [Risk] 软删除后若前端用本地缓存兜底会出现数据不一致。→ 缓解：彻底移除 `globalData.myCoords`，UI 以接口返回为唯一来源；弱网下给出加载/错误提示，不回退本地。
- [Risk] 并发编辑同一坐标导致更新覆盖。→ 缓解：坐标为个人低频操作，采用「按 `coord_id` 整条覆盖」语义，可接受；后续如需可加乐观锁（`update_time` 版本比对）。
- [Risk] 手机号/邮箱更换后旧值残留（如用于「手写信件」地址回填的 `address`）。→ 缓解：回填逻辑在 `letter-launch-and-draft` 中按「最新一条 `address`」读取，用户维护坐标即可；前端可在坐标卡片提示用途。
- [Trade-off] 允许同类型多条记录：与「唯一坐标」心智不同，但契合「多个手机号/地址」的真实场景，且实现简单。
- [Trade-off] `coord_type` 用 VarChar + 服务层枚举而非 Prisma enum：避免改 schema/迁移，代价是数据库层不强制类型（由服务层兜底，已满足需求）。

## Migration Plan

1. 后端：新建 `src/coord/` 模块（`module`/`controller`/`service`），`CoordService` 实现列表/新增/修改/删除与校验逻辑；`AppModule` 注册 `CoordModule`。无需 Prisma 迁移（`UserCoord` 已存在）。
2. 小程序：改造 `pages/earth/earth.vue` 坐标相关方法，调用 `GET/POST/PUT/DELETE /coord`（经 `utils/request.js`），移除 `globalData.myCoords` 本地读写；保留 `coordTypes` UI。
3. 验证：用 mock 登录拿 token，验证列表/新增（含非法值 400）/修改/删除（软删除）链路及越权拦截（403/404）。
4. 回滚：移除 `CoordModule` 注册与 `earth.vue` 接口调用即可下线；无数据库变更，回滚零风险。

## Open Questions

- 坐标是否需要在「发射」页/「手写信件」渠道主动提示用户去维护 `address`？当前回填逻辑已读取 `user_coord`，本期不新增引导，后续可优化。
- 越权返回用 403 还是 404？倾向 404（不暴露记录存在性），实现时确定。
- 是否需要坐标「设为默认」（如默认邮寄地址）？本期不支持，后续可加 `is_default` 标志位（需 schema 扩展，届时另起变更）。
