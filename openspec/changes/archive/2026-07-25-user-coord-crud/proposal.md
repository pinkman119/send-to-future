## Why

小程序「我的星球」页（`pages/earth/earth.vue`）已具备「坐标」子标签页的完整 UI：可新增、编辑、删除手机号、邮箱地址、邮寄地址、微信号四类联络坐标。但坐标数据只存于前端 `globalData.myCoords` / `setStorageSync`，刷新或换设备即丢失，无法跨端同步；发射信件时「手写信件」渠道的地址回填也只能读取本地坐标，缺乏权威性。需要把「地球-坐标」从纯前端 Demo 升级为端到端可持久化的能力：后端基于已存在的 `user_coord` 表提供增删改查接口，前端坐标操作改为调用后端，真正落库到 `user_coord`。

## What Changes

- **新增 `user_coord` 坐标 CRUD 接口**：列表查询（按当前登录用户）、新增、修改、删除（软删除，置位 `delete_time`）。
- **坐标类型收敛为 4 种**：`phone`（手机号）、`email`（邮箱地址）、`wechat`（微信号）、`address`（邮寄地址），与小程序 `earth.vue` 中的 `coordTypes` 对齐。
- **新增坐标走服务端校验**：手机号 `^1[3-9]\d{9}$`（中国大陆 11 位）、邮箱常规格式、地址与微信号非空；同一用户同一类型允许存在多条记录，由前端按 `coord_id` 管理。
- **小程序坐标子标签页改造**：`pages/earth/earth.vue` 的「坐标」操作（列表加载、添加、编辑、删除）由本地 `globalData.myCoords` 改为调用后端接口，以接口返回数据为准刷新 UI。
- **鉴权复用**：后端 `AuthGuard` 已存在，坐标接口需登录（非白名单），从 `request.user.userId` 取当前用户。

## Capabilities

### New Capabilities

- `user-coord`：用户联络坐标能力。覆盖 `user_coord` 表的按用户维度增删改查（含软删除）接口，以及小程序「坐标」子标签页的端到端联调；含四类坐标类型枚举与各自的服务端校验规则。

### Modified Capabilities

- （无）本变更复用既有的 `UserCoord` 模型与 `user_coord` 表，不涉及 `prisma-schema` 规格或约束的变更。

## Impact

- 后端 `send-to-future-nest/`：新增 `coord` 模块（controller / service），在 `AppModule` 的 `imports` 中注册 `CoordModule`；`prisma/schema.prisma` 中 `UserCoord` 模型已存在（含 `user_id` / `coord_type` / `coord_value` / `delete_time` 软删除字段），无需新增迁移，仅需复用 `PrismaService` 与 `AuthGuard`。
- 小程序（uni-app）：改造 `pages/earth/earth.vue` 坐标相关方法（`renderPage` 中的坐标加载、`addCoord` / `editCoord` / `saveCoord` / `deleteCoord`）改为经 `utils/request.js` 调用后端接口，移除对 `globalData.myCoords` 的本地读写，并保留既有的类型选择 UI（`coordTypes`）。
- 数据：每个用户可有多条 `user_coord` 记录，按 `coord_type` 区分类型；删除走软删除（`delete_time` 置位），列表查询默认排除已删除记录。
