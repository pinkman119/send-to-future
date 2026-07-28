## ADDED Requirements

### Requirement: LetterDraft model
The Prisma schema SHALL define a `LetterDraft` model that stores a single in-progress launch form per user. It SHALL have: `draft_id` (BigInt PK autoincrement), `user_id` (BigInt, unique FK → `user`, one draft per user), `mode` (SmallInt), `content` (Text), `keyword` (VarChar(20), nullable), `channel_code` (SmallInt, nullable), `is_public` (Boolean, nullable), `selected_years` (Int, nullable), `custom_date` (VarChar, nullable), `from_name` (VarChar(64), nullable), `to_name` (VarChar(64), nullable), `contact_phone` (VarChar(20), nullable), `contact_email` (VarChar(128), nullable), `contact_address` (VarChar(255), nullable), `extra_contacts` (Json, nullable), and `update_time` (Timestamp).

#### Scenario: One draft per user
- **WHEN** a migration is generated from the schema
- **THEN** the `letter_draft` table has a unique index on `user_id` so upsert keeps at most one draft per user

### Requirement: LetterContact model
The Prisma schema SHALL define a `LetterContact` model storing the delivery contacts for a launched letter. It SHALL have: `contact_id` (BigInt PK autoincrement), `letter_id` (BigInt, unique FK → `letter`), `phone` (VarChar(20), nullable), `email` (VarChar(128), nullable), `address` (VarChar(255), nullable), `extra_contacts` (Json, nullable), and `create_time` (Timestamp).

#### Scenario: One contact row per letter
- **WHEN** a migration is generated from the schema
- **THEN** the `letter_contact` table has a unique index on `letter_id` and a relation to `letter`

### Requirement: Order model (wechat pay, one-to-one with Letter)
The Prisma schema SHALL define an `Order` model to track the full WeChat Pay lifecycle (initiation → settlement) for a launched letter, with its fields aligned to the WeChat Pay V3 API return values. It SHALL be in a **one-to-one** relationship with `Letter` (`letter_id` unique FK → `letter`), and have: `order_id` (BigInt PK autoincrement), `user_id` (BigInt FK → `user`), `letter_id` (BigInt, unique FK → `letter`), `channel_code` (VarChar(16)), `amount` (Decimal(10,2)), `out_trade_no` (VarChar(64), unique), `prepay_id` (VarChar(64), nullable), `transaction_id` (VarChar(64), nullable), `trade_type` (VarChar(16), nullable), `trade_state` (VarChar(32), nullable), `trade_state_desc` (VarChar(255), nullable), `bank_type` (VarChar(32), nullable), `payer_openid` (VarChar(64), nullable), `currency` (VarChar(8), nullable), `payer_total` (Int, nullable), `success_time` (Timestamp, nullable), `attach` (VarChar(255), nullable), `wx_raw` (Json, nullable), `status` (SmallInt, default 0; 0=待支付, 1=支付成功, 2=已关闭/已退款), `create_time` (Timestamp), and `update_time` (Timestamp, @updatedAt).

#### Scenario: out_trade_no is unique
- **WHEN** a migration is generated from the schema
- **THEN** the `order` table has a unique index on `out_trade_no` enabling idempotent callbacks

#### Scenario: one order per letter
- **WHEN** a migration is generated from the schema
- **THEN** the `order` table has a unique index on `letter_id`, enforcing a one-to-one relation with `letter`

#### Scenario: fields map to WeChat Pay returns
- **WHEN** a paid launch creates an `Order` and WeChat later notifies payment
- **THEN** `out_trade_no`/`prepay_id` are written at order time and `transaction_id`/`trade_state`/`trade_type`/`bank_type`/`payer_openid`/`currency`/`payer_total`/`success_time`/`trade_state_desc` are written from the WeChat callback, mirroring the V3 transaction query/notify payload

### Requirement: Letter status enum semantics (0=审核中)
The `Letter.status` field's documented semantics SHALL be: `0=审核中` (under review, just launched), `1=旅行中` (approved, in transit), `2=已送达` (delivered), with `3=审核驳回` reserved for future use. The Prisma `Letter` model SHALL keep `status Int @default(0) @db.SmallInt` and its comment updated to reflect the new enum; `letter_no` uniqueness and `sender_id` relation are unchanged.

#### Scenario: Launched letter defaults to review
- **WHEN** a letter is created via the launch flow
- **THEN** its `status` is `0` ("审核中")
