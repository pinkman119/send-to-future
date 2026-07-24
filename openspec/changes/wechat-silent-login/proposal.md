## Why

小程序当前没有任何用户身份体系：用户打开小程序、写信、发射等行为全部匿名，后端也无法把信件、星球坐标、订阅等数据与具体用户稳定关联（现有 `user` 表的 `user_id` 仅由其他流程产生，没有可靠的微信身份来源）。需要借由微信「静默登录」在用户无感知的情况下，用 `wx.login` 拿到的 `code` 换回 `openid`，从而为每个打开小程序的人建立并识别账号。

## What Changes

- 新增后端微信登录能力：提供 `POST /wechat/login` 接口，接收小程序传来的 `code`，调用微信 `code2session` 换取 `openid`/`unionid`，并以 `openid` 为唯一键在 `user` 表中 upsert 用户（首次进入自动建档），返回身份令牌（JWT）与用户基本信息。
- 扩展 Prisma `User` 模型，新增微信身份相关字段：`openid`（唯一）、`unionid`（可空）、`session_key`（可空，预留后续解密用户信息）、`last_login_at`（可空），并在首次建档时补齐 `planet_code` 与默认 `nickname`。
- 新增小程序端静默登录流程：在 `App.vue` 的 `onLaunch` 中第一时间调用 `wx.login` 获取 `code`，于后台请求后端登录接口，将返回的 `token` 与用户信息写入 `globalData` 并持久化到本地存储；整个过程对用户完全无感知。
- 新增小程序端网络请求封装与鉴权工具，统一管理后端地址、登录态读取，为后续需要身份的请求（写信用户归属、坐标、订阅等）提供 `token`。
- 后端新增 `WECHAT_APPID` / `WECHAT_SECRET` 环境变量配置（dev/prod env 文件），不提交密钥。

## Capabilities

### New Capabilities
- `wechat-auth`: 微信静默登录端到端能力。后端 `code2session` 换取与用户 upsert、JWT 签发；小程序端启动时无感知登录、登录态持久化与请求鉴权封装。

### Modified Capabilities
- `prisma-schema`: 在 `User` 模型上扩展微信身份字段（`openid` 唯一、`unionid`、`session_key`、`last_login_at`），并约定首次建档时的 `planet_code` 生成规则。

## Impact

- 后端：`send-to-future-nest/` 新增 `wechat` 模块（controller/service）、引入 `@nestjs/jwt` 与 HTTP 调用（调用微信接口）、新增 `code2session` 逻辑；`User` 模型迁移（`prisma migrate dev`）；`.env.development` / `.env.production` 增加微信配置项；`AppModule` 注册 `WechatModule` 与 `JwtModule`。
- 小程序：`send-to-future/uni-app/`（及对应 root 副本）修改 `App.vue` 的 `onLaunch`；新增 `utils/request.js`、`utils/auth.js`、后端地址配置；`globalData` 增加登录态字段。
- 依赖：后端新增 `@nestjs/jwt`、`@nestjs/axios`（或原生 fetch）依赖。
- 数据：每个首次进入小程序且成功静默登录的用户都会在 `user` 表生成一条记录。
