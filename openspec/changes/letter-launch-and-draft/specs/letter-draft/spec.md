## ADDED Requirements

### Requirement: Letter draft auto-save (upsert per user)
The system SHALL provide an authenticated endpoint that saves the user's in-progress launch form as a single `LetterDraft` record keyed by `user_id`, using upsert semantics (create if absent, update if present). The saved draft SHALL capture at least: `mode`, `content`, `keyword`, `channel_code`, `is_public`, `selected_years`, `custom_date`, `from_name`, `to_name`, and contact fields `contact_phone`/`contact_email`/`contact_address`/`extra_contacts`.

#### Scenario: First save creates a draft
- **WHEN** an authenticated user calls the draft-save endpoint with a non-empty form for the first time
- **THEN** the system creates exactly one `LetterDraft` row for that `user_id` and returns success

#### Scenario: Subsequent save updates the same draft
- **WHEN** the same user calls the draft-save endpoint again (e.g. every 30s)
- **THEN** the system updates the existing `LetterDraft` for that `user_id` in place (no duplicate rows) and refreshes `update_time`

### Requirement: Draft reload on launch page open
The system SHALL provide an authenticated endpoint that returns the current user's saved `LetterDraft` (if any) so the mini-program can repopulate the launch form when the page is reopened.

#### Scenario: Existing draft is returned
- **WHEN** an authenticated user with a saved draft opens the launch page
- **THEN** the system returns the saved draft fields and the mini-program prefills the form

#### Scenario: No draft returns empty
- **WHEN** an authenticated user with no saved draft opens the launch page
- **THEN** the system returns an empty/non-existent result and the mini-program shows a blank form

### Requirement: Draft deleted after successful launch
The system SHALL delete the user's `LetterDraft` after a letter is successfully launched (free channel on launch, paid channel on payment-success callback).

#### Scenario: Draft removed on launch success
- **WHEN** a user's letter is successfully created (status=0)
- **THEN** the system deletes that user's `LetterDraft` so it is not reused or reloaded

### Requirement: Draft persists across app exits
The system SHALL retain a user's `LetterDraft` when the mini-program is closed or the page is unloaded, so the user can resume writing later.

#### Scenario: Draft survives page unload
- **WHEN** the user leaves the launch page without launching
- **THEN** the saved `LetterDraft` remains in the database and is available on next open

#### Scenario: Best-effort save on unload
- **WHEN** the launch page is about to unload (onUnload/onHide)
- **THEN** the mini-program performs a final draft-save call (best-effort) in addition to the 30s interval
