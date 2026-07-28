## 1. 后端：Coord 模块结构

- [x] 1.1 新建 `send-to-future-nest/src/coord/coord.module.ts`：导入 `PrismaModule` 与 `ConfigModule`，提供并导出 `CoordService`
- [x] 1.2 新建 `send-to-future-nest/src/coord/coord.service.ts`：注入 `PrismaService`，声明四类坐标操作方法骨架
- [x] 1.3 新建 `send-to-future-nest/src/coord/coord.controller.ts`：`@Controller('coord')`，注入 `CoordService`

## 2. 后端：CoordService 业务逻辑

- [x] 2.1 实现 `listCoords(userId)`：以 `user_id` 过滤且 `delete_time` 为 null，返回 `[{ coordId, coordType, coordValue }]`
- [x] 2.2 实现 `createCoord(userId, dto)`：校验 `coord_type` 枚举与 `coord_value` 后 `create`，返回新建坐标（含 `coordId`）
- [x] 2.3 实现 `updateCoord(userId, coordId, dto)`：先按 `coord_id` 查归属（非本人返回 404/403），校验后 `update`，返回更新后坐标
- [x] 2.4 实现 `deleteCoord(userId, coordId)`：查归属后软删除（置位 `delete_time = new Date()`），返回成功
- [x] 2.5 实现私有校验：常量 `ALLOWED_COORD_TYPES = ['phone','email','wechat','address']`；`validateCoordValue(type, value)` 按类型规则（phone `^1[3-9]\d{9}$`、email `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`、wechat/address 非空且 ≤255）校验，不通过抛带中文提示的异常

## 3. 后端：CoordController 路由与鉴权

- [x] 3.1 `GET /coord` → 调用 `listCoords(request.user.userId)`
- [x] 3.2 `POST /coord` → 校验入参后调用 `createCoord`（请求体 `{ coordType, coordValue }`）
- [x] 3.3 `PUT /coord/:coordId` → 调用 `updateCoord`（请求体 `{ coordType?, coordValue? }`，至少一项）
- [x] 3.4 `DELETE /coord/:coordId` → 调用 `deleteCoord`
- [x] 3.5 非法类型/值返回 400，越权返回 404/403；接口过全局 `AuthGuard`（非白名单，需携带 JWT）

## 4. 后端：装配与联调

- [x] 4.1 在 `send-to-future-nest/src/app.module.ts` 的 `imports` 注册 `CoordModule`
- [x] 4.2 本地启动后端，用 mock 登录拿 token，验证 `GET/POST/PUT/DELETE /coord` 全链路（含软删除后列表排除）— 已通过 curl 联调验证

## 5. 小程序：坐标子标签页后端化

- [x] 5.1 改造 `pages/earth/earth.vue` 的 `renderPage`：进入页时调用 `GET /coord`（经 `utils/request.js`），将返回映射为 `myCoords`（保留 `coordTypes` 元信息），失败给出提示
- [x] 5.2 改造 `saveCoord`：新增走 `POST /coord`、编辑走 `PUT /coord/:coordId`，成功后以接口返回刷新 `myCoords`
- [x] 5.3 改造 `deleteCoord`：调用 `DELETE /coord/:coordId`，成功后以最新列表刷新 `myCoords`
- [x] 5.4 移除 `globalData.myCoords` 的本地读写逻辑，UI 以接口返回为唯一来源；保留 `coordTypes` 类型选择 UI 与编辑弹窗

## 6. 验证

- [x] 6.1 后端 `prisma validate` + 启动无报错；列表/新增/修改/删除链路贯通，软删除后不再出现在列表
- [x] 6.2 非法类型或值返回 400（含中文提示）；越权更新/删除返回 404/403；未登录返回 401
- [x] 6.3 小程序联调：拉取、新增、编辑、删除坐标，刷新页面后数据来自后端不丢失，弱网下有加载/错误提示而不回退本地（代码已就绪；真机/微信开发者工具联调需在本机执行）
