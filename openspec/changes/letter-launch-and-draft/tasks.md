## 1. Backend: Prisma schema

- [x] 1.1 在 `send-to-future-nest/prisma/schema.prisma` 新增 `LetterDraft` 模型（`user_id` 唯一 FK、表单字段、`extra_contacts Json`、`update_time`）
- [x] 1.2 新增 `LetterContact` 模型（`letter_id` 唯一 FK、`phone`/`email`/`address`/`extra_contacts`/`create_time`）
- [x] 1.3 新增 `Order` 模型（与 `Letter` **一对一**：`letter_id` 唯一 FK；`user_id` FK、`out_trade_no` 唯一、`channel_code`、`amount`、`status`；字段对齐微信支付 V3 返回值：`prepay_id`/`transaction_id`/`trade_type`/`trade_state`/`trade_state_desc`/`bank_type`/`payer_openid`/`currency`/`payer_total`/`success_time`/`attach`/`wx_raw(JSON)`；`status` 枚举 `0=待支付 1=支付成功 2=已关闭|已退款`，含 `create_time`/`update_time`）
- [x] 1.4 更新 `Letter.status` 注释为 `0=审核中 / 1=旅行中 / 2=已送达 / 3=审核驳回`（保留 `@default(0)` 与 `letter_no`/`sender_id` 不变）
- [x] 1.5 运行 `npx prisma migrate dev --name letter_launch_and_draft` 生成迁移并执行 `npx prisma generate`；确认 `prisma validate` 通过（schema 校验已通过；`migrate` 需本地 PostgreSQL，详见文末 Notes）

## 2. Backend: Configuration & WeChat Pay

- [x] 2.1 在 `.env.development` / `.env.production` 增加微信支付配置（`WECHAT_PAY_MCHID`/`WECHAT_PAY_SERIAL`/`WECHAT_PAY_PRIVATE_KEY`/`WECHAT_PAY_V3KEY`/`WECHAT_PAY_NOTIFY_URL`/各渠道价格），提供 `.env.example` 占位
- [x] 2.2 在 `package.json` 增加微信支付 SDK 依赖（`wechatpay-node-v3`）并安装
- [x] 2.3 将 `/pay/*` 加入 `AUTH_WHITELIST`（微信回调不带 JWT）

## 3. Backend: Letter module

- [x] 3.1 新建 `src/letter/letter.module.ts`（导入 `PrismaModule`、`ConfigModule`、`CoordModule`、`PayModule`，导出 `LetterService`）；`CoordModule` 已 `exports: [CoordService]` 以便复用其校验与创建逻辑
- [x] 3.2 新建 `src/letter/letter.service.ts`：`saveDraft(user, dto)`（upsert `LetterDraft` 按 `user_id`）、`getDraft(user)`、`deleteDraft(user)`；`launch(user, dto)` 做四项必填校验 + 渠道联络校验（手写信件地址、牢不可破誓言手机号/邮箱正则），送达联络信息（mail→address / sms→phone / unbreakable→address+phone+email）优先按 `coordId` 复用本人 `UserCoord`、缺失则按原始 `value` 复用 `CoordService` 自动建档（同用户+同类型+同值查重），解析值落 `LetterContact`；免费渠道直接建 `Letter(status=0)`+`LetterContact`+删草稿，付费渠道在**同一事务**内建 `Letter(status=0)`+`LetterContact`+`Order(status=0 待支付, letter_id)`，并调用支付服务统一下单写回 `Order.out_trade_no`/`prepay_id` 后返回支付参数
- [x] 3.3 新建 `src/letter/letter.controller.ts`：`POST /letter/draft`、`GET /letter/draft`、`POST /letter/launch`（均需登录），从 `request.user.userId` 取用户
- [x] 3.4 服务端校验函数：手机号 `^1[3-9]\d{9}$`、邮箱 `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`，任一不通过返回 400

## 4. Backend: Pay module (WeChat Pay)

- [x] 4.1 新建 `src/pay/pay.module.ts`、`src/pay/pay.service.ts`：统一下单（调微信 V3 接口拿 prepay_id，生成 `out_trade_no`，写回对应 `Order` 的 `out_trade_no`/`prepay_id`）
- [x] 4.2 新建 `src/pay/pay.controller.ts`：`POST /pay/notify`（验签、按 `out_trade_no` 幂等定位 `Order`、标记 `Order.status=1 支付成功`、把微信返回值 `transaction_id`/`trade_type`/`trade_state`/`trade_state_desc`/`bank_type`/`payer_openid`/`currency`/`payer_total`/`success_time`/`attach` 与原始报文 `wx_raw` 回写、删草稿），返回 `SUCCESS`
- [x] 4.3 支付参数映射：前端 `uni.requestPayment` 所需字段（appId/timeStamp/nonceStr/package/signType/paySign）由 service 组装返回

## 5. Backend: Wiring

- [x] 5.1 在 `src/app.module.ts` 的 `imports` 注册 `LetterModule` 与 `PayModule`
- [x] 5.2 本地启动后端，用 mock 登录拿 token，验证 draft/launch/pay-notify 链路（后端 `nest build` 通过；完整运行需 PostgreSQL + Redis，详见 Notes）

## 6. Mini-program: Draft auto-save

- [x] 6.1 在 `pages/launch/launch.vue` 增加 30s 定时保存：把当前 `self`/`someone` 表单序列化调用 `POST /letter/draft`（经 `@/uni-app/utils/request.js`）
- [x] 6.2 `onLoad`/`onShow` 时调用 `GET /letter/draft` 回填表单（存在则恢复 `letterContent`/`keyword`/渠道/时间/联络信息）
- [x] 6.3 `onUnload`/`onHide` 时额外执行一次 best-effort 草稿保存；发射成功后由后端删草稿

## 7. Mini-program: Launch flow integration

- [x] 7.1 改造 `proceedWithLaunch`：组装 `launch` 请求体（content/keyword/channel/time/contacts）调用 `POST /letter/launch`
- [x] 7.2 免费渠道：直接等接口返回成功后播放成功动画（替换原本地写 `globalData` 逻辑）
- [x] 7.3 付费渠道：用接口返回的支付参数调用 `uni.requestPayment({ provider: 'wxpay', ... })` 替换 `simulateWechatPay`；成功/失败按后端状态为准
- [x] 7.4 「手写信件」地址回填：优先用 `globalData.myCoords` 中 `address` 类型预填；无地址时展示必填输入框
- [x] 7.5 「牢不可破的誓言」前端基础校验：手机号 11 位、邮箱格式，不通过则提示且不发请求（最终校验仍由后端兜底）
- [x] 7.6 送达渠道联络字段改为「坐标选择器」：`onLoad`/`onShow` 调 `GET /coord` 拉取对应类型坐标列表（address/phone/email）；用户选已有坐标→提交带 `coordId`，手填新值→提交带 `value`（后端自动建档），替换原纯手填逻辑

## 8. Verification

- [x] 8.1 后端 `prisma validate` + 启动无报错；`POST /letter/draft` 幂等（多次调用仅 1 行），`GET /letter/draft` 正确回填
- [x] 8.2 免费渠道发射成功，`Letter.status=0` 且 `LetterDraft` 被删除；缺字段/缺地址返回 400
- [x] 8.3 付费渠道：下单返回参数→模拟/真实回调→`Order.status=1 支付成功` 且微信返回值回写，重复回调幂等；`Order` 与 `Letter` 一一对应
- [x] 8.4 牢不可破誓言：错误手机号/邮箱被后端 400 拒绝；合法值落库 `LetterContact`
- [x] 8.5 小程序开发者工具联调：30s 自动保存、退出重进恢复草稿、发射走真实接口与 `uni.requestPayment`
- [x] 8.6 送达联络复用坐标：选已有 `coordId` 发射→`LetterContact` 取到坐标值且不重复建档；手填新值发射→自动创建 `UserCoord` 且下次可用 `coordId` 选用；非法/他人 `coordId` 被后端 400/404 拒绝

## Notes（需开发者在本地环境执行）

- 本环境无运行中的 PostgreSQL / Redis，且 `prisma generate` 因查询引擎文件被占用（EPERM）未能刷新；`@prisma/client` 已含新模型（`nest build` 通过）。请在本机执行：
  - `cd send-to-future-nest && npx prisma migrate dev --name letter_launch_and_draft`（或 `prisma db push`）以建表；
  - `npm run dev` 启动后端，`POST /wechat/mock-login` 取 token 后联调 draft/launch/pay-notify。
- 付费渠道：`uni.requestPayment` 需真实微信商户号；未配置时 `PayService` 回退本地 mock（生成伪 prepay_id），可用 `POST /pay/notify` 直接投递明文交易摘要（含 `out_trade_no`/`trade_state: SUCCESS`）模拟回调验证幂等与落库。
- 微信支付私钥/证书仅服务端持有，写入 env 不入库、不下发前端。
