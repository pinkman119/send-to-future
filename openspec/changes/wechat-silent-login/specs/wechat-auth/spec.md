## ADDED Requirements

### Requirement: WeChat silent login endpoint
The backend SHALL expose `POST /wechat/login` that accepts a JSON body `{ "code": string }` (the `code` obtained from `uni.login({ provider: 'weixin' })`), performs a WeChat `code2session` exchange, upserts the corresponding user by `openid`, and returns a signed JWT `token` together with the user's basic info (`userId`, `planetCode`, `nickname`, `isNewUser`).

#### Scenario: New user logs in silently
- **WHEN** the endpoint receives a valid `code` for a WeChat user whose `openid` does not yet exist in `user`
- **THEN** the system creates a `user` record with the resolved `openid`, a generated unique `planet_code`, a default `nickname`, and returns HTTP 200 with `{ token, user: { userId, planetCode, nickname, isNewUser: true } }`.

#### Scenario: Returning user logs in silently
- **WHEN** the endpoint receives a valid `code` for a WeChat user whose `openid` already exists in `user`
- **THEN** the system updates `last_login_at` and returns HTTP 200 with `{ token, user: { userId, planetCode, nickname, isNewUser: false } }`.

#### Scenario: Invalid or expired code
- **WHEN** the endpoint receives a `code` that is missing, malformed, or rejected by WeChat (`errcode != 0`)
- **THEN** the system returns a 4xx error and does NOT create or modify any user record.

### Requirement: WeChat code2session exchange
The backend SHALL call the WeChat `code2session` API (`https://api.weixin.qq.com/sns/jscode2session`) using configured `WECHAT_APPID` and `WECHAT_SECRET` plus the supplied `code`, and SHALL extract `openid` (and `unionid`/`session_key` when present) from the response.

#### Scenario: Successful exchange
- **WHEN** WeChat returns `errcode: 0` with an `openid`
- **THEN** the resolved `openid` is used as the user identity key and `unionid`/`session_key` are persisted on the user when available.

#### Scenario: WeChat API failure
- **WHEN** the WeChat API returns a non-zero `errcode` or the network call fails
- **THEN** the login request fails with a client error and no user is created.

### Requirement: JWT issuance identifies the user
The backend SHALL issue a stateless JWT whose payload contains the internal `userId`, signed with `JWT_SECRET`. The `token` SHALL NOT contain the raw `openid` or `session_key`.

#### Scenario: Token decodes to the correct user
- **WHEN** a client later presents the issued `token`
- **THEN** the backend can verify the signature and resolve the same `userId` that was returned at login.

### Requirement: Mini-program silent login on launch
The mini-program (uni-app) SHALL, at the very first moment of `App.onLaunch`, call the uni-app official API `uni.login({ provider: 'weixin' })` to obtain a `code` and send it to `POST /wechat/login` in the background (via `uni.request`), storing the returned `token` and user info into `globalData` and local storage (`uni.setStorageSync`). This process SHALL be non-blocking and invisible to the user.

#### Scenario: First launch performs silent login
- **WHEN** the user opens the mini-program for the first time
- **THEN** `uni.login({ provider: 'weixin' })` is invoked, the `code` is sent to the backend, and upon success the `token` and user info are persisted locally without any UI prompt.

#### Scenario: Login failure does not block the app
- **WHEN** the silent login request fails (network/error)
- **THEN** the app still renders normally and the failure is tolerated silently (no crash, no blocking dialog).

### Requirement: Authenticated request helper
The mini-program SHALL provide a request utility that attaches the stored `token` as `Authorization: Bearer <token>` on subsequent backend calls and exposes helpers to read the current `token`/user info and login state.

#### Scenario: Token attached to requests
- **WHEN** any backend API call is made after a successful silent login
- **THEN** the outgoing request includes the `Authorization` header with the stored bearer token.

#### Scenario: No token before login completes
- **WHEN** a request is attempted before any token is available
- **THEN** the request proceeds without the `Authorization` header (public endpoints) or is deferred/retryable per caller logic.
