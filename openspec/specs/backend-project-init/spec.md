# backend-project-init Specification

## Purpose
TBD - created by archiving change init-send-to-future-nest. Update Purpose after archive.
## Requirements
### Requirement: NestJS application scaffold
The system SHALL provide a runnable NestJS application under `send-to-future-nest/` with a TypeScript project structure, an entry `main.ts`, and a root `AppModule`.

#### Scenario: Application boots successfully
- **WHEN** a developer runs `npm run dev` (or `npm run start`)
- **THEN** the NestJS application starts listening on the configured port without errors.

### Requirement: Health check endpoint
The system SHALL expose a health check route (e.g. `GET /health` or `GET /`) that returns a success status, so the running prototype can be verified.

#### Scenario: Health check returns ok
- **WHEN** a client sends `GET /health`
- **THEN** the service responds with HTTP 200 and a JSON body indicating the service is up.

### Requirement: Environment configuration management
The system SHALL load configuration via `ConfigModule` (`@nestjs/config`) from environment files that cover both **dev** and **prod** environments (e.g. `.env.development` and `.env.production`, selected by `NODE_ENV`), injecting `DATABASE_URL` (and app port) into the application without committing secrets to the repository.

#### Scenario: Configuration loaded from dev/prod env files
- **WHEN** the application starts with `NODE_ENV=development` (or `production`) and the corresponding `.env.development` (or `.env.production`) present containing `DATABASE_URL` and `PORT`
- **THEN** those values are available through the Nest config service and used to bootstrap the Prisma connection and HTTP server for that environment.

### Requirement: Code style and scripts
The system SHALL include ESLint, Prettier, and npm scripts (`start`, `dev`, `build`, `prisma:generate`, `prisma:migrate`) so the project follows consistent conventions and supports the standard workflow.

#### Scenario: Lint and format available
- **WHEN** a developer runs `npm run lint` and `npm run format`
- **THEN** the configured ESLint/Prettier rules are applied to the project source.

### Requirement: Prisma dependency integration
The system SHALL integrate Prisma by providing `schema.prisma`, the `prisma` and `@prisma/client` dependencies, and a `PrismaService` wired into the Nest dependency injection container.

#### Scenario: PrismaService is injectable
- **WHEN** a module imports the Prisma module
- **THEN** an instance of `PrismaService` extending `PrismaClient` is available for injection and connects on module init.

### Requirement: Containerization with Docker and Docker Compose
The project SHALL provide a `Dockerfile` (multi-stage build for the NestJS app) and a `docker-compose.yml` that orchestrates a PostgreSQL service and the application service, enabling one-command startup of the full local environment.

#### Scenario: Docker Compose starts app and database
- **WHEN** a developer runs `docker compose --env-file .env.development up -d --build`
- **THEN** the PostgreSQL container and the application container both start, PostgreSQL data is persisted via a named volume, and the app connects to the database using the in-compose `DATABASE_URL`.

#### Scenario: Health check passes in container
- **WHEN** the application container is running via Docker Compose
- **THEN** `GET /health` returns HTTP 200 from inside the container.

