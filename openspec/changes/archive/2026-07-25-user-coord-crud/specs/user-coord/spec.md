# user-coord Specification

## ADDED Requirements

### Requirement: Authenticated user can list own coordinates
The system SHALL allow an authenticated user to retrieve the list of their own `user_coord` records, excluding any record whose `delete_time` is set (soft-deleted). The response SHALL contain each coordinate's `coord_id`, `coord_type`, and `coord_value`.

#### Scenario: List returns only the caller's coordinates
- **WHEN** an authenticated user with `user_id=U` requests their coordinate list
- **THEN** the system returns only `user_coord` records where `user_id=U` and `delete_time` is null.

#### Scenario: Soft-deleted coordinates are excluded
- **WHEN** the user has previously deleted a coordinate (its `delete_time` is set)
- **THEN** that coordinate does not appear in the list response.

#### Scenario: Empty list when user has no coordinates
- **WHEN** an authenticated user has not created any coordinate
- **THEN** the system returns an empty list (HTTP 200 with an empty array).

### Requirement: Coordinate type is restricted to four kinds
The system SHALL accept only the following `coord_type` values when creating or updating a coordinate: `phone` (手机号), `email` (邮箱地址), `wechat` (微信号), `address` (邮寄地址). Any other value MUST be rejected with HTTP 400.

#### Scenario: Valid type is accepted
- **WHEN** a create/update request carries `coord_type` of `phone`, `email`, `wechat`, or `address`
- **THEN** the system accepts the request (subject to value validation).

#### Scenario: Unknown type is rejected
- **WHEN** a create/update request carries a `coord_type` outside the four allowed values (e.g. `fax`)
- **THEN** the system rejects the request with HTTP 400 and an error describing the allowed types.

### Requirement: Coordinate value is validated by type
The system SHALL validate `coord_value` according to `coord_type` before persisting:
- `phone`: MUST match `^1[3-9]\d{9}$` (mainland China 11-digit mobile number).
- `email`: MUST match `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` (common email format).
- `wechat`: MUST be a non-empty string (1–255 chars).
- `address`: MUST be a non-empty string (1–255 chars).

A value that fails its type's rule MUST be rejected with HTTP 400 and a type-specific message.

#### Scenario: Valid phone is accepted
- **WHEN** a `phone` coordinate carries value `13800138000`
- **THEN** the system persists it successfully.

#### Scenario: Invalid phone is rejected
- **WHEN** a `phone` coordinate carries value `12345` or `1380013800a`
- **THEN** the system rejects the request with HTTP 400 indicating the phone format is invalid.

#### Scenario: Invalid email is rejected
- **WHEN** an `email` coordinate carries value `not-an-email`
- **THEN** the system rejects the request with HTTP 400 indicating the email format is invalid.

#### Scenario: Empty address or wechat is rejected
- **WHEN** an `address` or `wechat` coordinate carries an empty/whitespace-only value
- **THEN** the system rejects the request with HTTP 400 indicating the value is required.

### Requirement: Authenticated user can create a coordinate
The system SHALL allow an authenticated user to create a coordinate by supplying `coord_type` and `coord_value`. The system SHALL associate the new record with the authenticated user's `user_id` and return the created coordinate (including generated `coord_id`). A user MAY hold multiple coordinates of the same type.

#### Scenario: Create succeeds with valid input
- **WHEN** an authenticated user posts a valid `coord_type`/`coord_value` pair
- **THEN** the system creates a `user_coord` row owned by that user and returns it with HTTP 200/201.

#### Scenario: Multiple coordinates of the same type allowed
- **WHEN** a user already has a `phone` coordinate and creates another `phone` coordinate
- **THEN** both records are stored and both appear in the user's list.

### Requirement: Authenticated user can update own coordinate
The system SHALL allow an authenticated user to update the `coord_type` and/or `coord_value` of a coordinate they own. The same type/value validation rules apply on update. The system MUST reject an update targeting a coordinate that does not belong to the caller (HTTP 403 or 404).

#### Scenario: Update own coordinate succeeds
- **WHEN** the authenticated user updates a `coord_id` that belongs to them with valid data
- **THEN** the system persists the change and returns the updated coordinate.

#### Scenario: Update of another user's coordinate is rejected
- **WHEN** the authenticated user attempts to update a `coord_id` owned by a different user
- **THEN** the system rejects the request with HTTP 403 or 404 and does not modify the record.

### Requirement: Authenticated user can delete own coordinate (soft delete)
The system SHALL allow an authenticated user to delete a coordinate they own. Deletion MUST be a soft delete: the system sets `delete_time` to the current time rather than physically removing the row. The system MUST reject a delete targeting a coordinate that does not belong to the caller (HTTP 403 or 404).

#### Scenario: Soft delete own coordinate
- **WHEN** the authenticated user deletes a `coord_id` that belongs to them
- **THEN** the system sets `delete_time` on that row and returns success; the row is excluded from subsequent list responses.

#### Scenario: Delete of another user's coordinate is rejected
- **WHEN** the authenticated user attempts to delete a `coord_id` owned by a different user
- **THEN** the system rejects the request with HTTP 403 or 404 and does not modify the record.

### Requirement: Coordinate endpoints require authentication
All coordinate endpoints SHALL require a valid JWT issued by the existing `AuthGuard`. Requests without a valid token MUST be rejected with HTTP 401.

#### Scenario: Missing or invalid token is rejected
- **WHEN** a request to any coordinate endpoint omits the `Authorization: Bearer` token or carries an invalid/expired token
- **THEN** the system returns HTTP 401 without performing the operation.

#### Scenario: Valid token proceeds
- **WHEN** a request carries a valid JWT and the path is not whitelisted
- **THEN** the system resolves the caller's `user_id` from the token and proceeds with the operation.
