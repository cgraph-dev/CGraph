---
phase: 29-secret-chat
plan: 02
status: complete
executed_at: 2026-03-10
---

# Plan 29-02 Summary: Secret Chat Frontend UI

## What Was Built

### Task 1: Secret Chat Module Structure (15 files, 1,423 lines)
Created complete module at `apps/web/src/modules/secret-chat/`:
- **store/types.ts** (111 lines) — `SecretThemeId` (12 literal values), `SecretTheme`, `GhostModeState`, `SecretChatSession`, `SecretChatActions`, `SecretChatState` interfaces
- **store/secretChatStore.ts** (132 lines) — Zustand v5 store with devtools; actions: `setSession`, `setTheme`, `toggleGhostMode`, `setGhostToggling`, `setGhostActive`, `setExpiresAt`, `setAlias`, `panicWipe`, `reset`
- **components/SecretChatHeader.tsx** (123 lines) — Lock icon + "Secret" label, ghost toggle button, timer display, panic wipe trigger, kebab menu
- **components/GhostModeIndicator.tsx** (52 lines) — Pulsing animation overlay when ghost mode active
- **components/TimerCountdown.tsx** (100 lines) — Live countdown to `expiresAt`, auto-notifies at 5m/1m/10s
- **components/PanicWipeButton.tsx** (111 lines) — 3-second long-press to confirm destructive wipe
- **components/SecretIdentity.tsx** (103 lines) — Alias display + deterministic SVG avatar from alias hash
- **hooks/useSecretChat.ts** (308 lines) — Full hook combining store, API calls, and E2E crypto
- Barrel exports: `index.ts` in store/, components/, hooks/, themes/, module root

### Task 2: SecretChatHeader Component
Header replaces regular DM header when secret mode is active:
`← 🔒 Secret  [👻 Ghost]  [⏱ 24h]  [💣]  [⋮]`
- Ghost mode toggle via API (`POST /api/v1/secret-chats/ghost`)
- Timer countdown with expiry warnings
- Panic wipe with long-press confirmation
- Kebab menu for additional actions

### Task 3: 12 Secret Chat Themes
- **themeRegistry.ts** (123 lines) — Theme registry mapping 12 IDs to CSS classes and metadata
- **secret-themes.css** (222 lines) — CSS custom properties for each theme
- Themes: Void, Redacted, Midnight, Signal, Ghost, Cipher, Onyx, Eclipse, Static, Shadow, Obsidian, Abyss
- Each defines: background, text colors, bubble styles, accent colors, border styles

### Task 4: Secret Theme Equip Slot
Added secret theme selection section to customization page, separate from regular chat themes. Users can equip their preferred visual for secret conversations independently.

### Task 5: E2E Encryption Integration
Wired `useSecretChat.ts` to `@cgraph/crypto` package:
- **Key Agreement**: `pqxdhInitiate()` with `generateECKeyPair()` for PQXDH (Post-Quantum X3DH)
- **Secret Splitting**: `splitTripleRatchetSecret()` → 32-byte `skEc` + 32-byte `skScka`
- **Triple Ratchet**: `TripleRatchetEngine.initializeAlice()` for message encryption
- **Protocol Store**: `InMemoryProtocolStore` for identity key TOFU tracking
- **Encrypt**: `encryptMessage(plaintext)` → serialized `TripleRatchetMessage` (base64 JSON)
- **Decrypt**: `decryptMessage(ciphertext)` → plaintext string
- **Serialization**: Custom `serializeMessage`/`deserializeMessage` for transport (MessageHeader with `dh`, `n`, `pn`, `sessionId`, `timestamp`, `version` fields)
- **Key Zeroization**: `sharedSecret`, `skEc`, `skScka`, and plaintext bytes zeroed after use

## Files Created
| File | Lines | Purpose |
|------|-------|---------|
| `modules/secret-chat/store/types.ts` | 111 | State + action type definitions |
| `modules/secret-chat/store/secretChatStore.ts` | 132 | Zustand store with devtools |
| `modules/secret-chat/store/index.ts` | 12 | Barrel export |
| `modules/secret-chat/components/SecretChatHeader.tsx` | 123 | Main header component |
| `modules/secret-chat/components/GhostModeIndicator.tsx` | 52 | Ghost mode animation |
| `modules/secret-chat/components/TimerCountdown.tsx` | 100 | Expiry countdown |
| `modules/secret-chat/components/PanicWipeButton.tsx` | 111 | Long-press wipe button |
| `modules/secret-chat/components/SecretIdentity.tsx` | 103 | Alias + SVG avatar |
| `modules/secret-chat/components/index.ts` | 17 | Barrel export |
| `modules/secret-chat/hooks/useSecretChat.ts` | 308 | Hook: store + API + E2E crypto |
| `modules/secret-chat/hooks/index.ts` | 5 | Barrel export |
| `modules/secret-chat/themes/themeRegistry.ts` | 123 | 12-theme registry |
| `modules/secret-chat/themes/secret-themes.css` | 222 | Theme CSS custom properties |
| `modules/secret-chat/themes/index.ts` | 4 | Barrel export |
| `modules/secret-chat/index.ts` | — | Module barrel export |

All paths relative to `apps/web/src/`

## Commits
| Hash | Message |
|------|---------|
| `f6fcd60e` | feat(secret-chat): build secret chat module structure with store, components, and hooks |
| `a6a83dc7` | feat(secret-chat): add 12 CSS-only secret chat themes with theme registry |
| `a17d67e6` | feat(secret-chat): add secret theme equip slot to customization page |
| `dca62119` | feat(secret-chat): integrate E2E encryption via @cgraph/crypto Triple Ratchet |
| `ee9f3c44` | fix(secret-chat): align crypto type usage with @cgraph/crypto API |

## Deviations from Plan
- **CSS-only themes (no WebP textures)**: Plan mentioned WebP textures but implementation uses pure CSS custom properties. This is better — zero asset downloads, instant theme switching.
- **E2E uses Triple Ratchet (not Double Ratchet alone)**: Plan said "doubleRatchet.ts" but the implementation correctly uses the full `TripleRatchetEngine` which wraps Double Ratchet EC + SPQR post-quantum layer. This matches the crypto package's recommended API.
- **Crypto type fix required**: Initial agent implementation used incorrect property names (publicKey/messageNumber/previousChainLength instead of dh/n/pn). Fixed in commit `ee9f3c44`.

## Verification
- TypeScript: 0 errors in `secret-chat/` directory (`npx tsc --noEmit`)
- All 15 files created and properly structured
- E2E crypto imports resolve correctly against `@cgraph/crypto`
- Total new code: 1,423 lines across 15 files
