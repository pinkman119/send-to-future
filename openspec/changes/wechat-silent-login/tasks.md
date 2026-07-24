## 1. Backend: Prisma schema extension

- [ ] 1.1 在 `send-to-future-nest/prisma/schema.prisma` 的 `User` 模型新增字段：`open_id String @unique @db.VarChar(64)`、`union_id String? @db.VarChar(64)`、`session_key String? @db.VarChar(64)`、`last_login_time DateTime? @db.Timestamp()`
- [ ] 1.2 运行 `npx prisma migrate dev --name add_wechat_fields` 生成迁移，并 `npx prisma generate` 重新生成客户端
- [ ] 1.3 确认 `prisma validate` 通过，且原有 13 张表结构未被破坏

## 2. Backend: Configuration

- [ ] 2.1 在 `.env.development` / `.env.production` 增加 `WECHAT_APPID`、`WECHAT_SECRET`、`JWT_SECRET`（提供 `.env.example` 占位，不提交真实密钥）
- [ ] 2.2 在 `package.json` 增加依赖 `@nestjs/jwt`、`@nestjs/axios`（并安装）

## 3. Backend: Wechat module

- [ ] 3.1 新建 `src/wechat/wechat.module.ts`，导入 `ConfigModule`、`PrismaModule`、`HttpModule`、`JwtModule`（用 `JWT_SECRET` 注册，`global: true` 可选）
- [ ] 3.2 新建 `src/wechat/wechat.service.ts`：`code2session(code)` 调微信接口换取 `openid`/`unionid`/`session_key`；`silentLogin(code)` 以 `openid` 为键 upsert 用户（新建时生成唯一 `planet_code` 与默认 `nickname`，更新 `last_login_at`），签发 JWT（payload 含 `userId`）返回 `{ token, user }`
- [ ] 3.3 新建 `src/wechat/wechat.controller.ts`：`POST /wechat/login` 接收 `{ code }`；校验 `code` 缺失/微信返回 `errcode!=0` 时返回 4xx 且不建档
- [ ] 3.4 `planet_code` 生成器：6 位 id，字符集 `A-Za-z0-9`，**首位必须为大写字母 `A-Z`**，后 5 位取自完整字符集；生成后校验与库中不重复，冲突则重新生成重试（最多重试 N 次，超出抛错），数据库 `@unique` 兜底

## 4. Backend: Wiring

- [ ] 4.1 在 `src/app.module.ts` 的 `imports` 中注册 `WechatModule` 与 `JwtModule`
- [ ] 4.2 在 `src/main.ts` 开启 CORS（允许小程序调试域名/本地），便于真机与开发者工具联调
- [ ] 4.3 本地启动后端，用真实小程序 `code` 或 mock 验证 `POST /wechat/login` 返回结构

## 5. Mini-program: Network & auth utils

- [ ] 5.1 新建 `uni-app/utils/config.js`：导出后端 `baseURL`（dev/prod 区分）
- [ ] 5.2 新建 `uni-app/utils/request.js`：基于 `uni.request` 的 Promise 封装，统一 baseURL、自动附加 `Authorization: Bearer <token>`（从本地存储读取）、统一错误提示
- [ ] 5.3 新建 `uni-app/utils/auth.js`：实现 `silentLogin()`（用 uni-app 官方 API `uni.login({ provider: 'weixin' })` 取 `code` → 经 `uni.request` 调 `/wechat/login` → 写 `globalData` 与 `uni.setStorageSync`）、`getToken()`、`getUserInfo()`、`isLoggedIn()`

## 6. Mini-program: Silent login on launch

- [ ] 6.1 修改 `uni-app/App.vue` 的 `onLaunch`：启动第一时间调用 `auth.silentLogin()`，不 await 阻塞首屏；优先读取本地已存 `token`/`user` 注入 `globalData`
- [ ] 6.2 在 `globalData` 增加 `login`（含 `token`、`user`）字段，并在 `saveState()` 之外单独持久化登录态
- [ ] 6.3 确认登录失败（网络/错误）时小程序仍正常渲染、无报错无阻塞弹窗

## 7. Verification

- [ ] 7.1 后端 `prisma validate` + 启动无报错；`POST /wechat/login` 返回正确 token 与 user（新/老用户 `isNewUser` 正确）
- [ ] 7.2 小程序开发者工具中首次进入控制台可见静默登录请求成功，后续请求带 `Authorization`
- [ ] 7.3 清除本地存储后重进小程序，静默登录重新建档且 `planet_code` 唯一不冲突
- [ ] 7.4 （可选）同步更新 root 级 `send-to-future/` 的对应副本（`App.vue`、utils），保持与 `uni-app/` 一致
