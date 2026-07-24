## Context

`send-to-future` 现有 `send-to-future-miniprogram`（uni-app 小程序）与 `docs/database-design.md`（13 张表的表结构）。后端目录 `send-to-future-nest` 当前为空。本设计目标是在该目录下落地一个可启动的 NestJS + Prisma + PostgreSQL 初始化原型，并将数据库设计文档中的表结构翻译为 Prisma schema，为后续业务接口开发提供稳定的数据层与工程基线。本次不含任何业务逻辑实现。

## Goals / Non-Goals

**Goals:**
- 建立标准 NestJS（TypeScript）工程骨架，可 `npm run dev` 启动并保持运行。
- 集成 Prisma，配置 PostgreSQL 数据源，由 `docs/database-design.md` 生成完整 schema。
- 落地数据建模决策（类型映射、关系、唯一约束、软删除时间字段）。
- 提供迁移脚本与可复用的环境配置，环境配置需覆盖 **dev** 与 **prod** 两套。
- 提供容器化能力：`Dockerfile` 构建当前 NestJS 应用镜像，`docker-compose.yml` 编排 PostgreSQL 与当前应用，一键启动完整本地环境。

**Non-Goals:**
- 不实现任何 Controller/Service 业务接口（除健康检查占位外）。
- 不做鉴权、缓存、消息队列、文件存储等业务基础设施。
- 不接入小程序端联调；不编写前端代码。
- 不做种子数据（seed）以外的运行时数据初始化。

## Decisions

### D1. 工程脚手架方式
采用 NestJS CLI 标准结构（`@nestjs/cli` 初始化），保留 `src/main.ts`、`AppModule`、按 `NODE_ENV` 加载环境文件（`.env.development`/`.env.production`）的 `ConfigModule`。
- 备选：手写最小 Express + Nest 核心。→ 否决，CLI 生成结构更符合约定、便于后续维护。

### D2. ORM 与数据库
使用 **Prisma + PostgreSQL**。
- 备选：TypeORM。→ 否决，Prisma 的 schema-first 建模、类型安全 client、迁移流程更契合“先有表结构文档再落地”的需求。
- 类型映射约定（PostgreSQL / Prisma）：
  - `BIGINT` → `BigInt`
  - `INT` / `TINYINT`(参考枚举/计数) → `Int`（小整型使用 `@db.SmallInt`）
  - `TINYINT(1)` 布尔标志 → `Boolean`
  - `DATETIME` → `DateTime`
  - `DECIMAL(10,2)` → `Decimal`
  - `JSON` → `Json`
  - `VARCHAR(n)` → `String`

### D3. 主键与自增
保留原设计的 `AUTO_INCREMENT` 主键，Prisma 中使用 `@id @default(autoincrement())`，类型按原表（`Int` 或 `BigInt`）。

### D4. 关系与约束
- 外键（FK）建模为 Prisma 关系字段 + `@relation`（如 `letter.sender` → `user`）。
- 唯一约束：`letter.letter_no`、`user.planet_code` 标记为 `@unique`。
- 软删除字段（`delete_time`/`update_time`/`create_time` 等）按原表作为普通 `DateTime` 字段保留，默认 `now()` 仅用于 `create_time` 类字段，删除时间由业务层维护（保持与原设计一致，不做 Prisma `@@map` 软删除插件）。

### D5. 命名
Prisma model 使用 PascalCase（如 `Letter`、`User`、`UserCoord`）；字段使用 camelCase；表名通过 `@@map("letter")` 等映射回原 snake_case 表名，保证与原文档表名一致。

### D6. 环境配置（dev / prod）
- 采用 `.env.development`（开发）与 `.env.production`（生产）两个环境文件，由 `ConfigModule` 根据 `NODE_ENV` 选择对应文件（`envFilePath` 显式指定，缺失时回退默认 `.env`）。
- `DATABASE_URL`、应用 `PORT` 等变量分别在各环境文件中定义：dev 指向本地 PostgreSQL，prod 指向远程 PostgreSQL。
- 通过 `ConfigModule` 注入 `PrismaModule`（`@nestjs/config` + 全局 `PrismaService`）。
- 所有 `.env*` 均不入库（加入 `.gitignore`），仓库仅保留 `.env.development.example`/`.env.production.example` 作为模板。

### D8. AI 能力底座（LangChain.js）
为满足后续“AI 帮助生成内容”的需求，本次先接入 **LangChain.js** 作为框架底座（仅做接入，不实现业务生成逻辑）：
- 依赖：`@langchain/core`（核心抽象）+ 模型 provider（默认 `@langchain/openai`，后续可替换为 `@langchain/community` 或国产模型适配）。
- 模块结构：新增 `LangchainModule` 与 `AiService`，`AiService` 持有 `ChatOpenAI`（或 `ChatModel` 抽象）实例，提供 `generateText(prompt: string): Promise<string>` 占位方法，内部用 `ChatPromptTemplate` 拼接提示词并调用模型。
- 配置：LLM 相关变量（`OPENAI_API_KEY`、`OPENAI_MODEL`、`OPENAI_BASE_URL` 等）通过 `.env.development`/`.env.production` 注入，由 `ConfigModule` 读取；`AiService` 在模块内从配置构建模型实例，避免硬编码密钥。
- 范围控制：本次仅验证“能调用大模型并返回文本”，不接入 `letter` 等业务表、不做持久化与接口暴露。
- 备选：直接调用 OpenAI SDK（`openai` 包）→ 否决，LangChain 提供统一的 Chain/Prompt/Model 抽象，便于后续接入多模型、RAG、记忆等能力，扩展性更好。
- **Dockerfile**：采用多阶段构建——`builder` 阶段基于 `node:20-alpine` 安装依赖并 `npm run build`；`runner` 阶段复制产物与 `node_modules` 生产依赖，以非 root 用户运行 `npm run start:prod`，暴露应用端口。
- **docker-compose.yml**：定义两个 service：
  - `postgres`：使用官方 `postgres:16-alpine` 镜像，通过环境变量（与 `.env` 一致的 `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`）初始化，挂载具名卷（named volume）持久化数据，映射数据库端口。
  - `app`：基于本仓库 `Dockerfile` 构建，依赖 `postgres`（`depends_on`），通过 `env_file` 注入 `.env.development`（或 `.env.production`）并覆盖 `DATABASE_URL` 指向 `postgres` 服务内部地址（`host=postgres`），映射应用端口。
- 两套环境通过不同 env 文件区分：本地 `docker compose --env-file .env.development up`，生产可替换为 `.env.production`。
- `prisma migrate`/`generate` 在 `app` 服务启动命令或独立 `prisma` 步骤中执行，确保表结构随容器创建。
- 备选：仅用宿主机 PostgreSQL，不引入容器 → 否决，容器化可保证环境与文档一致、降低本地搭建成本，且利于后续 CI/部署。

## Risks / Trade-offs

- [Risk] Prisma 类型系统与原 MySQL 风格设计（TINYINT/INT 混用）在 PostgreSQL 下语义不完全一致 → 统一以 PostgreSQL 原生类型映射，业务层用枚举/常量解释数值含义。
- [Risk] 软删除依赖业务层维护，易遗漏 → 本次仅建模，后续统一封装基类或中间件；文档中标注。
- [Risk] PostgreSQL 连接串未配置导致迁移失败 → 在 README/说明中明确本地 PostgreSQL 启动与 `DATABASE_URL` 设置步骤；容器化场景下由 docker-compose 统一注入。
- [Risk] 容器内 PostgreSQL 数据在重建后丢失 → 通过 docker-compose 具名卷（named volume）持久化 `pgdata`，并明确 `volume prune` 的清理风险。
- [Risk] LLM API Key 泄露 → 密钥仅存于 `.env*`（已 gitignore），不在代码中硬编码；`AiService` 从配置读取，并在文档中提示不要在仓库提交真实密钥。
- [Trade-off] 不引入业务模块，导致原型“看起来是空的” → 这是预期内的初始化范围，符合“先不涉及业务”的要求。

## Migration Plan

1. `npm install` 安装依赖。
2. 复制 `.env.development.example` → `.env.development`（dev，本地 PostgreSQL），按需复制 `.env.production.example` → `.env.production`（prod，远程 PostgreSQL）并填写对应 `DATABASE_URL` 与 `PORT`。
3. `npx prisma migrate dev --name init` 生成并应用初始迁移，建表。
4. `npx prisma generate` 生成 client。
5. `npm run dev` 启动 Nest 应用（健康检查返回 200）。
- 回滚：删除迁移目录对应记录或 `prisma migrate reset`，无业务数据风险。

### 容器化启动（可选但推荐）
1. 确保已安装 Docker 与 Docker Compose。
2. 准备 `.env.development`（含 `POSTGRES_*` 与指向 `host=postgres` 的 `DATABASE_URL`）。
3. `docker compose --env-file .env.development up -d --build` 启动 `postgres` 与 `app` 两个服务。
4. `docker compose exec app npx prisma migrate deploy` 应用迁移，访问 `GET /health` 验证。
- 停止/清理：`docker compose down`（保留数据卷）；`docker compose down -v` 连同数据卷一并删除（谨慎）。

## Open Questions

- 后续是否需要把 `TINYINT` 枚举字段（如 `letter.mode`、`letter.status`）抽成 Prisma `enum`？建议后期业务化时再引入。
- 软删除是否改用 Prisma 中间件统一拦截？建议在首个业务模块落地时统一决策。
