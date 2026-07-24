## 1. 工程初始化（backend-project-init）

- [ ] 1.1 在 `send-to-future-nest/` 下初始化 NestJS（TypeScript）工程结构：`package.json`、`tsconfig.json`、`nest-cli.json`、`src/main.ts`、`src/app.module.ts`
- [ ] 1.2 安装依赖：`@nestjs/core`、`@nestjs/common`、`@nestjs/config`、`@nestjs/platform-express`、`reflect-metadata`、`rxjs`、`prisma`、`@prisma/client`，以及 dev 依赖 `typescript`、`@nestjs/cli`、`@types/node`、`eslint`、`prettier`
- [ ] 1.3 配置 `ConfigModule`（全局，`envFilePath` 按 `NODE_ENV` 选择 `.env.development`/`.env.production`）以读取环境变量，并在 `main.ts` 中从配置获取端口并 `app.listen`
- [ ] 1.4 添加健康检查：在 `AppController` 暴露 `GET /health`，返回 `{ status: 'ok' }`
- [ ] 1.5 添加 ESLint 与 Prettier 配置、`.eslintrc.js`/`.prettierrc`，并声明 npm scripts：`start`、`dev`、`build`、`lint`、`format`、`prisma:generate`、`prisma:migrate`
- [ ] 1.6 创建 `.gitignore`（忽略 `node_modules/`、`.env*`、`dist/`），并提供 `.env.development`（dev 用本地 PostgreSQL）与 `.env.production`（prod 用远程 PostgreSQL）示例配置
- [ ] 1.7 编写 `Dockerfile`：多阶段构建（`node:20-alpine` builder 安装依赖并 `build`，runner 阶段以非 root 用户运行 `npm run start:prod`，暴露应用端口）
- [ ] 1.8 编写 `docker-compose.yml`：定义 `postgres`（`postgres:16-alpine`，env 注入 `POSTGRES_*`，具名卷持久化数据）与 `app`（基于本仓库镜像，`depends_on` postgres，env 注入 `.env.development` 并将 `DATABASE_URL` 指向 `host=postgres`）两个服务
- [ ] 1.9 引入 LangChain.js：安装 `@langchain/core` 与 `@langchain/openai`；在 `.env.development`/`.env.production` 中新增 `OPENAI_API_KEY`、`OPENAI_MODEL`、`OPENAI_BASE_URL`（`.example` 同步提供）
- [ ] 1.10 创建 `LangchainModule` 与 `AiService`：在 `AiService` 中基于配置构建 `ChatOpenAI` 实例，提供 `generateText(prompt: string): Promise<string>` 占位方法（用 `ChatPromptTemplate` 拼接提示词并调用模型），并注册进 `AppModule` 供后续使用（不暴露业务接口）

## 2. Prisma 集成与数据库建模（prisma-schema）

- [ ] 2.1 初始化 Prisma：执行 `npx prisma init --datasource-provider postgresql`，生成 `prisma/schema.prisma` 与基础 `.env`，随后按 dev/prod 拆分为 `.env.development` 与 `.env.production`（各自含独立 `DATABASE_URL`）
- [ ] 2.2 在 `schema.prisma` 中定义 `User`、`Letter`、`Channel`、`UserCoord`、`Galaxy`、`Subscription`、`SubscriptionLetter`、`Atlas`、`Asteroid`、`Light`、`Palette`、`LetterDecode`、`MessageBox` 共 13 个 model，使用 PascalCase 名称并以 `@@map` 映射回原 snake_case 表名
- [ ] 2.3 按类型映射约定填写字段：`BIGINT`→`BigInt`、`INT`/`TINYINT`→`Int`(小整型 `@db.SmallInt`)、布尔标志→`Boolean`、`DATETIME`→`DateTime`、`DECIMAL(10,2)`→`Decimal`、`JSON`→`Json`、`VARCHAR`→`String`
- [ ] 2.4 为每个 model 设置 `@id @default(autoincrement())`；将 `letter.letter_no` 与 `user.planet_code` 标记为 `@unique`
- [ ] 2.5 按 `docs/database-design.md` 的 FK 编写 `@relation` 关系字段（含 `letter.sender`→`user`、`user_coord.user`→`user`、`channel.coord`→`user_coord`、`subscription.my/that`→`user`、`subscription_letter.subscription/letter`、`atlas.user/asteroid`、`light.letter/user`、`user.palette`→`palette`、`letter_decode.letter/user`、`message_box.letter/user`）
- [ ] 2.6 创建 `PrismaService`（`extends PrismaClient`，`onModuleInit` 中 `$connect()`）并用 `PrismaModule` 暴露为全局可注入服务

## 3. 迁移与验证

- [ ] 3.1 分别填写 `.env.development`（本地 PostgreSQL）与 `.env.production`（远程 PostgreSQL）的 `DATABASE_URL` 与 `PORT`
- [ ] 3.2 运行 `npx prisma migrate dev --name init` 生成并应用初始迁移，确认 13 张表在数据库中创建成功
- [ ] 3.3 运行 `npx prisma generate` 生成类型安全 client
- [ ] 3.4 运行 `npm run dev`，访问 `GET /health` 确认返回 200 且 `prisma validate` 无错误
- [ ] 3.5 运行 `docker compose --env-file .env.development up -d --build`，执行 `docker compose exec app npx prisma migrate deploy`，访问容器 `GET /health` 确认返回 200 且 PostgreSQL 数据卷持久化
