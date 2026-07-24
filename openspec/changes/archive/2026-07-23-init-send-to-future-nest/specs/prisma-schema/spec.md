## ADDED Requirements

### Requirement: All 13 tables modeled as Prisma models
The Prisma schema SHALL define models for every table in `docs/database-design.md`: `user`, `letter`, `channel`, `user_coord`, `galaxy`, `subscription`, `subscription_letter`, `atlas`, `asteroid`, `light`, `palette`, `letter_decode`, `message_box`.

#### Scenario: Schema contains all expected models
- **WHEN** a developer inspects `prisma/schema.prisma`
- **THEN** 13 models are present with names (PascalCase, mapped to snake_case table names) matching the documented tables.

### Requirement: Field types mapped from original design
Each model field SHALL use PostgreSQL-appropriate types that preserve the original design semantics: `BIGINT`→`BigInt`, `INT`/`TINYINT`→`Int` (small ints `@db.SmallInt`), boolean flags→`Boolean`, `DATETIME`→`DateTime`, `DECIMAL(10,2)`→`Decimal`, `JSON`→`Json`, `VARCHAR`→`String`.

#### Scenario: Type mapping is consistent
- **WHEN** the schema is reviewed against `docs/database-design.md`
- **THEN** each column type is mapped to a PostgreSQL-compatible Prisma type per the documented convention.

### Requirement: Primary keys and auto-increment
Each model SHALL declare its primary key with `@id @default(autoincrement())`, using `Int` or `BigInt` according to the original table definition.

#### Scenario: Every model has an auto-increment id
- **WHEN** the schema is inspected
- **THEN** all 13 models declare exactly one `@id` field with `autoincrement()` default.

### Requirement: Unique constraints preserved
The schema SHALL mark `letter.letter_no` and `user.planet_code` as `@unique`, matching the UNIQUE constraints in the design.

#### Scenario: Unique columns enforced
- **WHEN** a migration is generated from the schema
- **THEN** the resulting `letter` and `user` tables have unique indexes on `letter_no` and `planet_code` respectively.

### Requirement: Foreign-key relationships modeled
Foreign keys in the design SHALL be expressed as Prisma relation fields with `@relation`, including: `letter.sender`→`user`, `user_coord.user`→`user`, `channel.coord`→`user_coord`, `subscription.my`/`that`→`user`, `subscription_letter.subscription`/`letter`, `atlas.user`/`asteroid`, `light.letter`/`user`, `palette` referenced by `user.palette`, `letter_decode.letter`/`user`, `message_box.letter`/`user`.

#### Scenario: Relations resolve without errors
- **WHEN** `prisma validate` is run against the schema
- **THEN** no relation/validation errors are reported and all documented FKs are represented.

### Requirement: Initial migration and client generation
The project SHALL be able to run `prisma migrate dev` to create the initial migration that builds all tables in PostgreSQL, and `prisma generate` to produce the typed client.

#### Scenario: Migration creates tables
- **WHEN** `npx prisma migrate dev --name init` runs against a configured PostgreSQL
- **THEN** all 13 tables are created in the database matching the modeled schema.
