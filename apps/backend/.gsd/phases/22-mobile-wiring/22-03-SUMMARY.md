# Plan 22-03 Summary — X3DH DH4 & WatermelonDB Message Bridge

## Result: ✅ Complete

## Commits

| Hash | Message |
|------|---------|
| `b264ebfe` | feat(mobile): implement X3DH DH4 one-time prekey computation |
| `bdff8553` | feat(mobile): add one-time prekey lifecycle tracking for X3DH |
| `814bf40d` | feat(mobile): add sender profile columns to WatermelonDB message schema |
| `865d194e` | feat(mobile): cache sender profile in offline message bridge |

## What Changed

### Task 1: X3DH DH4 Implementation
- Initiator: computes DH4 = ECDH(ephemeralPrivate, oneTimePrekey) when bundle includes OPK
- Responder: added optional `oneTimePreKeyPkcs8` parameter for mirror DH4 computation
- dhConcat dynamically sized: 3×32 bytes (no OPK) or 4×32 bytes (with OPK)
- Return type extended with `usedOneTimePrekey: boolean` and `oneTimePreKeyId?: string`
- Graceful degradation to 3-DH when no one-time prekey available

### Task 2: OPK Lifecycle
- `storeOneTimePreKeyPrivates(opks)` — persists OPK PKCS8 to SecureStore
- `loadOneTimePreKeyPrivate(keyId)` — retrieves single OPK for responder
- `deleteConsumedOneTimePreKey(keyId)` — deletes after first use (Signal spec)
- `needsOneTimePreKeyReplenishment(threshold)` — checks if new OPKs needed
- `clearE2EEData()` updated to also clear OPK storage

### Task 3: Schema v2
- Added `sender_display_name` and `sender_avatar_url` columns to messages table
- Schema version bumped 1 → 2
- Migration via `addColumns` for v1→v2
- WatermelonDB Message model updated with `@text` decorators

### Task 4: Sender Profile Caching
- `watermelonToMessage`: reads sender profile from record, falls back to null
- `applyMessageToRaw`: writes sender_display_name/sender_avatar_url from message.sender
- Offline messages now display sender names and avatars without network access
- Fixed pre-existing bug: reactions_json assignment was overwritten by duplicate metadata_json

## Files Modified (4)
- `lib/crypto/e2ee.ts` (DH4 + OPK lifecycle)
- `lib/database/schema.ts` (schema v2)
- `lib/database/migrations.ts` (v1→v2 migration)
- `lib/database/models/message.ts` (new columns)
- `lib/database/messageBridge.ts` (sender profile caching)
