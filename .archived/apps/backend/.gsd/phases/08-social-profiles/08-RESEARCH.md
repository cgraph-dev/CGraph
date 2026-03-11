# Phase 8: Social & Profiles — Research

**Researched:** 2026-02-28 **Domain:** User profiles, real-time presence, user search, blocking, QR
authentication, onboarding **Confidence:** HIGH

## Summary

Phase 8 builds the social layer on top of the existing auth and messaging systems. The codebase
already has extensive infrastructure for most Phase 8 requirements — this is primarily a **wiring
and gap-filling phase**, not a greenfield build.

**What already exists (significant):**

- Complete presence system (`CGraph.Presence` with Tracker, Queries, Store, Sampled) —
  Phoenix.Presence + Redis + Cachex
- User search via Meilisearch (primary) + PostgreSQL ILIKE (fallback) with trigram indexes —
  `CGraph.Search.Users`
- Block/unblock API endpoints (`POST/DELETE /friends/:id/block`) with bidirectional blocking in the
  Friendship schema
- Blocked-user exclusion in search results (`maybe_exclude_blocked/2` in Search.Users)
- Profile editing (bio, display_name, signature, avatar upload) — `CGraph.Accounts.Profile` +
  `UserController`
- Onboarding wizard on both web (4-step: welcome → profile → notifications → features) and mobile
  (avatar → display name → bio → notifications)
- Custom status modal on web (`custom-status-modal.tsx`) with presence modes and expiry options
- `usePresence` hooks on both web (global friend presence) and mobile (conversation-level)
- Presence channel (`PresenceChannel`) with friend-filtered broadcasting, heartbeats, bulk status,
  app state tracking
- `custom_status` and `status_message` fields already on the User schema

**What needs to be built or enhanced:**

1. **Onboarding wizard enhancement** — Add "find friends" and "join community" steps (current wizard
   lacks AUTH-09's friend-finding step)
2. **QR code login** — New protocol for authenticating web sessions from an already-authenticated
   mobile device (AUTH-11)
3. **Presence for contacts (global)** — Wire the existing presence system to show online/offline for
   contacts outside of conversations (NOTIF-05)
4. **Custom status text persistence** — Ensure `status_message` is saved to DB and broadcast to
   contacts (NOTIF-06)
5. **Block completeness** — Verify blocking filters presence broadcasts and messaging, not just
   search (MOD-03)

**Primary recommendation:** Leverage the extensive existing infrastructure. Most requirements need
integration/wiring rather than new systems. QR login is the only truly new protocol to implement.

## Standard Stack

### Core (Already Installed)

| Library                  | Version                    | Purpose                                 | Why Standard                                                       |
| ------------------------ | -------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| Phoenix.Presence         | (bundled with Phoenix)     | Real-time presence tracking             | Already in use via `CGraph.Presence` — CRDT-based, cluster-aware   |
| Meilisearch              | via `CGraph.Search.Engine` | User search (primary)                   | Already configured with users index, typo tolerance, ranking rules |
| pg_trgm (PostgreSQL)     | (extension enabled)        | Fuzzy username search (fallback)        | Already has `users_username_trgm_idx` GIN index                    |
| qrcode.react             | ^4.2.0                     | QR code display (web)                   | Already installed from Phase 7 safety numbers                      |
| react-native-qrcode-svg  | ^6.3.21                    | QR code display (mobile)                | Already installed from Phase 7 safety numbers                      |
| expo-camera              | ~17.0.0                    | QR code scanning (mobile)               | Already installed, used for safety number verification scanning    |
| expo-image-picker        | ~17.0.0                    | Avatar selection (mobile)               | Already used in onboarding screen                                  |
| Redis (via CGraph.Redis) | —                          | Presence persistence, last-seen storage | Already powers `CGraph.Presence.Store` sorted sets and hashes      |
| Cachex                   | —                          | Last-seen caching                       | Already used with 7-day TTL for last_seen timestamps               |

### Supporting (May Need)

| Library                   | Version | Purpose                               | When to Use                                                                                                                   |
| ------------------------- | ------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| react-easy-crop           | ^5.x    | Avatar cropping (web)                 | Needed for web avatar upload with square crop — mobile already has `allowsEditing: true, aspect: [1, 1]` in expo-image-picker |
| crypto (Node.js built-in) | —       | QR login token generation             | For generating secure random tokens in the QR login protocol                                                                  |
| :crypto (Erlang)          | —       | QR login server-side token generation | For generating secure random challenge tokens                                                                                 |

### Alternatives Considered

| Instead of                           | Could Use                           | Tradeoff                                                                    |
| ------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------- |
| Meilisearch                          | PostgreSQL-only full-text + trigram | Already have both; Meilisearch gives sub-50ms fuzzy search. Keep dual-path. |
| react-easy-crop                      | Browser canvas manual crop          | react-easy-crop handles pinch/zoom, aspect ratio lock. Don't hand-roll.     |
| Phoenix.Presence for global presence | Custom ETS/Redis tracker            | Phoenix.Presence is already integrated and working. No reason to replace.   |

## Architecture Patterns

### Existing Project Structure (Social Module)

```
apps/web/src/modules/social/
├── components/
│   ├── custom-status-modal.tsx       # ✅ Exists — status text + emoji + expiry
│   ├── profile-stats.tsx             # ✅ Exists
│   └── user-profile-card/            # ✅ Exists — full profile card with hooks
├── hooks/
│   ├── usePresence.ts                # ✅ Exists — global friend presence tracking
│   ├── useProfileActions.ts          # ✅ Exists
│   ├── useProfileData.ts             # ✅ Exists
│   └── useProfileEdit.ts             # ✅ Exists — avatar/banner upload, bio edit

apps/web/src/pages/auth/onboarding/
├── onboarding.tsx                    # ✅ Exists — 4-step wizard
├── welcome-step.tsx                  # ✅ Exists — avatar + display name
├── profile-step.tsx                  # ✅ Exists — bio + theme
├── notifications-step.tsx            # ✅ Exists
├── features-step.tsx                 # ✅ Exists
├── useOnboarding.ts                  # ✅ Exists
└── constants.tsx                     # ✅ Exists — step definitions

apps/mobile/src/screens/auth/onboarding/
├── onboarding-screen.tsx             # ✅ Exists — avatar → display name → bio → notifications
├── types.ts                          # ✅ Exists
├── styles.ts                         # ✅ Exists
└── index.ts                          # ✅ Exists

apps/backend/lib/cgraph/
├── presence.ex                       # ✅ Exists — full Presence module (Tracker + Queries + Store + Sampled)
├── presence/tracker.ex               # ✅ Exists — track/untrack/update_status/set_status_message/heartbeat
├── presence/queries.ex               # ✅ Exists — user_online?/bulk_status/list_online_users
├── presence/store.ex                 # ✅ Exists — Redis-backed, last_seen, paginated listing
├── search/users.ex                   # ✅ Exists — Meilisearch + PostgreSQL ILIKE with block exclusion
├── accounts/profile.ex               # ✅ Exists — get_profile/update_profile/update_bio
├── accounts/friends/management.ex    # ✅ Exists — block_user/unblock_user/remove_friend
└── accounts/friendship.ex            # ✅ Exists — schema with :pending/:accepted/:blocked statuses
```

### Pattern 1: QR Code Login Protocol

**What:** Secure cross-device authentication — scan QR on mobile to log into web browser **When to
use:** AUTH-11 requirement **Protocol flow:**

```
1. Web: Request QR login session → POST /api/v1/auth/qr-session
   Backend generates: { session_id: UUID, challenge: random_bytes(32), expires_at: +5min }
   Stores in Redis with TTL
   Returns: { session_id, challenge, qr_payload: base64(JSON({session_id, challenge, server_url})) }

2. Web: Displays QR code encoding the qr_payload
   Web opens WebSocket subscription on channel "qr_auth:{session_id}"
   Web polls or listens for session completion

3. Mobile: Already authenticated user scans QR code
   Decodes → extracts session_id + challenge
   Signs challenge with user's auth token: HMAC-SHA256(challenge, user_access_token)

4. Mobile: POST /api/v1/auth/qr-login (authenticated)
   Body: { session_id, signature: signed_challenge, device_info }
   Backend verifies:
     a. session_id exists and not expired in Redis
     b. signature matches HMAC(challenge, user's server-side token)
     c. session not already completed
   On success:
     - Generate new access_token + refresh_token for web session
     - Store session
     - Broadcast on "qr_auth:{session_id}" channel: { status: "authenticated", tokens }
     - Delete Redis session

5. Web: Receives auth via WebSocket → stores tokens → redirects to app
```

**Security considerations:**

- Sessions expire in 5 minutes (short TTL prevents replay)
- One-time use (deleted after completion)
- Challenge-response prevents session hijacking
- Mobile must be authenticated (uses existing auth)
- Rate limiting on QR session creation (max 5 per minute)
- Use HMAC signature, not just forwarding the mobile token

### Pattern 2: Block Enforcement Points

**What:** Comprehensive blocking that filters across all social features **When to use:** MOD-03
requirement

```
BLOCK ENFORCEMENT CHECKLIST:
├── Search results          ✅ EXISTS — maybe_exclude_blocked() in Search.Users
├── Friend requests         ✅ EXISTS — block_user() removes friendship
├── Direct messaging        🔧 VERIFY — need to check socket channel join/message handling
├── Presence broadcasts     🔧 VERIFY — PresenceChannel filters by friend_ids, but blocked != non-friend
├── Profile viewing         🔧 WIRE — blocked user should see minimal/"User not found" profile
├── Group membership        ⏭ DEFER — Phase 11 (Groups)
└── Notifications           ⏭ DEFER — Phase 9 (Notifications)
```

**Implementation pattern:** Use a BlockEnforcement module that provides a `blocked?/2` check usable
across all enforcement points:

```elixir
# Already exists: CGraph.Accounts.Friends.Queries.blocked?(blocker_id, blocked_id)
# Pattern: check both directions (A blocked B, or B blocked A)
def mutually_blocked?(user_a, user_b) do
  blocked?(user_a, user_b) || blocked?(user_b, user_a)
end
```

### Pattern 3: Presence + Status Integration

**What:** Custom status text persisted to DB and broadcast to contacts **When to use:** NOTIF-06
requirement

```
Existing flow:
  1. Socket event "set_status" → PresenceChannel.handle_in
  2. Calls Presence.update_status(socket, user_id, "lobby", status)
  3. Broadcasts "friend_status_changed" to friend_ids

Enhancement needed:
  1. Also persist status_message to User record in DB
  2. Include status_message in presence state payloads
  3. Restore status_message from DB on reconnection
  4. Clear status on expiry (the web modal already has expiry options)
```

### Anti-Patterns to Avoid

- **Broadcasting presence to all users:** Already avoided — PresenceChannel filters by `friend_ids`.
  Never change this.
- **Storing presence in PostgreSQL:** Already avoided — uses Redis + Phoenix.Presence CRDT. Don't
  add DB writes on every heartbeat.
- **Blocking only on one enforcement point:** Must block across search + messaging + presence +
  profile viewing symmetrically.
- **Making onboarding mandatory-blocking:** Onboarding should be skippable. Don't lock users out of
  the app.
- **Polling for QR login status:** Use WebSocket channel subscription, not REST polling.

## Don't Hand-Roll

| Problem                  | Don't Build                     | Use Instead                                          | Why                                                                          |
| ------------------------ | ------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Avatar cropping (web)    | Canvas-based manual crop        | react-easy-crop                                      | Handles zoom/pan/aspect ratio, touch-friendly, proven UX                     |
| Avatar cropping (mobile) | Custom camera crop              | expo-image-picker with `allowsEditing: true`         | Already configured in mobile onboarding code                                 |
| QR code rendering        | SVG path generation             | qrcode.react (web), react-native-qrcode-svg (mobile) | Already installed, used in safety number screens                             |
| QR code scanning         | Custom camera barcode parser    | expo-camera with BarCodeScanner                      | Already used in QRCodeScanner component for safety numbers                   |
| User search              | Custom search index             | Meilisearch (primary) + PostgreSQL ILIKE (fallback)  | Already built with `CGraph.Search.Engine`, typo tolerance, relevance ranking |
| Presence tracking        | Custom WebSocket state tracking | Phoenix.Presence + Redis store                       | Already built with multi-device aggregation, CRDT sync, heartbeats           |
| Block list management    | Custom table + queries          | Friendship schema with `:blocked` status             | Already built with `block_user/2`, `unblock_user/2`, `blocked?/2`            |
| Image upload             | Custom multipart handling       | Existing `UserController.upload_avatar` endpoint     | Already handles multipart form data → local storage path                     |

**Key insight:** Almost all the infrastructure exists. The risk is not in building new systems, but
in improperly wiring existing ones. Focus on integration, not construction.

## Common Pitfalls

### Pitfall 1: Incomplete Block Enforcement

**What goes wrong:** Blocking a user hides them from search but they can still see your presence or
message you. **Why it happens:** Block checks added piecemeal instead of systematically at every
enforcement point. **How to avoid:** Create a checklist of all interaction surfaces and verify each
one. Use the `blocked?/2` function from `CGraph.Accounts.Friends.Queries` consistently. Consider
adding a `mutually_blocked?/2` variant that checks both directions. **Warning signs:** User reports
that blocked users can still see their online status or send messages.

### Pitfall 2: QR Login Session Hijacking

**What goes wrong:** Attacker captures QR code and authenticates before legitimate user. **Why it
happens:** QR payload doesn't include sufficient entropy or challenge-response mechanism. **How to
avoid:**

- Short TTL (5 minutes max)
- Cryptographic challenge-response (HMAC-SHA256)
- One-time use (delete session after first successful auth)
- Rate limiting on session creation
- Display confirmation on mobile ("Log in to CGraph Web?") before sending auth **Warning signs:**
  Multiple authentication attempts on the same session_id.

### Pitfall 3: Status Message Not Persisting Across Reconnections

**What goes wrong:** User sets custom status "In a meeting", disconnects, reconnects — status is
gone. **Why it happens:** Status only stored in Phoenix.Presence metadata (ephemeral) but not
persisted. **How to avoid:** On `set_status` event, also update `User.custom_status` /
`User.status_message` in the database. On `after_join`, restore the persisted status from the user
record. The User schema already has `custom_status` and `status_message` fields. **Warning signs:**
Status disappears after page reload or network reconnect.

### Pitfall 4: Onboarding Wizard Not Idempotent

**What goes wrong:** User partially completes onboarding, closes app, reopens — starts from scratch
or enters broken state. **Why it happens:** Onboarding state not tracked server-side. **How to
avoid:** Track onboarding completion via a user field (e.g., `onboarding_completed_at`). Save each
step progressively. If user returns, resume from last completed step. The existing mobile onboarding
already calls `api.post('/api/v1/users/onboarding/complete')` at the end — but there's no backend
handler yet for this endpoint. **Warning signs:** User stuck in loop, or profile data lost between
sessions.

### Pitfall 5: Presence Storms on Mass Reconnect

**What goes wrong:** Server restart causes all clients to reconnect simultaneously, flooding
presence broadcasts. **Why it happens:** Every reconnect triggers `friend_online` broadcast to all
friends. **How to avoid:** The existing PresenceChannel already uses a heartbeat interval (15s) and
offline grace period (8s). Ensure reconnection uses exponential backoff (already implemented in
Phase 1 INFRA-05). Consider batching presence broadcasts on mass reconnect. **Warning signs:**
CPU/memory spike after server deployment.

## Code Examples

### Existing: Block User + Exclude from Search

```elixir
# Source: apps/backend/lib/cgraph/accounts/friends/management.ex
def block_user(blocker_id, blocked_id) do
  Repo.transaction(fn ->
    # Remove existing friendships
    from(f in Friendship,
      where: f.user_id == ^blocker_id and f.friend_id == ^blocked_id,
      or_where: f.user_id == ^blocked_id and f.friend_id == ^blocker_id
    )
    |> Repo.delete_all()

    # Create block record
    %Friendship{}
    |> Friendship.changeset(%{
      user_id: blocker_id,
      friend_id: blocked_id,
      status: :blocked
    })
    |> Repo.insert!()

    :ok
  end)
end
```

```elixir
# Source: apps/backend/lib/cgraph/search/users.ex
defp maybe_exclude_blocked(query, current_user) do
  blocker_id = current_user.id
  from u in query,
    where: u.id not in subquery(
      from b in "blocks",
      where: b.blocker_id == type(^blocker_id, Ecto.UUID),
      select: b.blocked_id
    )
end
```

### Existing: Custom Status via WebSocket

```elixir
# Source: apps/backend/lib/cgraph_web/channels/presence_channel.ex
def handle_in("set_status", %{"status" => status} = params, socket) do
  user = socket.assigns.current_user
  friend_ids = socket.assigns[:friend_ids] || get_friend_ids(user.id)

  case Presence.update_status(socket, user.id, "lobby", status) do
    {:ok, _} ->
      broadcast_to_friends(user.id, friend_ids, "friend_status_changed", %{
        user_id: user.id,
        status: status,
        status_message: params["status_message"],
        updated_at: DateTime.utc_now() |> DateTime.to_iso8601()
      })
      {:reply, :ok, socket}
    {:error, reason} ->
      {:reply, {:error, %{reason: reason}}, socket}
  end
end
```

### Existing: Web Presence Hook

```typescript
// Source: apps/web/src/modules/social/hooks/usePresence.ts
export function usePresence(): PresenceState {
  const { isAuthenticated, user } = useAuthStore();
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsConnected(false);
      setOnlineFriends(new Set());
      return;
    }
    const channel = socketManager.joinPresenceLobby();
    if (channel) {
      setIsConnected(true);
      setOnlineFriends(new Set(socketManager.getOnlineFriends()));
    }
    // ...subscribe to status changes
  }, [isAuthenticated, user]);

  return { isConnected, onlineFriends, isUserOnline, onlineCount };
}
```

### New: QR Auth Session Endpoint (Backend Pattern)

```elixir
# Pattern for QR login session creation
def create_qr_session(conn, _params) do
  session_id = Ecto.UUID.generate()
  challenge = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
  expires_at = DateTime.add(DateTime.utc_now(), 300, :second)  # 5 minutes

  # Store in Redis with TTL
  qr_data = %{
    session_id: session_id,
    challenge: challenge,
    status: "pending",
    created_at: DateTime.utc_now() |> DateTime.to_iso8601()
  }

  CGraph.Redis.command([
    "SET", "qr_auth:#{session_id}",
    Jason.encode!(qr_data),
    "EX", "300"
  ])

  # QR payload for mobile to scan
  qr_payload = Base.url_encode64(Jason.encode!(%{
    sid: session_id,
    ch: challenge,
    srv: CGraphWeb.Endpoint.url()
  }))

  json(conn, %{
    session_id: session_id,
    qr_payload: qr_payload,
    expires_at: DateTime.to_iso8601(expires_at)
  })
end
```

### New: Onboarding Step — Find Friends Pattern

```typescript
// Pattern for "find friends" onboarding step
// Uses existing user search + contact permission on mobile
const FindFriendsStep = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);

  const handleSearch = async (q: string) => {
    if (q.length < 2) return;
    const { data } = await api.get('/api/v1/search/users', { params: { q } });
    setResults(data.users);
  };

  return (
    <div>
      <SearchInput value={searchQuery} onChange={handleSearch} placeholder="Search by username..." />
      {results.map(user => (
        <UserCard key={user.id} user={user} onAddFriend={handleSendRequest} />
      ))}
    </div>
  );
};
```

## State of the Art

| Old Approach                 | Current Approach                                                 | When Changed                                | Impact                                               |
| ---------------------------- | ---------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| Poll-based presence          | WebSocket + CRDT Phoenix.Presence                                | Already implemented                         | Real-time presence without polling overhead          |
| PostgreSQL ILIKE-only search | Meilisearch (primary) + PostgreSQL (fallback)                    | Already implemented                         | Sub-50ms fuzzy search with graceful degradation      |
| QR login via URL redirect    | QR login via WebSocket challenge-response                        | Current standard (WhatsApp/Discord pattern) | More secure — no tokens in URL, short-lived sessions |
| Single-field blocking        | Multi-surface blocking (search + presence + messaging + profile) | Required for this phase                     | Complete social safety                               |

**Deprecated/outdated:**

- Direct token-in-QR patterns (security risk — use challenge-response instead)
- Server-sent events for presence (Phoenix Channels are superior with CRDT diffing)

## Open Questions

1. **Avatar storage backend**
   - What we know: Current `upload_avatar` stores to `/uploads/avatars/{user_id}/{filename}` (local
     filesystem)
   - What's unclear: Is there an S3/R2 backend configured, or is it still local-only?
   - Recommendation: Verify during planning; if local-only, that's fine for now but should migrate
     to object storage before Phase 19 (Launch)

2. **Onboarding "find friends" contacts integration (mobile)**
   - What we know: AUTH-09 spec says "find friends" step. Mobile has `expo-contacts` available.
   - What's unclear: Should this import phone contacts to match against CGraph users, or just
     provide search?
   - Recommendation: Start with username/name search only (already built via
     `/api/v1/search/users`). Contact import is a privacy-sensitive feature that could be deferred.
     The search-based approach satisfies the requirement.

3. **QR login — mobile camera permission flow**
   - What we know: `expo-camera` is already installed and permission handling exists in
     `QRCodeScanner.tsx`
   - What's unclear: Whether to reuse the existing QRCodeScanner or create a dedicated QR login
     scanner component
   - Recommendation: Create a new `QRLoginScanner` component that reuses the camera permission
     pattern from `QRCodeScanner` but has its own UI specific to login flow

4. **Block bidirectionality in current implementation**
   - What we know: `block_user(blocker_id, blocked_id)` creates a one-directional block record in
     the friendship table. `maybe_exclude_blocked` only checks `blocker_id` direction.
   - What's unclear: Does the blocked user also stop seeing the blocker? (Bidirectional hiding)
   - Recommendation: Verify and implement bidirectional check — both `blocked?(A, B)` AND
     `blocked?(B, A)` at all enforcement points

5. **Custom status expiry mechanism**
   - What we know: Web `custom-status-modal.tsx` already supports expiry options (30m, 1h, 4h,
     today)
   - What's unclear: Whether the backend has a scheduled job to clear expired statuses
   - Recommendation: Use an Oban job that clears expired statuses. Store `status_expires_at` in the
     user record.

## Sources

### Primary (HIGH confidence)

- **Codebase investigation** — Direct file reads of:
  - `apps/backend/lib/cgraph/presence.ex` + submodules (Tracker, Queries, Store)
  - `apps/backend/lib/cgraph/search/users.ex` — Meilisearch + PostgreSQL search
  - `apps/backend/lib/cgraph/accounts/friends/management.ex` — Block/unblock
  - `apps/backend/lib/cgraph_web/channels/presence_channel.ex` — Friend-filtered presence
  - `apps/backend/lib/cgraph_web/controllers/api/v1/friend_controller.ex` — Block API
  - `apps/web/src/pages/auth/onboarding/` — Web onboarding wizard (13 files)
  - `apps/mobile/src/screens/auth/onboarding/` — Mobile onboarding screen
  - `apps/web/src/modules/social/` — Social module hooks and components
  - `packages/shared-types/src/models.ts` — User type with status/statusMessage
- Context7: `/websites/hexdocs_pm_phoenix` — Phoenix.Presence API (track, update, list, fetch
  callbacks)

### Secondary (MEDIUM confidence)

- **QR login protocol** — Based on established patterns from WhatsApp Web, Discord, Telegram Web
  (challenge-response over WebSocket). Specific implementation details (HMAC-SHA256 signing,
  Redis-backed sessions) are architectural recommendations.
- **react-easy-crop** — Standard library for web image cropping in React apps; well-maintained,
  widely used.

### Tertiary (LOW confidence)

- **Status expiry via Oban** — Recommended pattern based on existing Oban usage in codebase. Needs
  validation that Oban is configured and available for this use case.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — All identified libraries are already installed or part of the existing
  tech stack
- Architecture: **HIGH** — Extensive existing infrastructure verified by direct code inspection
- Pitfalls: **HIGH** — Based on patterns observed in the actual codebase (e.g., one-directional
  block check)
- QR login protocol: **MEDIUM** — Based on industry-standard patterns; implementation details are
  recommendations
- Onboarding enhancements: **MEDIUM** — Current wizard exists; enhancement scope depends on AUTH-09
  interpretation

**Research date:** 2026-02-28 **Valid until:** 2026-03-28 (30 days — stable domain, existing
infrastructure)
