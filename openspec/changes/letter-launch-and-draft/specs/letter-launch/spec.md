## ADDED Requirements

### Requirement: Launch requires four mandatory fields
The system SHALL reject a launch request that is missing any of: letter `content`, `keyword`, delivery `channel_code`, and delivery `time` (either `selected_years` or `custom_date`). A missing field SHALL result in a 400 error and the letter SHALL NOT be created.

#### Scenario: All four fields present
- **WHEN** an authenticated user launches with non-empty content, keyword, channel, and delivery time
- **THEN** the system proceeds to create the letter (subject to payment/channel rules)

#### Scenario: Missing content
- **WHEN** an authenticated user launches with empty content
- **THEN** the system returns 400 and does not create a Letter

#### Scenario: Missing delivery time
- **WHEN** an authenticated user launches with a channel but neither selected_years nor custom_date
- **THEN** the system returns 400 and does not create a Letter

### Requirement: Launched letter enters review status
The system SHALL create the launched letter with `status = 0` ("审核中" / under review). Every successfully launched letter (free or paid-after-payment) SHALL enter the review state.

#### Scenario: Free channel letter is under review
- **WHEN** a free-channel launch succeeds
- **THEN** a `Letter` row is created with `status = 0`

#### Scenario: Paid channel letter is under review after payment
- **WHEN** a paid-channel payment-success callback completes
- **THEN** a `Letter` row is created with `status = 0` (not before payment succeeds)

### Requirement: Paid channel triggers WeChat Pay with one-to-one Order
For channels whose price is greater than 0 (`mail`, `sms`, `unbreakable`), the system SHALL create the `Letter` (status=0 审核中) and a one-to-one `Order` (status=0 待支付) in a single transaction at launch time, call WeChat Pay unified order to obtain prepay params keyed by a unique `out_trade_no` (written to `Order`), and return those params to the client. The system SHALL create the `LetterContact` at launch. It SHALL mark `Order.status=1 支付成功` (and fill WeChat return fields) only after the WeChat async notify callback confirms successful payment (idempotent on `out_trade_no`). The `Order` is the canonical record of the WeChat Pay lifecycle and is aligned with the V3 interface return values.

#### Scenario: Paid launch creates letter + pending order
- **WHEN** an authenticated user launches a paid channel
- **THEN** the system creates a `Letter` (status=0) + `LetterContact` and a pending `Order` (status=0, `out_trade_no` set), returns WeChat Pay prepay params (including `out_trade_no`), and does NOT yet mark payment success

#### Scenario: Payment callback marks order paid
- **WHEN** WeChat calls the notify endpoint for a valid, unpaid `out_trade_no`
- **THEN** the system marks the linked `Order` paid (status=1, idempotent) and fills WeChat return fields (`transaction_id`/`trade_state`/`trade_type`/`bank_type`/`payer_openid`/`currency`/`payer_total`/`success_time`), then deletes the draft

#### Scenario: Duplicate notify is idempotent
- **WHEN** the notify callback is delivered more than once for the same `out_trade_no`
- **THEN** the system processes it only once (no duplicate Letter, no duplicate payment state)

### Requirement: Handwritten letter address collection
For the `mail` (手写信件) channel, the system SHALL collect the recipient's mailing `address`. The mini-program SHALL prefill the address from the user's saved `UserCoord` of type `address` when available; when no address coord exists, the address field SHALL be required and the user must fill it manually. The backend SHALL reject a `mail` launch with an empty `address`.

#### Scenario: Address prefilled from saved coord
- **WHEN** a user launches `mail` and has a saved `address` coord
- **THEN** the mini-program prefills the address field with that coord value

#### Scenario: Address required when missing
- **WHEN** a user launches `mail` without any saved address coord and leaves the address empty
- **THEN** the backend returns 400 and the letter is not created

### Requirement: Unbreakable vow contact collection and validation
For the `unbreakable` (牢不可破的誓言) channel, the system SHALL require exactly one `address`, one `phone`, and one `email`. The system SHALL validate `phone` against mainland-China 11-digit format `^1[3-9]\d{9}$` and `email` against a common email format `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`. Any invalid value SHALL result in a 400 error and the letter SHALL NOT be created.

#### Scenario: Valid contacts accepted
- **WHEN** a user launches `unbreakable` with a valid 11-digit phone, a valid email, and a non-empty address
- **THEN** the system accepts the launch and stores the three contacts on `LetterContact`

#### Scenario: Invalid phone rejected
- **WHEN** a user launches `unbreakable` with a phone not matching `^1[3-9]\d{9}$`
- **THEN** the system returns 400 and does not create the Letter

#### Scenario: Invalid email rejected
- **WHEN** a user launches `unbreakable` with a malformed email
- **THEN** the system returns 400 and does not create the Letter

### Requirement: Delivery contacts reuse and auto-create UserCoord
For any delivery channel (`mail`, `sms`, `unbreakable`), the system SHALL accept each required contact value either as a `coordId` referencing an existing `UserCoord` owned by the caller whose `coord_type` matches the field (`address` for `mail`, `phone` for `sms`, `address`/`phone`/`email` for `unbreakable`), or as a raw `value`. If a `coordId` is supplied, the system SHALL resolve the contact value from that coord; a `coordId` not owned by the caller or of the wrong `coord_type` MUST be rejected with HTTP 400/404. If a raw `value` is supplied and no `UserCoord` of that type with the same value exists for the user, the system SHALL create a new `UserCoord` using the same value validation as `user-coord-crud` (so it is reusable on future launches). The resolved value SHALL be stored on `LetterContact`.

#### Scenario: Existing coord referenced by coordId
- **WHEN** a user launches with a valid `coordId` of the matching type owned by them
- **THEN** the system uses that coord's `coord_value` as the contact and does NOT create a duplicate coord

#### Scenario: New value auto-creates a coord
- **WHEN** a user launches with a raw `value` that is not yet saved as a coord of that type for them
- **THEN** the system creates a `UserCoord` with that value (subject to validation) and uses it as the contact

#### Scenario: Wrong or foreign coordId rejected
- **WHEN** a launch references a `coordId` owned by another user or of the wrong `coord_type`
- **THEN** the system rejects the request with HTTP 400/404 and does not create the Letter

#### Scenario: Auto-created coord is reusable
- **WHEN** the same user launches again and the previously auto-created value now exists as a coord
- **THEN** they MAY reference it via `coordId` instead of re-entering the value
