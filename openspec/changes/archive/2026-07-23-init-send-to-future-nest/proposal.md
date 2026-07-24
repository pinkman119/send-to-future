## Why

当前项目仅有 `send-to-future-miniprogram`（uni-app 小程序前端）与一份数据库表结构文档，缺少后端服务。`send-to-future-nest` 目录为空，需要搭建一个基于 **NodeJS + PostgreSQL + Prisma + NestJS** 的后端初始化原型，以便将 `docs/database-design.md` 中已规划的表结构落地为可运行的数据层，为后续业务开发奠定基础。考虑到后续希望由 AI 辅助生成信件等内容，本次同时引入 **LangChain.js** 框架作为 AI 能力的基础底座。本次仅做项目初始化、数据库建模与 AI 框架接入，不涉及具体业务逻辑与生成接口。

## What Changes

- 在 `send-to-future-nest/` 下初始化一个标准 NestJS 工程（TypeScript、目录结构、入口 `main.ts`、`AppModule`）。
- 引入 Prisma 作为 ORM，配置 PostgreSQL 数据源，并建立 `.env` 与环境变量管理体系。`.env` 需分别覆盖 **dev（开发）** 与 **prod（生产）** 两套环境：维护 `.env.development` 与 `.env.production` 两个环境文件（或单一 `.env` 配合 `NODE_ENV` 切换配置），各自包含独立的 `DATABASE_URL`、应用端口等变量，由 `ConfigModule` 按运行环境加载。
- 依据 `docs/database-design.md` 中的 13 张表，编写 Prisma schema（`schema.prisma`），以 `BigInt`/合适类型映射原设计的 `BIGINT`/`TINYINT`/`DATETIME`/`JSON` 等字段，并声明外键关系与唯一约束。
- 配置基础工程能力：ESLint、Prettier、npm scripts（`start`/`dev`/`build`/`prisma:generate`/`prisma:migrate`）。
- 提供容器化支持：编写 `Dockerfile`（多阶段构建 NestJS 应用镜像）与 `docker-compose.yml`（编排 PostgreSQL 与当前应用，挂载数据卷持久化），可执行 `docker compose up` 一键拉起完整本地环境。
- 提供 Prisma 首次迁移（`migrate dev`）所需的脚本与说明，便于在本地 PostgreSQL 中建表。
- 引入 **LangChain.js**（`@langchain/core` 及对应模型 provider，如 `@langchain/openai`）作为后续 AI 内容生成的框架底座：安装依赖、建立 `LangchainModule` 与 `AiService` 骨架、通过 `.env` 注入 LLM API Key（`OPENAI_API_KEY` 等），并提供一个可调用大模型生成文本的占位方法（不对接业务）。
- 不实现任何 Controller/Service 业务接口（仅保留健康检查占位），保持“初始化原型”定位。

## Capabilities

### New Capabilities
- `backend-project-init`: NestJS 应用骨架初始化——工程脚手架、`AppModule`、配置（`ConfigModule` 按 `NODE_ENV` 加载 `.env.development`/`.env.production` 两套环境变量）、代码规范（ESLint/Prettier）、npm scripts 与容器化（`Dockerfile` + `docker-compose.yml` 编排 PostgreSQL 与应用），使项目可 `npm run dev` 启动或 `docker compose up` 一键运行。
- `prisma-schema`: 依据现有数据库设计建立 Prisma schema，将 `user`、`letter`、`channel`、`user_coord`、`galaxy`、`subscription`、`subscription_letter`、`atlas`、`asteroid`、`light`、`palette`、`letter_decode`、`message_box` 共 13 张表映射为 Prisma model，并定义关系、唯一约束与默认值。
- `langchain-integration`: 接入 LangChain.js 作为 AI 内容生成的基础框架——安装核心与模型 provider 依赖、建立 `LangchainModule` 与 `AiService` 骨架、通过 `.env`（dev/prod）注入 LLM 配置（API Key、模型名、base URL），并暴露一个调用大模型生成文本的占位方法，为后续“AI 帮助生成内容”预留接入点。

### Modified Capabilities
<!-- 无既有 spec 需求变更 -->

## Impact

- 新增目录：`send-to-future-nest/`（NestJS 项目、Prisma 配置）。
- 新增依赖：`@nestjs/core`、`@nestjs/common`、`@nestjs/config`、`prisma`、`@prisma/client`、`@langchain/core`、`@langchain/openai` 等。
- 依赖外部：本地（dev）或远程（prod）PostgreSQL 实例，连接串分别由 `.env.development` / `.env.production` 注入；AI 能力依赖外部 LLM 服务（如 OpenAI），其 API Key 等配置经 `.env` 注入。
- 数据层：由 Prisma schema 生成客户端并创建迁移，落地与 `docs/database-design.md` 一致的表结构。
- 容器化：新增 `Dockerfile`、`docker-compose.yml`，依赖 Docker 运行 PostgreSQL 容器（数据卷持久化）。
- 不影响现有小程序前端与 `docs/`、`openspec/` 内容。
