# CGraph Architecture Transformation Plan

> **⚠️ ASPIRATIONAL DOCUMENT** — This document describes the _desired_ end-state architecture. Most
> items listed here are NOT yet implemented. Do not reference this document as evidence of current
> capabilities. See [CURRENT_STATE_DASHBOARD.md](CURRENT_STATE_DASHBOARD.md) for honest status.

## Mission: Outperform Meta, Google, and CGraph

**Current Score: 4.8/10 (as of Feb 4, 2026 audit — see SESSION_34+ for updated scores)** | **Target
Score: 10/10** | **Philosophy: BUILD, DON'T DELETE**

> **We don't delete code because it's hard. We implement it properly and connect it.**

---

## 🔍 CODE QUALITY AUDIT (February 4, 2026)

### Executive Summary

| Metric                | Current | Target   | Status      |
| --------------------- | ------- | -------- | ----------- |
| `any` types           | 203     | 0        | 🔴 Critical |
| Files >300 lines      | 47      | 0        | 🔴 Critical |
| Files >1000 lines     | 20      | 0        | 🔴 Critical |
| `console.log` calls   | 276     | 0 (prod) | 🟡 Warning  |
| `@ts-ignore` comments | 7       | 0        | 🟡 Warning  |
| `eslint-disable`      | 40      | 0        | 🟡 Warning  |
| TODO/FIXME comments   | 41      | 0        | 🟡 Warning  |
| Test files (web)      | 49      | 200+     | 🔴 Critical |
| Test files (mobile)   | 15      | 100+     | 🔴 Critical |
| Backend tests         | 1,327   | 2,000+   | 🟡 Warning  |
| Store files           | 107     | 30       | 🔴 Critical |

### Critical Violations: Files Over 1,000 Lines

These files MUST be split. Meta would reject these in code review.

| File                              | Lines     | Max | Action Required           |
| --------------------------------- | --------- | --- | ------------------------- |
| `ConversationScreen.tsx` (mobile) | **5,840** | 300 | Split into 20+ components |
| `CustomizationDemo.tsx`           | 3,510     | 300 | Split into 12+ components |
| `forums.ex` (backend)             | 3,379     | 500 | Split into 7+ contexts    |
| `UICustomizationScreen.tsx`       | 2,120     | 300 | Split into 7+ components  |
| `SearchScreen.tsx`                | 2,097     | 300 | Split into 7+ components  |
| `accounts.ex` (backend)           | 1,864     | 500 | Split into 4+ contexts    |
| `ForumAdmin.tsx`                  | 1,768     | 300 | Split into 6+ components  |
| `gamification.ex` (backend)       | 1,661     | 500 | Split into 4+ contexts    |
| `WhosOnlineScreen.tsx`            | 1,614     | 300 | Split into 6+ components  |
| `IdentityCustomization.tsx`       | 1,581     | 300 | Split into 6+ components  |
| `HolographicUIv4.tsx`             | 1,579     | 300 | Split into 6+ components  |
| `ForumLeaderboardScreen.tsx`      | 1,490     | 300 | Split into 5+ components  |
| `HolographicUI.tsx` (mobile)      | 1,458     | 300 | Split into 5+ components  |
| `CustomEmojiPicker.tsx`           | 1,424     | 300 | Split into 5+ components  |
| `CGraphAttachmentPicker.tsx`      | 1,424     | 300 | Split into 5+ components  |
| `GamificationHubScreen.tsx`       | 1,403     | 300 | Split into 5+ components  |
| `CoinShopScreen.tsx`              | 1,399     | 300 | Split into 5+ components  |
| `EffectsCustomization.tsx`        | 1,369     | 300 | Split into 5+ components  |
| `LandingPage.tsx`                 | 1,316     | 300 | Split into 5+ components  |
| `jobs.ex` (backend)               | 1,253     | 500 | Split into 3+ modules     |

### Critical Violations: `any` Type Usage

Location of worst offenders (MUST FIX):

```bash
# WebRTC Service (19 any types) - NEEDS PROPER TYPES
apps/mobile/src/lib/webrtc/webrtcService.ts

# Store Helpers (4 any types) - NEEDS GENERICS
apps/web/src/stores/utils/storeHelpers.ts

# Animation System (5 any types) - NEEDS PROPER TYPES
apps/mobile/src/lib/animations/TimelineSystem.ts
apps/mobile/src/lib/animations/AnimatedComponents.tsx

# Forum Store (2 any types) - NEEDS API RESPONSE TYPES
apps/web/src/modules/forums/store/forumStore.impl.ts

# Payment Service (3 any types) - NEEDS ERROR TYPES
apps/mobile/src/lib/payment.ts
```

### Refactoring Plan: ConversationScreen.tsx (5,840 → 300 lines)

```
apps/mobile/src/screens/messages/ConversationScreen.tsx (5,840 lines)
                    ↓ SPLIT INTO ↓

apps/mobile/src/screens/messages/
├── ConversationScreen.tsx (300 max) - Main orchestrator
├── components/
│   ├── ConversationHeader.tsx (150 max)
│   ├── MessageList.tsx (200 max)
│   ├── MessageItem.tsx (150 max)
│   ├── MessageBubble.tsx (100 max)
│   ├── MessageActions.tsx (100 max)
│   ├── MessageReactions.tsx (100 max)
│   ├── ReplyPreview.tsx (80 max)
│   ├── TypingIndicator.tsx (50 max)
│   ├── DateSeparator.tsx (30 max)
│   ├── UnreadBanner.tsx (50 max)
│   ├── ScrollToBottom.tsx (50 max)
│   ├── AttachmentPreview.tsx (150 max)
│   ├── VoiceMessagePlayer.tsx (150 max)
│   ├── ImageGallery.tsx (150 max)
│   ├── LinkPreview.tsx (100 max)
│   ├── QuotedMessage.tsx (80 max)
│   ├── ForwardedMessage.tsx (80 max)
│   └── SystemMessage.tsx (50 max)
├── hooks/
│   ├── useConversation.ts (100 max)
│   ├── useMessages.ts (100 max)
│   ├── useTyping.ts (50 max)
│   ├── useScrollPosition.ts (50 max)
│   └── useMessageActions.ts (100 max)
└── utils/
    ├── messageGrouping.ts (50 max)
    └── dateFormatting.ts (30 max)
```

### Refactoring Plan: forums.ex (3,379 → 500 lines per file)

```
apps/backend/lib/cgraph/forums.ex (3,379 lines)
                    ↓ SPLIT INTO ↓

apps/backend/lib/cgraph/forums/
├── forums.ex (300 max) - Public API facade
├── forum_service.ex (400 max) - Forum CRUD
├── post_service.ex (400 max) - Post CRUD
├── comment_service.ex (300 max) - Comment CRUD
├── voting_service.ex (200 max) - Voting logic
├── karma_service.ex (200 max) - Karma calculations
├── moderation_service.ex (300 max) - Mod actions
├── category_service.ex (200 max) - Categories
├── subscription_service.ex (200 max) - Subscriptions
├── invite_service.ex (200 max) - Invite links
└── queries/
    ├── forum_queries.ex (200 max)
    ├── post_queries.ex (200 max)
    └── feed_queries.ex (200 max)
```

### Store Consolidation Plan (107 → 30 stores)

Current state is chaotic:

- 67 stores in `/stores/`
- 40 stores in `/modules/*/store/`
- Duplicates and overlaps everywhere

Target architecture:

```
apps/web/src/stores/
├── facades/                    # 7 facade files (entry points)
│   ├── authFacade.ts          # Auth, user, session, wallet
│   ├── chatFacade.ts          # Messages, conversations, typing
│   ├── communityFacade.ts     # Forums, groups, servers
│   ├── gamificationFacade.ts  # XP, karma, achievements
│   ├── settingsFacade.ts      # Privacy, notifications, profile
│   ├── marketplaceFacade.ts   # Items, purchases, inventory
│   └── uiFacade.ts            # Theme, sidebar, modals, toasts
├── core/                       # 12 core stores (implementations)
│   ├── authStore.ts
│   ├── userStore.ts
│   ├── chatStore.ts
│   ├── forumStore.ts
│   ├── groupStore.ts
│   ├── gamificationStore.ts
│   ├── settingsStore.ts
│   ├── notificationStore.ts
│   ├── presenceStore.ts
│   ├── searchStore.ts
│   ├── themeStore.ts
│   └── customizationStore.ts
└── utils/                      # Shared utilities
    ├── createStore.ts
    ├── persist.ts
    └── devtools.ts
```

### Type Safety Fixes Required

```typescript
// ❌ CURRENT: webrtcService.ts line 19-30
declare const RTCPeerConnection: any;
declare const RTCSessionDescription: any;
declare const RTCIceCandidate: any;
type AnyFunction = (...args: any[]) => any;

// ✅ REQUIRED: Proper WebRTC types
import type {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';

interface PeerConnection extends RTCPeerConnection {
  userId: string;
  connectionState: RTCPeerConnectionState;
}
```

```typescript
// ❌ CURRENT: storeHelpers.ts line 23
export type ZustandSet = (partial: any) => void;

// ✅ REQUIRED: Generic type
export type ZustandSet<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
```

```typescript
// ❌ CURRENT: forumStore.impl.ts line 854
const rawForums = ensureArray<any>(response.data, 'data');

// ✅ REQUIRED: Typed response
interface ForumListResponse {
  data: Forum[];
  meta: { cursor?: string; hasMore: boolean };
}
const rawForums = ensureArray<Forum>(response.data as ForumListResponse, 'data');
```

### Debug Statement Removal

```bash
# Files with console.log to remove (top 10)
apps/web/src/lib/socket.ts                    # 12 calls
apps/web/src/stores/chatStore.ts              # 8 calls
apps/mobile/src/lib/webrtc/webrtcService.ts   # 15 calls
apps/mobile/src/screens/messages/*            # 20+ calls
apps/web/src/modules/forums/store/*           # 10 calls

# Backend debug statements (51 total)
apps/backend/lib/cgraph/messaging.ex          # 8 calls
apps/backend/lib/cgraph/crypto/e2ee.ex        # 6 calls
```

Replace with proper logging:

```typescript
// ❌ FORBIDDEN
console.log('Message sent:', message);

// ✅ REQUIRED - Structured logging
import { logger } from '@/lib/logger';
logger.info('message.sent', { messageId: message.id, conversationId });
```

```elixir
# ❌ FORBIDDEN
IO.inspect(message, label: "sent message")

# ✅ REQUIRED - Structured logging
Logger.info("message.sent", message_id: message.id, conversation_id: conversation_id)
```

### ESLint/TypeScript Suppression Removal

All 47 suppression comments must be fixed:

```bash
# Find and fix these
grep -rn "@ts-ignore\|@ts-expect-error\|eslint-disable" apps/web/src apps/mobile/src

# Each suppression needs:
# 1. Understand WHY it was added
# 2. Fix the underlying type/lint issue
# 3. Remove the suppression comment
```

### Test Coverage Requirements

| Area                | Current | Required | Gap  |
| ------------------- | ------- | -------- | ---- |
| Web Components      | ~5%     | 70%      | +65% |
| Web Stores          | ~10%    | 80%      | +70% |
| Web Hooks           | ~5%     | 70%      | +65% |
| Mobile Screens      | ~3%     | 60%      | +57% |
| Mobile Components   | ~5%     | 70%      | +65% |
| Backend Contexts    | ~40%    | 80%      | +40% |
| Backend Controllers | ~30%    | 70%      | +40% |
| E2E Tests           | 0%      | 20%      | +20% |

### Action Items Summary

| Priority | Action                           | Files Affected  | Effort  |
| -------- | -------------------------------- | --------------- | ------- |
| P0       | Split ConversationScreen.tsx     | 1 → 20+ files   | 2 days  |
| P0       | Split forums.ex                  | 1 → 12 files    | 1 day   |
| P0       | Fix WebRTC types                 | 1 file          | 4 hours |
| P1       | Split remaining >1000 line files | 18 files        | 5 days  |
| P1       | Consolidate stores (107 → 30)    | 77 files        | 3 days  |
| P1       | Remove all `any` types           | 203 occurrences | 2 days  |
| P2       | Remove console.log (prod)        | 276 occurrences | 1 day   |
| P2       | Remove suppression comments      | 47 occurrences  | 1 day   |
| P2       | Remove TODO comments             | 41 occurrences  | 4 hours |
| P3       | Add web component tests          | 200+ tests      | 5 days  |
| P3       | Add mobile screen tests          | 100+ tests      | 3 days  |

### Meta/CGraph Code Review Readiness

Would this pass a Meta code review? **NO** - Current state would be rejected.

| Criterion        | Meta Standard    | CGraph Current   | Status     |
| ---------------- | ---------------- | ---------------- | ---------- |
| File size        | <300 lines       | 5,840 max        | ❌ FAIL    |
| Type safety      | No `any`         | 203 `any`        | ❌ FAIL    |
| Test coverage    | >70%             | ~10%             | ❌ FAIL    |
| Debug logs       | 0 in prod        | 276              | ❌ FAIL    |
| Suppressions     | 0                | 47               | ❌ FAIL    |
| Error handling   | Structured       | console.error    | ❌ FAIL    |
| Documentation    | JSDoc all public | Sparse           | ⚠️ PARTIAL |
| Code duplication | DRY              | Some duplication | ⚠️ PARTIAL |

After completing all action items: **YES** - Would pass Meta review.

---

## 📜 PROFESSIONAL CODING STANDARDS (MANDATORY)

Every developer MUST follow these rules. No exceptions. This is how we outperform industry giants.

### Rule 1: File Size Limits (Google/Meta Standard)

| File Type  | Max Lines | Warning At | Action if Exceeded        |
| ---------- | --------- | ---------- | ------------------------- |
| Components | 300       | 200        | Split into sub-components |
| Stores     | 400       | 300        | Extract slices            |
| Hooks      | 150       | 100        | Compose smaller hooks     |
| Utils      | 100       | 75         | Create focused modules    |
| API files  | 200       | 150        | Split by resource         |

**ESLint enforcement:**

```javascript
// .eslintrc.js - MANDATORY
'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
'max-lines-per-function': ['error', { max: 50 }],
```

### Rule 2: TypeScript Strictness (Google Standard)

```typescript
// ❌ FORBIDDEN - Will fail code review
const data: any = response;
function process(input: any): any {}
// @ts-ignore
// @ts-expect-error

// ✅ REQUIRED - Professional code
interface ApiResponse {
  data: User[];
  meta: Pagination;
}
const data: ApiResponse = response;
function process(input: UserInput): ProcessedOutput {}
```

### Rule 3: Component Architecture (Meta Standard)

```typescript
// ❌ FORBIDDEN - God components
const ForumPage = () => {
  // 500+ lines of mixed concerns
}

// ✅ REQUIRED - Composition pattern
const ForumPage = () => (
  <ForumLayout>
    <ForumHeader />
    <ForumContent>
      <ThreadList />
      <Sidebar>
        <ForumStats />
        <MemberList />
      </Sidebar>
    </ForumContent>
  </ForumLayout>
);
```

### Rule 4: State Management (CGraph Pattern)

```typescript
// ❌ FORBIDDEN - Direct store access everywhere
import { useForumStore } from '@/stores/forumStore';
const forums = useForumStore((state) => state.forums);

// ✅ REQUIRED - Use facades for all external access
import { useCommunityFacade } from '@/stores/facades';
const { forums, createForum, joinForum } = useCommunityFacade();
```

### Rule 5: API Error Handling (Google SRE Standard)

```typescript
// ❌ FORBIDDEN - Silent failures
try {
  await api.call();
} catch (e) {
  console.log(e);
}

// ✅ REQUIRED - Proper error boundaries
try {
  await api.call();
} catch (error) {
  if (error instanceof NetworkError) {
    toast.error('Connection lost. Retrying...');
    await retryWithBackoff(api.call);
  } else if (error instanceof ValidationError) {
    setFieldErrors(error.fields);
  } else {
    logger.error('Unexpected error', { error, context });
    toast.error('Something went wrong. Please try again.');
  }
}
```

### Rule 6: Platform Parity (CGraph Standard)

```typescript
// ❌ FORBIDDEN - Platform-specific logic in shared code
if (Platform.OS === 'web') {
  /* web stuff */
}

// ✅ REQUIRED - Abstract platform differences
// packages/core/forum/createForum.ts (shared logic)
export const createForum = async (data: CreateForumInput) => {
  const validated = validateForumInput(data);
  return api.forums.create(validated);
};

// apps/web/modules/forums/hooks/useCreateForum.ts
import { createForum } from '@cgraph/core/forum';
// apps/mobile/modules/forums/hooks/useCreateForum.ts
import { createForum } from '@cgraph/core/forum';
```

### Rule 7: Testing (Industry Standard 70%+)

```typescript
// ❌ FORBIDDEN - Untested features
export const ForumCard = ({ forum }) => { /* no test */ };

// ✅ REQUIRED - Co-located tests
// ForumCard.tsx
export const ForumCard = ({ forum }: ForumCardProps) => { ... };

// ForumCard.test.tsx (same folder)
describe('ForumCard', () => {
  it('displays forum name and member count', () => { });
  it('shows premium badge for premium forums', () => { });
  it('handles join button click', () => { });
});
```

### Rule 8: Documentation (Self-Documenting Code)

```typescript
// ❌ FORBIDDEN - Cryptic code
const x = u.f.filter((f) => f.t === 'p' && f.m > 5);

// ✅ REQUIRED - Self-documenting
const premiumForumsWithActiveMembers = user.forums.filter(
  (forum) => forum.tier === 'premium' && forum.memberCount > 5
);
```

### Rule 9: Industry Code Patterns (MANDATORY)

These patterns are used by CGraph (200M+ users) and Meta (3.4B+ users). We adopt them exactly.

#### Pattern 1: Event-Driven Architecture (CGraph/CGraph)

```typescript
// ❌ FORBIDDEN - Direct mutations
const sendMessage = async (content: string) => {
  await api.post('/messages', { content });
  queryClient.invalidateQueries(['messages']); // Causes refetch storms
};

// ✅ REQUIRED - Optimistic updates + event-driven
const sendMessage = async (content: string) => {
  const tempId = `temp-${Date.now()}`;

  // 1. Optimistic update (instant UI)
  queryClient.setQueryData(['messages'], (old) => [
    ...old,
    { id: tempId, content, status: 'sending' },
  ]);

  // 2. Send to server
  const result = await api.post('/messages', { content });

  // 3. Replace temp with real (via WebSocket event, not refetch)
  // Server broadcasts 'message:created' to all clients
};
```

#### Pattern 2: Minimal Payload Broadcasting (CGraph)

```typescript
// ❌ FORBIDDEN - Broadcasting full objects
socket.broadcast('message:created', {
  id: message.id,
  content: message.content,
  sender: { id: sender.id, name: sender.name, avatar: sender.avatar, ... },
  conversation: { id: conv.id, name: conv.name, members: [...] },
  // 50+ fields...
});

// ✅ REQUIRED - Broadcast IDs, clients fetch what they need
socket.broadcast('message:created', {
  messageId: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
});

// Client fetches from cache or API
const message = useMessage(event.messageId);  // Usually already cached
```

#### Pattern 3: Request Coalescing (Meta TAO)

```typescript
// ❌ FORBIDDEN - N+1 requests
const MessageList = ({ messages }) => {
  return messages.map(msg => (
    <Message key={msg.id} sender={useSender(msg.senderId)} />  // N requests!
  ));
};

// ✅ REQUIRED - Batch and dedupe
const MessageList = ({ messages }) => {
  const senderIds = [...new Set(messages.map(m => m.senderId))];
  const senders = useSenders(senderIds);  // Single batched request

  return messages.map(msg => (
    <Message key={msg.id} sender={senders[msg.senderId]} />
  ));
};
```

#### Pattern 4: Cursor Pagination (CGraph/All Scale Apps)

```typescript
// ❌ FORBIDDEN - Offset pagination (O(n) at scale)
const getMessages = (page: number) => api.get(`/messages?page=${page}&limit=50`); // Slow at page 1000

// ✅ REQUIRED - Cursor pagination (O(1) always)
const getMessages = (cursor?: string) => api.get(`/messages?cursor=${cursor}&limit=50`);

// Cursor is typically: base64(lastMessageId + timestamp)
```

#### Pattern 5: Denormalized Counts (CGraph)

```elixir
# ❌ FORBIDDEN - Computing counts on read
def get_forum(id) do
  forum = Repo.get(Forum, id)
  member_count = Repo.aggregate(Membership, :count, forum_id: id)  # Slow!
  %{forum | member_count: member_count}
end

# ✅ REQUIRED - Denormalized count columns
schema "forums" do
  field :member_count, :integer, default: 0  # Updated on join/leave
  field :post_count, :integer, default: 0    # Updated on create/delete
end

# Update counts atomically
def add_member(forum, user) do
  Multi.new()
  |> Multi.insert(:membership, Membership.changeset(...))
  |> Multi.update_all(:count, Forum, [id: forum.id], inc: [member_count: 1])
  |> Repo.transaction()
end
```

#### Pattern 6: Presence & Typing (CGraph)

```typescript
// ✅ REQUIRED - Throttled presence updates
const useTypingIndicator = (conversationId: string) => {
  const throttledEmit = useThrottle(
    () => socket.emit('typing:start', { conversationId }),
    3000 // Max once per 3 seconds
  );

  const stopTyping = useDebounce(
    () => socket.emit('typing:stop', { conversationId }),
    5000 // Stop after 5s of inactivity
  );

  return {
    onKeyPress: () => {
      throttledEmit();
      stopTyping();
    },
  };
};
```

### Rule 10: Mobile-First Performance (CGraph)

```typescript
// ❌ FORBIDDEN - Desktop-first thinking
const ConversationList = () => {
  const conversations = useAllConversations();  // Loads everything
  return <VirtualList items={conversations} />;
};

// ✅ REQUIRED - Windowed rendering + lazy loading
const ConversationList = () => {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam }) => api.getConversations({ cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor,
  });

  return (
    <FlashList
      data={data?.pages.flatMap(p => p.items) ?? []}
      renderItem={({ item }) => <ConversationItem id={item.id} />}
      estimatedItemSize={72}
      onEndReached={() => hasNextPage && fetchNextPage()}
    />
  );
};
```

### Rule 11: Shared Code Between Platforms

```typescript
// packages/shared-types/src/index.ts
// ALL types shared between web and mobile

// packages/core/src/index.ts
// Business logic (validation, transformations) - NO UI

// packages/hooks/src/index.ts
// React hooks that work on both platforms

// ✅ REQUIRED structure for any new feature:
// 1. Types in @cgraph/shared-types
// 2. Logic in @cgraph/core
// 3. Hooks in @cgraph/hooks
// 4. UI in apps/web and apps/mobile (separate implementations)
```

### Rule 12: Error Boundaries & Recovery (Meta)

```typescript
// ✅ REQUIRED - Every major feature wrapped in error boundary
const ForumPage = () => (
  <ErrorBoundary
    fallback={<ForumErrorState onRetry={() => window.location.reload()} />}
    onError={(error) => logToSentry(error, { page: 'forum' })}
  >
    <ForumContent />
  </ErrorBoundary>
);

// ✅ REQUIRED - Graceful degradation
const MessageList = () => {
  const { data, error, isLoading } = useMessages();

  if (error) return <MessageListError error={error} />;
  if (isLoading) return <MessageListSkeleton count={10} />;
  if (!data?.length) return <EmptyMessages />;

  return <Messages data={data} />;
};
```

### Enforcement Mechanisms (MANDATORY SETUP)

These tools MUST be configured to automatically enforce standards. No exceptions.

#### 1. ESLint Configuration (apps/web/.eslintrc.js & apps/mobile/.eslintrc.js)

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // File size limits (Google/Meta Standard)
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],

    // TypeScript strictness (ZERO TOLERANCE)
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',

    // No debug statements in production
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',

    // No suppression comments
    'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'hack', 'xxx'] }],

    // React best practices
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
    'react-hooks/exhaustive-deps': 'error',
    'react/no-unstable-nested-components': 'error',

    // Import organization
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],
  },
  overrides: [
    {
      // Allow console in development/debug files
      files: ['**/__dev__/**', '**/*.test.*'],
      rules: {
        'no-console': 'off',
        'max-lines': 'off',
      },
    },
  ],
};
```

#### 2. TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### 3. Pre-commit Hooks (.husky/pre-commit)

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged for changed files
npx lint-staged

# Check file sizes
echo "Checking file sizes..."
for file in $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$'); do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 300 ]; then
    echo "ERROR: $file has $lines lines (max: 300)"
    exit 1
  fi
done

# Check for 'any' types in staged files
echo "Checking for 'any' types..."
if git diff --cached --name-only --diff-filter=ACM | xargs grep -l ': any\|as any\|<any>' 2>/dev/null; then
  echo "ERROR: Found 'any' types in staged files. Fix before committing."
  exit 1
fi

# Check for console.log
echo "Checking for console.log..."
if git diff --cached --name-only --diff-filter=ACM | xargs grep -l 'console\.log' 2>/dev/null | grep -v '__dev__\|\.test\.'; then
  echo "ERROR: Found console.log in production code. Remove before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

#### 4. lint-staged Configuration (package.json)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
    "*.{ex,exs}": ["mix format"]
  }
}
```

#### 5. CI Pipeline Checks (.github/workflows/ci.yml)

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm typecheck

      - name: Lint (zero warnings)
        run: pnpm lint --max-warnings 0

      - name: Check file sizes
        run: |
          find apps/web/src apps/mobile/src -name "*.tsx" -exec sh -c '
            lines=$(wc -l < "$1")
            if [ "$lines" -gt 300 ]; then
              echo "FAIL: $1 has $lines lines"
              exit 1
            fi
          ' _ {} \;

      - name: Check for any types
        run: |
          if grep -rn ": any\|as any" apps/web/src apps/mobile/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test."; then
            echo "FAIL: Found 'any' types"
            exit 1
          fi

      - name: Test with coverage
        run: pnpm test -- --coverage --coverageThreshold='{"global":{"statements":70}}'

      - name: Backend checks
        working-directory: apps/backend
        run: |
          mix format --check-formatted
          mix credo --strict
          mix dialyzer
```

#### 6. Credo Configuration (apps/backend/.credo.exs)

```elixir
%{
  configs: [
    %{
      name: "default",
      strict: true,
      checks: [
        # Readability
        {Credo.Check.Readability.MaxLineLength, max_length: 120},
        {Credo.Check.Readability.ModuleDoc, []},
        {Credo.Check.Readability.FunctionNames, []},

        # Design
        {Credo.Check.Design.AliasUsage, if_called_more_often_than: 2},
        {Credo.Check.Design.TagTODO, exit_status: 2},
        {Credo.Check.Design.TagFIXME, exit_status: 2},

        # Refactoring (file size limits)
        {Credo.Check.Refactor.FunctionArity, max_arity: 5},
        {Credo.Check.Refactor.CyclomaticComplexity, max_complexity: 10},
        {Credo.Check.Refactor.Nesting, max_nesting: 3},
        {Credo.Check.Refactor.LongQuoteBlocks, max_line_count: 100},

        # Warnings
        {Credo.Check.Warning.IoInspect, []},
        {Credo.Check.Warning.IExPry, []},
        {Credo.Check.Warning.Dbg, []},
      ]
    }
  ]
}
```

#### 7. Dialyzer Configuration (apps/backend/mix.exs)

```elixir
defp dialyzer do
  [
    plt_file: {:no_warn, "priv/plts/dialyzer.plt"},
    plt_add_apps: [:mix, :ex_unit],
    flags: [
      :unmatched_returns,
      :error_handling,
      :no_opaque,
      :unknown,
      :no_return
    ]
  ]
end
```

#### 8. PR Template (.github/PULL_REQUEST_TEMPLATE.md)

```markdown
## Code Quality Checklist

- [ ] All files under 300 lines
- [ ] No `any` types
- [ ] No `console.log` in production code
- [ ] No `@ts-ignore` or `eslint-disable` comments
- [ ] No TODO/FIXME comments (create issues instead)
- [ ] All functions have explicit return types
- [ ] Tests added/updated (coverage maintained >70%)
- [ ] Mobile parity considered (feature works on both platforms)

## Breaking Changes

<!-- List any breaking changes -->

## Testing

<!-- Describe how this was tested -->
```

### Quality Gates (Automated Enforcement)

| Gate            | Tool          | When       | Action on Fail |
| --------------- | ------------- | ---------- | -------------- |
| File size       | Custom script | Pre-commit | Block commit   |
| `any` types     | ESLint        | Pre-commit | Block commit   |
| console.log     | ESLint        | Pre-commit | Block commit   |
| Type safety     | TypeScript    | CI         | Block merge    |
| Lint warnings   | ESLint        | CI         | Block merge    |
| Test coverage   | Vitest/Jest   | CI         | Block merge    |
| Backend format  | mix format    | CI         | Block merge    |
| Backend quality | Credo strict  | CI         | Block merge    |
| Type specs      | Dialyzer      | CI         | Block merge    |

---

## 🚀 FEATURE IMPLEMENTATION: USER FORUM SYSTEM

### Overview

CGraph allows users to create and manage their own forums, similar to CGraph servers but with
discussions.

### Tier Limits (from packages/shared-types/src/tiers.ts)

| Tier           | Forums Owned | Storage   | AI Moderation    | Custom Features                         |
| -------------- | ------------ | --------- | ---------------- | --------------------------------------- |
| **Free**       | 1            | 100MB     | ❌               | Basic                                   |
| **Premium**    | 5            | 5GB       | ✅               | Custom themes, video calls              |
| **Enterprise** | Unlimited    | Unlimited | ✅ Custom models | API access, webhooks, dedicated support |

> **Note:** Prices are configured in Stripe and fetched dynamically. See
> `apps/backend/lib/cgraph/subscriptions/subscriptions.ex`.

### Database Schema

```elixir
# lib/cgraph/forums/schemas/forum.ex
defmodule CGraph.Forums.Forum do
  schema "forums" do
    field :name, :string
    field :slug, :string                    # Unique URL-friendly name
    field :description, :string
    field :icon_url, :string
    field :banner_url, :string
    field :visibility, Ecto.Enum, values: [:public, :private, :unlisted]
    field :member_count, :integer, default: 0
    field :post_count, :integer, default: 0

    belongs_to :owner, CGraph.Accounts.User
    has_many :memberships, CGraph.Forums.Membership
    has_many :members, through: [:memberships, :user]
    has_many :threads, CGraph.Forums.Thread
    has_many :invite_links, CGraph.Forums.InviteLink
    has_many :categories, CGraph.Forums.Category

    timestamps()
  end
end

# lib/cgraph/forums/schemas/membership.ex
defmodule CGraph.Forums.Membership do
  schema "forum_memberships" do
    field :role, Ecto.Enum, values: [:owner, :admin, :moderator, :member]
    field :joined_at, :utc_datetime
    field :invited_by_id, :binary_id

    belongs_to :user, CGraph.Accounts.User
    belongs_to :forum, CGraph.Forums.Forum

    timestamps()
  end
end

# lib/cgraph/forums/schemas/invite_link.ex
defmodule CGraph.Forums.InviteLink do
  schema "forum_invite_links" do
    field :code, :string                    # e.g., "abc123xyz"
    field :uses, :integer, default: 0
    field :max_uses, :integer               # nil = unlimited
    field :expires_at, :utc_datetime        # nil = never expires
    field :is_active, :boolean, default: true

    belongs_to :forum, CGraph.Forums.Forum
    belongs_to :created_by, CGraph.Accounts.User

    timestamps()
  end
end
```

### Backend Implementation

```elixir
# lib/cgraph/forums/forums.ex
defmodule CGraph.Forums do
  @moduledoc "Forum management with tier-based limits"

  alias CGraph.{Repo, Accounts, Subscriptions}
  alias CGraph.Forums.{Forum, Membership, InviteLink}

  @doc """
  Creates a forum for a user, respecting tier limits.

  ## Examples
      iex> create_forum(user, %{name: "My Forum"})
      {:ok, %Forum{}}

      iex> create_forum(free_user_at_limit, %{name: "Another Forum"})
      {:error, :forum_limit_reached}
  """
  def create_forum(%User{} = user, attrs) do
    with :ok <- check_forum_limit(user),
         {:ok, forum} <- do_create_forum(user, attrs),
         {:ok, _membership} <- create_owner_membership(forum, user) do
      {:ok, forum}
    end
  end

  defp check_forum_limit(user) do
    current_count = count_owned_forums(user)
    limit = get_forum_limit(user)

    if current_count < limit do
      :ok
    else
      {:error, :forum_limit_reached, %{current: current_count, limit: limit}}
    end
  end

  defp get_forum_limit(user) do
    # Tier limits from packages/shared-types/src/tiers.ts
    case Subscriptions.get_user_tier(user) do
      :free -> 1
      :premium -> 5
      :enterprise -> :unlimited
    end
  end

  @doc "Generate an invite link for a forum"
  def create_invite_link(%Forum{} = forum, %User{} = creator, opts \\ []) do
    %InviteLink{}
    |> InviteLink.changeset(%{
      forum_id: forum.id,
      created_by_id: creator.id,
      code: generate_invite_code(),
      max_uses: Keyword.get(opts, :max_uses),
      expires_at: Keyword.get(opts, :expires_at)
    })
    |> Repo.insert()
  end

  @doc "Join a forum via invite code"
  def join_via_invite(code, %User{} = user) do
    with {:ok, invite} <- get_valid_invite(code),
         :ok <- check_not_already_member(invite.forum, user),
         {:ok, membership} <- create_membership(invite.forum, user, :member),
         {:ok, _invite} <- increment_invite_uses(invite) do
      # Notify forum owner
      Notifications.notify(invite.forum.owner, :new_member, %{
        forum: invite.forum,
        user: user
      })
      {:ok, membership}
    end
  end

  @doc "Get shareable invite URL"
  def get_invite_url(%InviteLink{code: code}) do
    "#{Application.get_env(:cgraph, :app_url)}/invite/#{code}"
  end
end
```

### Frontend Store (Web)

```typescript
// apps/web/src/modules/forums/store/forumStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Forum, CreateForumInput, InviteLink } from '@cgraph/shared-types';

interface ForumState {
  // State
  ownedForums: Forum[];
  joinedForums: Forum[];
  currentForum: Forum | null;
  forumLimit: number;
  isLoading: boolean;

  // Actions
  createForum: (input: CreateForumInput) => Promise<Forum>;
  joinForum: (inviteCode: string) => Promise<void>;
  leaveForum: (forumId: string) => Promise<void>;
  createInviteLink: (forumId: string, options?: InviteLinkOptions) => Promise<InviteLink>;
  loadOwnedForums: () => Promise<void>;
  loadJoinedForums: () => Promise<void>;
}

export const useForumStore = create<ForumState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ownedForums: [],
        joinedForums: [],
        currentForum: null,
        forumLimit: 1,
        isLoading: false,

        createForum: async (input) => {
          const { ownedForums, forumLimit } = get();

          // Check client-side limit
          if (ownedForums.length >= forumLimit) {
            throw new ForumLimitError(ownedForums.length, forumLimit);
          }

          set({ isLoading: true });
          try {
            const forum = await api.forums.create(input);
            set((state) => {
              state.ownedForums.push(forum);
              state.isLoading = false;
            });
            return forum;
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        joinForum: async (inviteCode) => {
          set({ isLoading: true });
          try {
            const membership = await api.forums.joinViaInvite(inviteCode);
            set((state) => {
              state.joinedForums.push(membership.forum);
              state.isLoading = false;
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        createInviteLink: async (forumId, options = {}) => {
          const inviteLink = await api.forums.createInviteLink(forumId, options);
          return inviteLink;
        },
      })),
      { name: 'forum-store' }
    ),
    { name: 'ForumStore' }
  )
);
```

### Frontend Components (Web)

```typescript
// apps/web/src/modules/forums/components/CreateForumButton.tsx
import { useCommunityFacade } from '@/stores/facades';
import { usePremiumFacade } from '@/stores/facades';

export const CreateForumButton = () => {
  const { ownedForums, forumLimit, createForum } = useCommunityFacade();
  const { tier, openUpgradeModal } = usePremiumFacade();

  const canCreateMore = ownedForums.length < forumLimit;
  const remainingSlots = forumLimit - ownedForums.length;

  const handleClick = async () => {
    if (!canCreateMore) {
      openUpgradeModal({
        reason: 'forum_limit',
        message: `Upgrade to create more forums. You've used all ${forumLimit} slots.`
      });
      return;
    }
    // Open create forum modal
  };

  return (
    <Button onClick={handleClick} disabled={!canCreateMore}>
      Create Forum ({remainingSlots} remaining)
    </Button>
  );
};

// apps/web/src/modules/forums/components/InviteLinkGenerator.tsx
export const InviteLinkGenerator = ({ forum }: { forum: Forum }) => {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const { createInviteLink } = useCommunityFacade();

  const generateLink = async () => {
    const link = await createInviteLink(forum.id, {
      maxUses: null,      // Unlimited
      expiresAt: null,    // Never expires
    });
    setInviteLink(`https://cgraph.org/invite/${link.code}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink!);
    toast.success('Invite link copied!');
  };

  return (
    <GlassCard>
      <h3>Invite Members</h3>
      {inviteLink ? (
        <div className="flex gap-2">
          <Input value={inviteLink} readOnly />
          <Button onClick={copyToClipboard}>Copy</Button>
          <Button variant="secondary" onClick={generateLink}>New Link</Button>
        </div>
      ) : (
        <Button onClick={generateLink}>Generate Invite Link</Button>
      )}
      <p className="text-sm text-muted">
        Share this link to invite others to your forum
      </p>
    </GlassCard>
  );
};
```

### Mobile Implementation (React Native)

```typescript
// apps/mobile/src/modules/forums/screens/ForumScreen.tsx
import { Share } from 'react-native';
import { useForumStore } from '../store/forumStore';

export const ForumScreen = ({ route }) => {
  const { forumId } = route.params;
  const { currentForum, createInviteLink } = useForumStore();

  const shareInviteLink = async () => {
    const link = await createInviteLink(forumId);
    await Share.share({
      message: `Join my forum "${currentForum.name}" on CGraph!`,
      url: `https://cgraph.org/invite/${link.code}`,
    });
  };

  return (
    <SafeAreaView>
      <ForumHeader forum={currentForum} />
      <ThreadList forumId={forumId} />
      <FAB icon="share" onPress={shareInviteLink} />
    </SafeAreaView>
  );
};
```

### API Endpoints

```elixir
# lib/cgraph_web/controllers/api/v1/forum_controller.ex
defmodule CGraphWeb.Api.V1.ForumController do
  use CGraphWeb, :controller

  # POST /api/v1/forums
  def create(conn, params) do
    user = conn.assigns.current_user

    case Forums.create_forum(user, params) do
      {:ok, forum} ->
        conn
        |> put_status(:created)
        |> render(:show, forum: forum)

      {:error, :forum_limit_reached, %{current: current, limit: limit}} ->
        conn
        |> put_status(:payment_required)
        |> json(%{
          error: "forum_limit_reached",
          message: "You've reached your forum limit",
          current: current,
          limit: limit,
          upgrade_url: "/pricing"
        })
    end
  end

  # POST /api/v1/forums/:id/invite-links
  def create_invite_link(conn, %{"id" => forum_id} = params) do
    user = conn.assigns.current_user
    forum = Forums.get_forum!(forum_id)

    with :ok <- authorize(user, :manage, forum),
         {:ok, invite} <- Forums.create_invite_link(forum, user, params) do
      render(conn, :invite_link, invite: invite)
    end
  end

  # POST /api/v1/invites/:code/join
  def join_via_invite(conn, %{"code" => code}) do
    user = conn.assigns.current_user

    case Forums.join_via_invite(code, user) do
      {:ok, membership} ->
        render(conn, :membership, membership: membership)

      {:error, :invite_expired} ->
        conn |> put_status(:gone) |> json(%{error: "invite_expired"})

      {:error, :invite_max_uses} ->
        conn |> put_status(:gone) |> json(%{error: "invite_max_uses_reached"})

      {:error, :already_member} ->
        conn |> put_status(:conflict) |> json(%{error: "already_member"})
    end
  end
end
```

---

## 🎨 USER CUSTOMIZATION SYSTEM (Complete Implementation Guide)

### Philosophy: Users Express Identity, Others See It

Every customization a user selects MUST be:

1. **Visible to other users** - Profile themes, badges, borders visible on profiles/chat
2. **Consistent across platforms** - Same look on web AND mobile
3. **Persisted in backend** - Synced via API, not just local storage
4. **Extensible** - `custom_config` field allows future additions without migrations

### Customization Categories (Complete Inventory)

#### 1. Identity Customizations (Visible to Everyone)

| Feature            | Types Available            | Web Status     | Mobile Status   | Others Can See |
| ------------------ | -------------------------- | -------------- | --------------- | -------------- |
| **Avatar Borders** | 110+ (27 themes)           | ✅ Implemented | ⚠️ Partial      | ✅ Yes         |
| **Profile Themes** | 18+ (6 categories)         | ✅ Implemented | ⚠️ Types only   | ✅ Yes         |
| **Badges**         | Dynamic (achievements)     | ✅ Implemented | ⚠️ Display only | ✅ Yes         |
| **Titles**         | Tier-based                 | ⚠️ Partial     | ❌ Missing      | ✅ Yes         |
| **Profile Layout** | classic, compact, expanded | ⚠️ Partial     | ❌ Missing      | ✅ Yes         |

#### 2. Chat Customizations (Visible in Conversations)

| Feature                | Options                       | Web Status     | Mobile Status | Others Can See |
| ---------------------- | ----------------------------- | -------------- | ------------- | -------------- |
| **Bubble Style**       | default, glass, minimal, bold | ✅ Implemented | ⚠️ Partial    | ✅ Yes         |
| **Bubble Color**       | Hex color                     | ✅ Implemented | ❌ Missing    | ✅ Yes         |
| **Bubble Opacity**     | 0-100%                        | ✅ Implemented | ❌ Missing    | ✅ Yes         |
| **Bubble Radius**      | 0-32px                        | ✅ Implemented | ❌ Missing    | ✅ Yes         |
| **Text Size**          | 12-20px                       | ✅ Implemented | ❌ Missing    | ⚠️ Sender only |
| **Font Family**        | Inter, system fonts           | ✅ Implemented | ❌ Missing    | ⚠️ Sender only |
| **Message Effects**    | none, sparkle, glow, fire     | ✅ Implemented | ❌ Missing    | ✅ Yes         |
| **Entrance Animation** | fade, slide, bounce, pop      | ✅ Implemented | ❌ Missing    | ✅ Yes         |

#### 3. Theme Customizations (User's View Only)

| Feature         | Options             | Web Status     | Mobile Status  | Synced |
| --------------- | ------------------- | -------------- | -------------- | ------ |
| **App Theme**   | dark, light, system | ✅ Implemented | ✅ Implemented | ✅ Yes |
| **Chat Theme**  | 10+ presets         | ✅ Implemented | ⚠️ Partial     | ✅ Yes |
| **Forum Theme** | default, compact    | ⚠️ Partial     | ❌ Missing     | ✅ Yes |

#### 4. Effects & Animations (Performance-Aware)

| Feature                | Options                   | Web Status     | Mobile Status  | Device Tier Adaptive |
| ---------------------- | ------------------------- | -------------- | -------------- | -------------------- |
| **Particle Effects**   | none, sparkle, snow, rain | ✅ Implemented | ⚠️ Partial     | ✅ Yes               |
| **Background Effects** | solid, gradient, animated | ✅ Implemented | ⚠️ Partial     | ✅ Yes               |
| **Animation Speed**    | slow, normal, fast        | ✅ Implemented | ✅ Implemented | ✅ Yes               |
| **Glass Effect**       | default, blur, frosted    | ✅ Implemented | ❌ Missing     | ✅ Yes               |

### Backend Schema (Already Implemented)

```elixir
# lib/cgraph/customizations/user_customization.ex - COMPLETE
schema "user_customizations" do
  # Identity (visible to others)
  field :avatar_border_id, :string
  field :title_id, :string
  field :equipped_badges, {:array, :string}, default: []
  field :profile_layout, :string, default: "classic"
  field :profile_theme, :string, default: "classic-purple"

  # Chat Styling (visible in conversations)
  field :bubble_style, :string, default: "default"
  field :bubble_color, :string      # Hex color
  field :bubble_opacity, :integer   # 0-100
  field :bubble_radius, :integer    # 0-32
  field :message_effect, :string
  field :entrance_animation, :string

  # Extensibility (future-proof)
  field :custom_config, :map, default: %{}  # Max 50KB

  timestamps()
end
```

### API Endpoints (Already Implemented)

| Endpoint                           | Method | Purpose                                  |
| ---------------------------------- | ------ | ---------------------------------------- |
| `/api/v1/customizations`           | GET    | Get current user's customizations        |
| `/api/v1/customizations`           | PUT    | Update customizations                    |
| `/api/v1/users/:id/customizations` | GET    | Get another user's PUBLIC customizations |
| `/api/v1/cosmetics/borders`        | GET    | List available avatar borders            |
| `/api/v1/cosmetics/themes`         | GET    | List available profile themes            |

### Implementation Tasks (Web)

```bash
# ✅ DONE - Web customization stores
apps/web/src/stores/customization/customizationStore.ts
apps/web/src/stores/avatarBorderStore.ts
apps/web/src/stores/profileThemeStore.ts
apps/web/src/stores/themeStore.ts

# ✅ DONE - Web customization UI
apps/web/src/pages/customize/Customize.tsx
apps/web/src/pages/customize/IdentityCustomization.tsx
apps/web/src/pages/customize/ChatCustomization.tsx
apps/web/src/pages/customize/ThemeCustomization.tsx
apps/web/src/pages/customize/EffectsCustomization.tsx

# ⚠️ TODO - Apply customizations to other users' content
apps/web/src/modules/chat/components/MessageBubble.tsx  # Show sender's bubble style
apps/web/src/modules/social/components/UserProfileCard.tsx  # Show user's theme
```

### Implementation Tasks (Mobile - HIGH PRIORITY)

```bash
# ✅ DONE - Mobile customization store
apps/mobile/src/stores/customizationStore.ts

# ⚠️ PARTIAL - Need full UI screens
apps/mobile/src/screens/settings/UICustomizationScreen.tsx

# ❌ TODO - Mobile customization screens (MUST CREATE)
apps/mobile/src/screens/customize/
├── CustomizeScreen.tsx           # Main customization hub
├── IdentityCustomization.tsx     # Avatar borders, badges, titles
├── ChatCustomization.tsx         # Bubble styles, colors, effects
├── ThemeCustomization.tsx        # App theme, chat theme
└── EffectsCustomization.tsx      # Particles, animations

# ❌ TODO - Apply customizations in mobile views
apps/mobile/src/components/chat/MessageBubble.tsx  # Render sender's bubble style
apps/mobile/src/components/profile/ProfileCard.tsx  # Render user's theme
```

### Visibility Rules (Industry Standard)

```typescript
// When rendering ANY user's content, fetch their customizations
interface UserCustomizationPublic {
  // Visible to everyone
  avatarBorderId: string;
  profileTheme: string;
  equippedBadges: string[];
  titleId: string;

  // Visible in chat
  bubbleStyle: string;
  bubbleColor: string;
  messageEffect: string;
  entranceAnimation: string;
}

// Example: Rendering a message from another user
const MessageBubble = ({ message, sender }: Props) => {
  // Fetch sender's customizations (cached)
  const senderCustom = useSenderCustomizations(sender.id);

  return (
    <div
      style={{
        backgroundColor: senderCustom.bubbleColor,
        borderRadius: `${senderCustom.bubbleRadius}px`,
        opacity: senderCustom.bubbleOpacity / 100,
      }}
      className={`bubble-${senderCustom.bubbleStyle}`}
    >
      {message.content}
    </div>
  );
};
```

### Extensibility Pattern (Future-Proof)

```typescript
// custom_config field allows adding features without migrations
interface CustomConfig {
  // Future features go here
  voiceVisualizerTheme?: string;
  soundEffects?: {
    messageSend?: string;
    messageReceive?: string;
  };
  seasonalOverrides?: {
    christmas?: boolean;
    halloween?: boolean;
  };
  // Experimental features
  experimental?: Record<string, unknown>;
}

// Backend validates size (max 50KB) and structure
// New features can be added without database migrations
```

### Customization Sync Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Web App   │    │   Backend   │    │ Mobile App  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │  PUT /customizations               │
       │─────────────────>│                 │
       │                  │                 │
       │                  │ WebSocket broadcast
       │                  │ "customization:updated"
       │                  │─────────────────>
       │                  │                 │
       │<─────────────────│<────────────────│
       │     GET updated customizations     │
       │                  │                 │
       └──────────────────┴─────────────────┘

All clients receive real-time updates when a user changes their look.
```

### Avatar Border Themes (110+ Borders)

| Theme     | Count | Unlock Method  | Examples                                      |
| --------- | ----- | -------------- | --------------------------------------------- |
| Free      | 4     | Default        | none, static, simple-glow, gentle-pulse       |
| Starter   | 8     | Subscription   | rotating-ring, dual-ring, gradient-wave       |
| Pro       | 12    | Subscription   | fire-inferno, ice-frost, cherry-blossom       |
| Legendary | 8     | Achievements   | phoenix-rising, dragon-scale, void-portal     |
| Mythic    | 8     | Top 100/Events | reality-warp, celestial-crown, transcendent   |
| 8-Bit     | 8     | Level/Purchase | 8bit-pixels, 8bit-powerup, 8bit-rainbow       |
| Japanese  | 10    | Level/Purchase | sakura-petals, koi-fish, samurai-blade        |
| Chinese   | 10    | Level/Purchase | dragon-dance, lotus-bloom, jade-ring          |
| Anime     | 10    | Level/Purchase | manga-speed-lines, power-aura, magical-circle |
| Cyberpunk | 10    | Level/Purchase | cyber-circuit, hologram-glitch, matrix-code   |
| Gothic    | 10    | Level/Purchase | blood-moon, bat-swarm, vampire-bite           |
| Kawaii    | 10    | Level/Purchase | pastel-hearts, candy-swirl, unicorn-magic     |

### Profile Theme Categories (18+ Themes)

| Category  | Free           | Premium      | Elite         | Unlock                   |
| --------- | -------------- | ------------ | ------------- | ------------------------ |
| 8-Bit     | Arcade Classic | Neon Nights  | Pixel Dreams  | Level 15/50 achievements |
| Japanese  | Zen Garden     | Sakura Bloom | Great Wave    | Level 20                 |
| Anime     | Power Up       | Mystic Arts  | Ultimate Hero | Level 25                 |
| Cyberpunk | Night City     | The Matrix   | Neural Pulse  | Level 20                 |
| Gothic    | Shadow Realm   | Blood Moon   | Abyssal Void  | Level 20                 |
| Kawaii    | Pastel Dream   | Candy Pop    | Rainbow Magic | Level 15                 |

### Code Quality Standards for Customization

```typescript
// ✅ REQUIRED: All customization components must follow these patterns

// 1. Use shared types from packages
import type {
  AvatarBorderConfig,
  ProfileThemeConfig,
  ChatCustomization,
} from '@cgraph/shared-types';

// 2. Fetch user customizations with caching
const useSenderCustomizations = (userId: string) => {
  return useQuery({
    queryKey: ['customizations', userId],
    queryFn: () => api.getUserCustomizations(userId),
    staleTime: 5 * 60 * 1000, // Cache 5 min (slow-changing)
    gcTime: 30 * 60 * 1000, // Keep in memory 30 min
  });
};

// 3. Apply customizations with fallbacks
const applyBubbleStyle = (custom: ChatCustomization | null) => ({
  backgroundColor: custom?.bubbleColor ?? 'var(--bubble-default)',
  borderRadius: `${custom?.bubbleRadius ?? 16}px`,
  opacity: (custom?.bubbleOpacity ?? 100) / 100,
});

// 4. Respect device performance tier
const useOptimizedEffects = () => {
  const deviceTier = useDeviceTier(); // 'high' | 'mid' | 'low'
  const effects = useEffects();

  if (deviceTier === 'low') {
    return { ...effects, particles: 'none', animations: 'minimal' };
  }
  return effects;
};
```

### Testing Requirements

```typescript
// Every customization feature needs:
// 1. Unit tests for store actions
// 2. Integration tests for API sync
// 3. Visual regression tests for themes
// 4. Cross-platform parity tests

describe('ChatBubbleCustomization', () => {
  it('applies sender bubble color to messages', () => {
    const sender = { id: '123', customizations: { bubbleColor: '#FF5733' } };
    render(<MessageBubble message={msg} sender={sender} />);
    expect(screen.getByTestId('bubble')).toHaveStyle({ backgroundColor: '#FF5733' });
  });

  it('falls back to default when customization is null', () => {
    render(<MessageBubble message={msg} sender={{ id: '123' }} />);
    expect(screen.getByTestId('bubble')).toHaveStyle({ backgroundColor: 'var(--bubble-default)' });
  });

  it('syncs customizations across web and mobile', async () => {
    // Update on web
    await webApi.updateCustomizations({ bubbleColor: '#00FF00' });
    // Verify mobile receives update
    await waitFor(() => {
      expect(mobileStore.getState().theme.bubbleColor).toBe('#00FF00');
    });
  });
});
```

---

## 📱 PLATFORM PARITY: WEB ↔ MOBILE (CGraph Standard)

### Philosophy: One Product, Two Platforms

**Every feature on web MUST exist on mobile. Every feature on mobile MUST exist on web.**

This is how CGraph and CGraph work. Users expect identical functionality regardless of device.

### Complete Page/Screen Parity Matrix

#### Auth & Onboarding (100% Parity Required)

| Feature         | Web Page                | Mobile Screen                 | Sync Status |
| --------------- | ----------------------- | ----------------------------- | ----------- |
| Login           | ✅ `Login.tsx`          | ✅ `LoginScreen.tsx`          | ✅ Synced   |
| Register        | ✅ `Register.tsx`       | ✅ `RegisterScreen.tsx`       | ✅ Synced   |
| Forgot Password | ✅ `ForgotPassword.tsx` | ✅ `ForgotPasswordScreen.tsx` | ✅ Synced   |
| Reset Password  | ✅ `ResetPassword.tsx`  | ✅ `ResetPasswordScreen.tsx`  | ✅ Synced   |
| Verify Email    | ✅ `VerifyEmail.tsx`    | ✅ `VerifyEmailScreen.tsx`    | ✅ Synced   |
| Onboarding      | ✅ `Onboarding.tsx`     | ✅ `OnboardingScreen.tsx`     | ✅ Synced   |
| OAuth Callback  | ✅ `OAuthCallback.tsx`  | ⚠️ Deep link handler          | ⚠️ Partial  |

#### Messaging (100% Parity Required)

| Feature               | Web Page                      | Mobile Screen                   | Sync Status   |
| --------------------- | ----------------------------- | ------------------------------- | ------------- |
| Conversation List     | ✅ `Messages.tsx`             | ✅ `ConversationListScreen.tsx` | ✅ Synced     |
| Conversation          | ✅ `Conversation.tsx`         | ✅ `ConversationScreen.tsx`     | ⚠️ Partial    |
| Enhanced Conversation | ✅ `EnhancedConversation.tsx` | ❌ Missing                      | ❌ Not synced |
| New Conversation      | ⚠️ Modal                      | ✅ `NewConversationScreen.tsx`  | ⚠️ Partial    |
| Message Search        | ✅ Component                  | ⚠️ Partial                      | ⚠️ Partial    |
| Typing Indicators     | ✅ Yes                        | ✅ Yes                          | ✅ Synced     |
| Read Receipts         | ✅ Yes                        | ⚠️ Partial                      | ⚠️ Partial    |
| Reactions             | ✅ Yes                        | ⚠️ Partial                      | ⚠️ Partial    |
| Reply/Quote           | ✅ Yes                        | ⚠️ Partial                      | ⚠️ Partial    |
| Edit/Delete           | ✅ Yes                        | ⚠️ Partial                      | ⚠️ Partial    |

#### Forums (100% Parity Required)

| Feature            | Web Page                   | Mobile Screen                    | Sync Status   |
| ------------------ | -------------------------- | -------------------------------- | ------------- |
| Forum List         | ✅ `Forums.tsx`            | ✅ `ForumListScreen.tsx`         | ✅ Synced     |
| Forum View         | ✅ `ForumBoardView.tsx`    | ✅ `ForumBoardScreen.tsx`        | ⚠️ Partial    |
| Post View          | ✅ `ForumPost.tsx`         | ✅ `PostScreen.tsx`              | ⚠️ Partial    |
| Create Forum       | ✅ `CreateForum.tsx`       | ✅ `CreateForumScreen.tsx`       | ⚠️ Partial    |
| Create Post        | ✅ `CreatePost.tsx`        | ✅ `CreatePostScreen.tsx`        | ⚠️ Partial    |
| Forum Admin        | ✅ `ForumAdmin.tsx`        | ✅ `ForumAdminScreen.tsx`        | ⚠️ Partial    |
| Forum Settings     | ✅ `ForumSettings.tsx`     | ✅ `ForumSettingsScreen.tsx`     | ⚠️ Partial    |
| Forum Leaderboard  | ✅ `ForumLeaderboard.tsx`  | ✅ `ForumLeaderboardScreen.tsx`  | ⚠️ Partial    |
| Moderation Queue   | ✅ `ModerationQueue.tsx`   | ❌ Missing                       | ❌ Not synced |
| Plugin Marketplace | ✅ `PluginMarketplace.tsx` | ✅ `PluginMarketplaceScreen.tsx` | ⚠️ Partial    |
| Subscriptions      | ⚠️ Component               | ✅ `SubscriptionsScreen.tsx`     | ⚠️ Partial    |

#### Groups/Servers (100% Parity Required)

| Feature        | Web Page              | Mobile Screen                | Sync Status |
| -------------- | --------------------- | ---------------------------- | ----------- |
| Group List     | ✅ `Groups.tsx`       | ✅ `GroupListScreen.tsx`     | ⚠️ Partial  |
| Group View     | ✅ `Groups.tsx`       | ✅ `GroupScreen.tsx`         | ⚠️ Partial  |
| Channel View   | ✅ `GroupChannel.tsx` | ✅ `ChannelScreen.tsx`       | ⚠️ Partial  |
| Group Settings | ⚠️ Component          | ✅ `GroupSettingsScreen.tsx` | ⚠️ Partial  |

#### Customization (100% Parity Required - HIGH PRIORITY)

| Feature                   | Web Page                          | Mobile Screen                     | Sync Status   |
| ------------------------- | --------------------------------- | --------------------------------- | ------------- |
| Customize Hub             | ✅ `Customize.tsx`                | ❌ Missing                        | ❌ **CREATE** |
| Identity Customization    | ✅ `IdentityCustomization.tsx`    | ❌ Missing                        | ❌ **CREATE** |
| Chat Customization        | ✅ `ChatCustomization.tsx`        | ✅ `ChatBubbleSettingsScreen.tsx` | ⚠️ Partial    |
| Theme Customization       | ✅ `ThemeCustomization.tsx`       | ⚠️ `AppearanceScreen.tsx`         | ⚠️ Partial    |
| Effects Customization     | ✅ `EffectsCustomization.tsx`     | ❌ Missing                        | ❌ **CREATE** |
| Progression Customization | ✅ `ProgressionCustomization.tsx` | ❌ Missing                        | ❌ **CREATE** |
| Avatar Settings           | ⚠️ Component                      | ✅ `AvatarSettingsScreen.tsx`     | ⚠️ Partial    |
| UI Customization          | ⚠️ Component                      | ✅ `UICustomizationScreen.tsx`    | ⚠️ Partial    |

#### Gamification (100% Parity Required)

| Feature          | Web Page                     | Mobile Screen                  | Sync Status |
| ---------------- | ---------------------------- | ------------------------------ | ----------- |
| Gamification Hub | ✅ `GamificationHubPage.tsx` | ✅ `GamificationHubScreen.tsx` | ⚠️ Partial  |
| Achievements     | ✅ `AchievementsPage.tsx`    | ✅ `AchievementsScreen.tsx`    | ⚠️ Partial  |
| Quests           | ✅ `QuestsPage.tsx`          | ✅ `QuestsScreen.tsx`          | ⚠️ Partial  |
| Titles           | ✅ `TitlesPage.tsx`          | ✅ `TitlesScreen.tsx`          | ⚠️ Partial  |
| Leaderboard      | ✅ `LeaderboardPage.tsx`     | ✅ `LeaderboardScreen.tsx`     | ⚠️ Partial  |

#### Premium & Shop (100% Parity Required)

| Feature      | Web Page             | Mobile Screen           | Sync Status |
| ------------ | -------------------- | ----------------------- | ----------- |
| Premium Page | ✅ `PremiumPage.tsx` | ✅ `PremiumScreen.tsx`  | ⚠️ Partial  |
| Coin Shop    | ✅ `CoinShop.tsx`    | ✅ `CoinShopScreen.tsx` | ⚠️ Partial  |

#### Calls (100% Parity Required)

| Feature      | Web Page            | Mobile Screen              | Sync Status          |
| ------------ | ------------------- | -------------------------- | -------------------- |
| Call Screen  | ✅ `CallScreen.tsx` | ✅ `CallScreen.tsx`        | ⚠️ Partial           |
| Voice Call   | ⚠️ Component        | ✅ `VoiceCallScreen.tsx`   | ⚠️ Partial           |
| Video Call   | ⚠️ Component        | ✅ `VideoCallScreen.tsx`   | ⚠️ Partial           |
| Call History | ❌ Missing          | ✅ `CallHistoryScreen.tsx` | ❌ **CREATE on web** |

#### Friends & Social (100% Parity Required)

| Feature         | Web Page             | Mobile Screen                 | Sync Status   |
| --------------- | -------------------- | ----------------------------- | ------------- |
| Friends List    | ✅ `Friends.tsx`     | ✅ `FriendListScreen.tsx`     | ⚠️ Partial    |
| Add Friend      | ⚠️ Component         | ✅ `AddFriendScreen.tsx`      | ⚠️ Partial    |
| Friend Requests | ⚠️ Component         | ✅ `FriendRequestsScreen.tsx` | ⚠️ Partial    |
| User Profile    | ✅ `UserProfile.tsx` | ✅ `UserProfileScreen.tsx`    | ⚠️ Partial    |
| User Wall       | ⚠️ Component         | ✅ `UserWallScreen.tsx`       | ⚠️ Partial    |
| Social Hub      | ✅ `Social.tsx`      | ❌ Missing                    | ❌ **CREATE** |

#### Settings (100% Parity Required)

| Feature             | Web Page                           | Mobile Screen                    | Sync Status          |
| ------------------- | ---------------------------------- | -------------------------------- | -------------------- |
| Settings Hub        | ✅ `Settings.tsx`                  | ✅ `SettingsScreen.tsx`          | ⚠️ Partial           |
| Account             | ⚠️ Component                       | ✅ `AccountScreen.tsx`           | ⚠️ Partial           |
| Profile             | ⚠️ Component                       | ✅ `ProfileScreen.tsx`           | ⚠️ Partial           |
| Privacy             | ⚠️ Component                       | ✅ `PrivacyScreen.tsx`           | ⚠️ Partial           |
| Notifications       | ⚠️ Component                       | ✅ `NotificationsScreen.tsx`     | ⚠️ Partial           |
| Appearance/Theme    | ✅ `AppThemeSettings.tsx`          | ✅ `AppearanceScreen.tsx`        | ⚠️ Partial           |
| Blocked Users       | ✅ `BlockedUsers.tsx`              | ✅ `BlockedUsersScreen.tsx`      | ⚠️ Partial           |
| Two-Factor Auth     | ✅ `TwoFactorSetup.tsx`            | ✅ `TwoFactorSetupScreen.tsx`    | ⚠️ Partial           |
| Badge Selection     | ✅ `BadgeSelection.tsx`            | ❌ Missing                       | ❌ **CREATE**        |
| Title Selection     | ✅ `TitleSelection.tsx`            | ❌ Missing                       | ❌ **CREATE**        |
| Email Notifications | ✅ `EmailNotificationSettings.tsx` | ❌ Missing                       | ❌ **CREATE**        |
| Profile Visibility  | ⚠️ Component                       | ✅ `ProfileVisibilityScreen.tsx` | ⚠️ Partial           |
| Custom Emoji        | ❌ Missing                         | ✅ `CustomEmojiScreen.tsx`       | ❌ **CREATE on web** |
| RSS Feeds           | ❌ Missing                         | ✅ `RSSFeedsScreen.tsx`          | ❌ **CREATE on web** |

#### Admin (100% Parity Required)

| Feature         | Web Page                | Mobile Screen                 | Sync Status   |
| --------------- | ----------------------- | ----------------------------- | ------------- |
| Admin Dashboard | ✅ `AdminDashboard.tsx` | ✅ `AdminDashboardScreen.tsx` | ⚠️ Partial    |
| Users Tab       | ✅ `UsersTab.tsx`       | ❌ Missing                    | ❌ **CREATE** |
| Reports Tab     | ✅ `ReportsTab.tsx`     | ❌ Missing                    | ❌ **CREATE** |
| Audit Tab       | ✅ `AuditTab.tsx`       | ❌ Missing                    | ❌ **CREATE** |
| Settings Tab    | ✅ `SettingsTab.tsx`    | ❌ Missing                    | ❌ **CREATE** |
| Forum Reorder   | ⚠️ Component            | ✅ `ForumReorderScreen.tsx`   | ⚠️ Partial    |

#### Other Features

| Feature           | Web Page               | Mobile Screen                     | Sync Status          |
| ----------------- | ---------------------- | --------------------------------- | -------------------- |
| Search            | ✅ `Search.tsx`        | ✅ `SearchScreen.tsx`             | ⚠️ Partial           |
| Notifications     | ✅ `Notifications.tsx` | ✅ `NotificationsInboxScreen.tsx` | ⚠️ Partial           |
| Referrals         | ✅ `ReferralPage.tsx`  | ✅ `ReferralScreen.tsx`           | ⚠️ Partial           |
| Member List       | ✅ `MemberList.tsx`    | ✅ `MemberListScreen.tsx`         | ⚠️ Partial           |
| Who's Online      | ✅ `WhosOnline.tsx`    | ✅ `WhosOnlineScreen.tsx`         | ⚠️ Partial           |
| Calendar          | ✅ `CalendarPage.tsx`  | ✅ `CalendarScreen.tsx`           | ⚠️ Partial           |
| E2EE Verification | ❌ Missing             | ✅ `E2EEVerificationScreen.tsx`   | ❌ **CREATE on web** |
| Key Verification  | ❌ Missing             | ✅ `KeyVerificationScreen.tsx`    | ❌ **CREATE on web** |
| Export Content    | ❌ Missing             | ✅ `ExportContentScreen.tsx`      | ❌ **CREATE on web** |
| Report            | ⚠️ Component           | ✅ `ReportScreen.tsx`             | ⚠️ Partial           |
| Username Change   | ⚠️ Component           | ✅ `UsernameChangeScreen.tsx`     | ⚠️ Partial           |

### Animation Parity (CRITICAL)

**Every animation on web MUST have an equivalent on mobile.**

#### Web Animation System (Framer Motion)

```typescript
// apps/web/src/lib/animations/
├── animationPresets.ts     // Standard animation configs
├── useAnimatedValue.ts     // Animated value hook
└── motion-variants.ts      // Reusable variants

// Example: Message entrance animation
const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};
```

#### Mobile Animation System (Reanimated v4)

```typescript
// apps/mobile/src/lib/animations/
├── AnimationLibrary.ts     // Standard animation configs
├── AnimatedComponents.tsx  // Animated wrapper components
└── springConfigs.ts        // Spring presets

// Example: Message entrance animation (MUST match web)
const messageEnter = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 20 }] },
    animations: { opacity: withTiming(1), transform: [{ translateY: withTiming(0) }] }
  };
};
```

#### Animation Sync Requirements

| Animation               | Web (Framer Motion) | Mobile (Reanimated) | Sync Status        |
| ----------------------- | ------------------- | ------------------- | ------------------ |
| Message Enter           | ✅ fade + slide up  | ⚠️ Partial          | ⚠️ **SYNC**        |
| Message Exit            | ✅ fade out         | ⚠️ Partial          | ⚠️ **SYNC**        |
| Typing Indicator        | ✅ bounce dots      | ⚠️ Partial          | ⚠️ **SYNC**        |
| Avatar Border Glow      | ✅ CSS animation    | ⚠️ Partial          | ⚠️ **SYNC**        |
| Profile Theme Particles | ✅ Canvas/CSS       | ⚠️ Partial          | ⚠️ **SYNC**        |
| Button Press            | ✅ scale down       | ✅ Yes              | ✅ Synced          |
| Page Transitions        | ✅ fade/slide       | ⚠️ Partial          | ⚠️ **SYNC**        |
| Pull to Refresh         | N/A                 | ✅ Yes              | ✅ Mobile only     |
| Swipe Actions           | ⚠️ Partial          | ✅ Yes              | ⚠️ **SYNC**        |
| Modal Enter/Exit        | ✅ Yes              | ✅ Yes              | ⚠️ **SYNC timing** |
| Toast Notifications     | ✅ slide + fade     | ⚠️ Partial          | ⚠️ **SYNC**        |
| Skeleton Loading        | ✅ shimmer          | ⚠️ Partial          | ⚠️ **SYNC**        |
| Reaction Pop            | ✅ scale + bounce   | ⚠️ Partial          | ⚠️ **SYNC**        |

#### Shared Animation Config (packages/animations)

```typescript
// packages/animations/src/presets.ts
// SHARED between web and mobile

export const ANIMATION_PRESETS = {
  messageEnter: {
    duration: 200,
    easing: 'easeOut',
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
  },
  messageExit: {
    duration: 150,
    easing: 'easeIn',
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.95 },
  },
  buttonPress: {
    duration: 100,
    scale: 0.97,
  },
  modalEnter: {
    duration: 250,
    easing: 'spring',
    springConfig: { damping: 25, stiffness: 300 },
  },
} as const;

// Web adapter
export const toFramerMotion = (preset: AnimationPreset) => ({
  initial: preset.from,
  animate: preset.to,
  transition: { duration: preset.duration / 1000, ease: preset.easing },
});

// Mobile adapter
export const toReanimated = (preset: AnimationPreset) => ({
  initialValues: preset.from,
  animations: Object.fromEntries(
    Object.entries(preset.to).map(([k, v]) => [k, withTiming(v, { duration: preset.duration })])
  ),
});
```

### Real-Time Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REAL-TIME SYNC SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                                    ┌─────────────┐        │
│   │   Web App   │◄──────────────┬──────────────────►│ Mobile App  │        │
│   └──────┬──────┘               │                   └──────┬──────┘        │
│          │                      │                          │               │
│          │ Phoenix Channel      │ Phoenix Channel          │               │
│          │                      │                          │               │
│          ▼                      │                          ▼               │
│   ┌──────────────────────────────────────────────────────────────┐        │
│   │                     PHOENIX CHANNELS                          │        │
│   │  user:{userId}          - Personal notifications, presence    │        │
│   │  conversation:{convId}  - Messages, typing, read receipts     │        │
│   │  group:{groupId}        - Group events, member changes        │        │
│   │  forum:{forumId}        - Posts, comments, votes              │        │
│   │  presence:{scope}       - Online status, last seen            │        │
│   │  customization:{userId} - Theme/style changes (others see)    │        │
│   └──────────────────────────────────────────────────────────────┘        │
│                                  │                                         │
│                                  ▼                                         │
│   ┌──────────────────────────────────────────────────────────────┐        │
│   │                       BACKEND                                 │        │
│   │  • Broadcasts events to ALL connected clients                 │        │
│   │  • Stores state in PostgreSQL                                 │        │
│   │  • Caches hot data in Redis                                   │        │
│   │  • Every state change = broadcast to relevant channels        │        │
│   └──────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sync Events (All Platforms Must Handle)

```typescript
// packages/socket/src/events.ts
// EVERY event must be handled identically on web and mobile

export const SYNC_EVENTS = {
  // Messages
  'message:created': { messageId, conversationId, senderId },
  'message:updated': { messageId, content, editedAt },
  'message:deleted': { messageId, conversationId },
  'message:reaction': { messageId, userId, emoji, action },

  // Typing & Presence
  'typing:start': { conversationId, userId },
  'typing:stop': { conversationId, userId },
  'presence:update': { userId, status, lastSeen },

  // Customization (CRITICAL - others see your changes)
  'customization:updated': { userId, changes },
  'avatar_border:changed': { userId, borderId },
  'profile_theme:changed': { userId, themeId },
  'bubble_style:changed': { userId, style },

  // Forums
  'post:created': { postId, forumId, authorId },
  'post:voted': { postId, userId, direction },
  'comment:created': { commentId, postId, authorId },

  // Groups
  'member:joined': { groupId, userId },
  'member:left': { groupId, userId },
  'channel:message': { channelId, messageId },

  // Gamification
  'achievement:unlocked': { userId, achievementId },
  'level:up': { userId, newLevel },
  'xp:gained': { userId, amount, source },

  // Notifications
  'notification:new': { notificationId, type, data },
} as const;
```

### Shared State Management

```typescript
// packages/state/src/stores/
// Zustand stores that work on BOTH platforms

// Base store interface (shared)
interface MessageStore {
  messages: Map<string, Message>;
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
}

// Implementation (shared logic)
export const createMessageStore = () =>
  create<MessageStore>((set) => ({
    messages: new Map(),
    addMessage: (msg) => set((s) => ({ messages: new Map(s.messages).set(msg.id, msg) })),
    updateMessage: (id, updates) =>
      set((s) => {
        const map = new Map(s.messages);
        const existing = map.get(id);
        if (existing) map.set(id, { ...existing, ...updates });
        return { messages: map };
      }),
    deleteMessage: (id) =>
      set((s) => {
        const map = new Map(s.messages);
        map.delete(id);
        return { messages: map };
      }),
  }));

// Web uses: import { useMessageStore } from '@cgraph/state';
// Mobile uses: import { useMessageStore } from '@cgraph/state';
// IDENTICAL API, IDENTICAL BEHAVIOR
```

### Implementation Priority (Platform Parity)

#### Phase 1: Critical Missing Screens (Week 1-2)

**Mobile screens to CREATE:**

```bash
apps/mobile/src/screens/customize/
├── CustomizeScreen.tsx           # Hub for all customization
├── IdentityCustomization.tsx     # Avatar borders, badges, titles
├── EffectsCustomization.tsx      # Particles, animations
└── ProgressionCustomization.tsx  # XP display, level frames

apps/mobile/src/screens/settings/
├── BadgeSelectionScreen.tsx      # Choose displayed badges
├── TitleSelectionScreen.tsx      # Choose title
└── EmailNotificationsScreen.tsx  # Email preferences

apps/mobile/src/screens/social/
└── SocialHubScreen.tsx           # Social features hub
```

**Web pages to CREATE:**

```bash
apps/web/src/pages/calls/
└── CallHistory.tsx               # Call history (exists on mobile)

apps/web/src/pages/settings/
├── CustomEmoji.tsx               # Custom emoji (exists on mobile)
└── RSSFeeds.tsx                  # RSS feeds (exists on mobile)

apps/web/src/pages/security/
├── E2EEVerification.tsx          # E2EE verification (exists on mobile)
└── KeyVerification.tsx           # Key verification (exists on mobile)

apps/web/src/pages/content/
└── ExportContent.tsx             # Export data (exists on mobile)
```

#### Phase 2: Animation Parity (Week 2-3)

1. Create `packages/animations/` with shared configs
2. Update web to use shared animation presets
3. Update mobile to use shared animation presets
4. Test that animations look identical

#### Phase 3: Full Feature Parity (Week 3-4)

1. Audit every ⚠️ Partial feature
2. Ensure identical functionality
3. Test on both platforms simultaneously
4. Fix any sync issues

### Testing Parity

```typescript
// Every feature needs cross-platform tests

describe('Message Sending (Parity Test)', () => {
  it('sends message identically on web and mobile', async () => {
    // Setup: Same user logged in on both platforms
    const webClient = createWebTestClient(userId);
    const mobileClient = createMobileTestClient(userId);

    // Action: Send from web
    await webClient.sendMessage(conversationId, 'Hello from web');

    // Verify: Appears on mobile in <1 second
    await mobileClient.waitForMessage(conversationId, 'Hello from web', 1000);

    // Action: Send from mobile
    await mobileClient.sendMessage(conversationId, 'Hello from mobile');

    // Verify: Appears on web in <1 second
    await webClient.waitForMessage(conversationId, 'Hello from mobile', 1000);
  });

  it('shows sender customizations identically', async () => {
    // Sender has custom bubble color
    await api.updateCustomizations(senderId, { bubbleColor: '#FF5733' });

    // Verify: Both platforms render the same color
    const webBubble = await webClient.getMessageBubbleStyle(messageId);
    const mobileBubble = await mobileClient.getMessageBubbleStyle(messageId);

    expect(webBubble.backgroundColor).toBe('#FF5733');
    expect(mobileBubble.backgroundColor).toBe('#FF5733');
  });
});
```

---

## 🎯 IMPLEMENTATION ROADMAP (BUILD, DON'T DELETE)

### Week 1-2: Connect Packages to Apps

**Goal:** Make all 9 packages functional and used by both web and mobile.

| Package              | Action                            | Connects To                 |
| -------------------- | --------------------------------- | --------------------------- |
| @cgraph/shared-types | Already used                      | ✅ Keep                     |
| @cgraph/utils        | Connect to mobile                 | apps/mobile/lib             |
| @cgraph/crypto       | **IMPLEMENT**: Make apps use it   | apps/web + mobile E2EE      |
| @cgraph/hooks        | **IMPLEMENT**: Export from shared | apps/web/shared/hooks       |
| @cgraph/socket       | **IMPLEMENT**: Phoenix channels   | apps/web + mobile sockets   |
| @cgraph/core         | **IMPLEMENT**: Business logic     | Forums, Auth, Chat services |
| @cgraph/state        | **IMPLEMENT**: Shared stores      | Both apps                   |
| @cgraph/config       | **IMPLEMENT**: Shared config      | Both apps                   |
| @cgraph/ui           | **IMPLEMENT**: Web components     | apps/web/shared             |

### Week 3-4: Complete Forum System

| Task                   | Web          | Mobile       | Backend      |
| ---------------------- | ------------ | ------------ | ------------ |
| Create forum flow      | ✅ Implement | ✅ Implement | ✅ Done      |
| Join via invite        | ✅ Implement | ✅ Implement | ✅ Implement |
| Invite link generation | ✅ Implement | ✅ Implement | ✅ Implement |
| Tier-based limits      | ✅ Implement | ✅ Implement | ✅ Implement |
| Forum settings         | ✅ Implement | ✅ Implement | ✅ Implement |
| Member management      | ✅ Implement | ✅ Implement | ✅ Implement |

### Week 5-6: Web-Mobile Feature Parity

| Feature            | Web Status | Mobile Status | Action                   |
| ------------------ | ---------- | ------------- | ------------------------ |
| Forum creation     | ✅         | ❌            | Implement mobile         |
| Thread creation    | ✅         | ⚠️ Partial    | Complete mobile          |
| Real-time updates  | ✅         | ⚠️ Partial    | Connect Phoenix channels |
| Push notifications | ❌         | ✅            | Implement web push       |
| E2EE messaging     | ✅         | ⚠️ Basic      | Complete mobile          |
| Voice calls        | ✅         | ❌            | Implement mobile         |
| Video calls        | ✅         | ❌            | Implement mobile         |

### Week 7-8: Scale & Performance

| Task                  | Description                      |
| --------------------- | -------------------------------- |
| Database optimization | Add indexes for forum queries    |
| Caching layer         | Redis caching for forum data     |
| CDN setup             | Images and static assets         |
| Load testing          | 10K concurrent users             |
| Mobile optimization   | Reduce bundle size, lazy loading |

---

## Current Issues (To Fix During Implementation)

### Large Files to Refactor (Not Delete)

| File                   | Current | Target | Method                   |
| ---------------------- | ------- | ------ | ------------------------ |
| ConversationScreen.tsx | 5,840   | 300    | Extract 15 components    |
| CustomizationDemo.tsx  | 3,510   | 300    | Extract 12 components    |
| ForumAdmin.tsx         | 1,768   | 300    | Extract 6 components     |
| socket.ts              | 1,560   | 300    | Extract channel handlers |

### Module Exports to Complete

```typescript
// Every module index.ts must export:
export * from './components';
export * from './hooks';
export * from './store';
export * from './types';
export * from './api';
```

### Store Organization (Merge, Don't Delete)

```
Current: 67 stores scattered
Target: 12 module stores + 7 facades

Action: Move stores into their modules, update facade imports
```

---

## Score Progression (Implementation Focus)

| Week    | Work                  | Points | Cumulative |
| ------- | --------------------- | ------ | ---------- |
| Current | Audit + Standards     | 4.8    | 4.8        |
| 1-2     | Connect all packages  | +1.5   | 6.3        |
| 3-4     | Forum system complete | +1.5   | 7.8        |
| 5-6     | Web-Mobile parity     | +1.2   | 9.0        |
| 7-8     | Scale + Performance   | +1.0   | **10.0**   |

---

## What Was Already Completed ✅

### Phase 0-1: Cleanup & Module Structure (February 1-2, 2026)

| Task                                                   | Status | Verified |
| ------------------------------------------------------ | ------ | -------- |
| Delete deprecated stores (customizationStore, pmStore) | ✅     | ✅       |
| Remove duplicate landing pages                         | ✅     | ✅       |
| Fix "migrateTo SecureStorage.ts" filename              | ✅     | ✅       |
| Consolidate mobile context/ → contexts/                | ✅     | ✅       |
| Refactor theme/index.ts (982 → 52 lines)               | ✅     | ✅       |
| Move archive/demo/test → **dev**/                      | ✅     | ✅       |
| Merge components/forum/ → forums/                      | ✅     | ✅       |
| Create 12 module directories                           | ✅     | ✅       |
| Create shared/ directory structure                     | ✅     | ✅       |

### Phase 2: Module Population (February 2, 2026)

| Module       | Components | Hooks | Store    | Status                |
| ------------ | ---------- | ----- | -------- | --------------------- |
| chat         | 29         | 7     | ✅       | ✅ Complete           |
| forums       | 26         | 2     | ✅       | ✅ Complete           |
| gamification | 10         | 1     | ✅       | ⚠️ Exports incomplete |
| settings     | 10         | 1     | ✅       | ⚠️ Exports incomplete |
| auth         | 7          | 3     | ✅       | ⚠️ Exports incomplete |
| groups       | 6          | 0     | ✅       | ⚠️ Exports incomplete |
| social       | 5          | 2     | ✅       | ⚠️ Exports incomplete |
| premium      | 5          | 1     | ✅       | ⚠️ Exports incomplete |
| calls        | 4          | 2     | ✅       | ⚠️ Exports incomplete |
| admin        | 3          | 0     | ❌ Empty | ❌ Store empty        |
| moderation   | 2          | 0     | ✅       | ⚠️ Exports incomplete |
| search       | 1          | 0     | ✅       | ⚠️ Exports incomplete |

**Total: 117 components, 28 hooks migrated to modules**

### Phase 6: Backend Splitting (Partial)

| Module      | Original | Extracted | Remaining | Progress |
| ----------- | -------- | --------- | --------- | -------- |
| forums.ex   | 3,379    | 1,591     | 1,788     | 53%      |
| accounts.ex | 1,864    | 668       | 1,196     | 36%      |

Created submodules:

- `forums/core.ex`, `forums/threads.ex`, `forums/voting.ex`, `forums/moderation.ex`
- `accounts/users.ex`, `accounts/authentication.ex`, `accounts/registration.ex`,
  `accounts/sessions.ex`

---

## Comparison: CGraph vs Industry Giants

### Current Advantages (What CGraph Does Better)

| Feature             | CGraph                               | CGraph    | CGraph         | CGraph    |
| ------------------- | ------------------------------------ | --------- | -------------- | --------- |
| E2EE Protocol       | Signal ✅                            | None ❌   | MTProto ⚠️     | Signal ✅ |
| User-owned forums   | ✅ Yes                               | ❌ No     | ⚠️ Groups only | ❌ No     |
| Forum invite system | ✅ Planned                           | ✅ Yes    | ⚠️ Basic       | ❌ No     |
| Gamification        | ✅ XP/Karma                          | ❌ No     | ❌ No          | ❌ No     |
| Subscription tiers  | ✅ 3 tiers (free/premium/enterprise) | ✅ Nitro  | ✅ Premium     | ❌ No     |
| Open architecture   | ✅ Yes                               | ❌ Closed | ❌ Closed      | ❌ Closed |

### Areas to Improve (In Progress)

| Metric           | CGraph | CGraph Now     | CGraph Target | Action           |
| ---------------- | ------ | -------------- | ------------- | ---------------- |
| Component size   | 300    | 5,840          | 300           | Refactor         |
| Platform parity  | 40%    | <1%            | 70%           | Connect packages |
| Test coverage    | 80%    | 8.5%           | 80%           | Add tests        |
| Module isolation | Clean  | 30+ violations | Clean         | Use shared       |

---

## Previous Gap Analysis (Reference Only)

---

## Execution Log

### ✅ Phase 0 - COMPLETED (February 1, 2026)

| Task                               | Status  | Details                                                                |
| ---------------------------------- | ------- | ---------------------------------------------------------------------- |
| 0.1 Delete deprecated stores       | ✅ DONE | Deleted customizationStore.ts, customizationStoreV2.ts, pmStore.ts     |
| 0.2 Remove duplicate landing pages | ✅ DONE | Deleted LandingPageEnhanced, LandingPageOptimized, LandingPageUltimate |
| 0.3 Fix filename issues            | ✅ DONE | Renamed "migrateTo SecureStorage.ts" → "migrateToSecureStorage.ts"     |
| 0.4 Consolidate mobile contexts    | ✅ DONE | Merged context/ → contexts/, kept comprehensive test                   |
| 0.5 Fix index files with impl code | ✅ DONE | theme/index.ts (982→50 lines), customization/index.ts (675→90 lines)   |
| 0.9 Clean up pages folder          | ✅ DONE | Moved archive/, demo/, test/ → **dev**/ directory                      |
| 0.10 Fix duplicate component dirs  | ✅ DONE | Merged components/forum/ → components/forums/                          |
| 0.7 Organize test files            | ✅ DONE | Moved **tests**/ → test/integration/                                   |

### ✅ Phase 1 - Module Architecture CREATED (February 1, 2026)

Created 12 feature modules with proper structure:

- `modules/auth/` - Authentication & user session
- `modules/chat/` - Messaging & conversations
- `modules/forums/` - Forum discussions
- `modules/groups/` - servers
- `modules/gamification/` - XP, achievements, quests
- `modules/social/` - Friends, presence, notifications
- `modules/settings/` - User preferences & customization
- `modules/calls/` - Voice/video calls
- `modules/moderation/` - Reports, bans, mod tools
- `modules/premium/` - Subscriptions, payments
- `modules/search/` - Global search
- `modules/admin/` - Admin dashboard

### ✅ Phase 2 - Module Population COMPLETED (February 2, 2026)

Migrated 154 files to 12 modules:

| Module       | Components | Stores | Status |
| ------------ | ---------- | ------ | ------ |
| auth         | ✅ 7       | ✅     | Ready  |
| chat         | ✅ 50+     | ✅     | Ready  |
| forums       | ✅ 20+     | ✅     | Ready  |
| groups       | ✅ 6       | ✅     | Ready  |
| gamification | ✅ 15+     | ✅     | Ready  |
| social       | ✅ 5       | ✅     | Ready  |
| settings     | ✅ 8+      | ✅     | Ready  |
| calls        | ✅ 4       | ✅     | Ready  |
| moderation   | ✅ 2       | ✅     | Ready  |
| premium      | ✅ 5       | ✅     | Ready  |
| search       | ✅ 1       | ✅     | Ready  |
| admin        | ✅ 3       | -      | Ready  |

### ✅ Phase 3 - Shared Module POPULATED (February 2, 2026)

Populated shared module with re-exports for gradual migration:

```
shared/
├── index.ts              # Main export point
├── components/
│   ├── ui/               # Button, Card, Dialog, GlassCard (90+ exports)
│   ├── layout/           # Sidebar, TopNav, PageContainer
│   └── feedback/         # Toast, Alert, EmptyState, Skeleton
├── hooks/                # useDebounce, useMediaQuery, useToast, etc.
├── utils/                # cn, formatTimeAgo, getDisplayError, etc.
└── types/                # Re-exports from @cgraph/shared-types
```

Import patterns:

```typescript
// New (recommended)
import { GlassCard, useDebounce, cn } from '@/shared';
import { Button } from '@/shared/components/ui';
import type { User } from '@/shared/types';

// Legacy (still works)
import GlassCard from '@/components/ui/GlassCard';
import { useDebounce } from '@/hooks';
```

### ✅ Phase 4 - Import Migration COMPLETE (February 2, 2026)

**GlassCard Migration: COMPLETE (70+ files)**

- Migrated all GlassCard imports to `@/shared/components/ui`
- Added GlassCardNeon, GlassCardHolographic, GlassCardCrystal exports
- Chat, Forum, Gamification, Groups, Premium, Settings, Social components

**Hook Migration: COMPLETE (10 files)**

- useToast → `@/shared/hooks`
- useDebounce → `@/shared/hooks`

### ✅ Phase 5 - Module Cleanup COMPLETE (February 2, 2026)

**Module Index Exports:**

- Created `modules/index.ts` with namespace exports for all 12 modules
- Enabled component exports in auth, calls, admin modules
- Resolved export naming conflicts using `export * as moduleName` pattern

```typescript
// Import from specific module (recommended)
import { MessageBubble, ChatInfoPanel } from '@/modules/chat';
import { AchievementDisplay, QuestPanel } from '@/modules/gamification';

// Or use namespace
import { chat, gamification } from '@/modules';
```

### ✅ Phase 6 - Final Migration COMPLETE (February 2, 2026)

**UI Primitive Migration: 100% COMPLETE**

| Import Type          | Files Migrated | Status      |
| -------------------- | -------------- | ----------- |
| GlassCard variants   | 70+            | ✅ Complete |
| Toast/ToastContainer | 21             | ✅ Complete |
| UI barrel imports    | 5              | ✅ Complete |
| Hook imports         | 10             | ✅ Complete |
| Card/Button/Badge    | 12             | ✅ Complete |
| **Total**            | **187**        | ✅ Complete |

**Remaining Application-Level Imports:**

- ThemedAvatar (application component, not primitive)
- useWebRTC, useCustomizationApplication (specialized hooks)
- Admin components (feature-specific)

These are intentionally kept in `@/components/` as they are application-layer code, not shared
primitives.

---

## Executive Summary

This plan transforms CGraph from a chaotic 479K LOC codebase into a world-class architecture that
surpasses industry giants. We will:

1. **Reduce complexity by 75-80%** (61 stores → 12 = -80%, 39 component folders → 12 = -69%)
2. **Achieve 100% platform parity** (shared code between web/mobile)
3. **Enforce strict conventions** (500-line max, co-located tests)
4. **Create a module-first architecture** (feature-based organization)

---

## Phase 0: Immediate Cleanup (Day 1-3)

**CRITICAL**: Before any architectural changes, clean up scattered files and deprecated code. This
prevents moving garbage into the new structure.

### 0.1 Delete Deprecated Store Files

**VERIFIED STATUS** (as of Feb 2026):

| File                           | Lines | Imports       | Safe to Delete | Action               |
| ------------------------------ | ----- | ------------- | -------------- | -------------------- |
| `customizationStore.ts`        | 16    | 0             | ✅ YES         | Delete               |
| `customizationStoreV2.ts`      | 36    | 0             | ✅ YES         | Delete               |
| `unifiedCustomizationStore.ts` | 173   | 5             | ❌ NO          | Migrate first        |
| `community/forumSlice.ts`      | 1552  | 0 (via index) | ⚠️ CAREFUL     | Update re-exports    |
| `pmStore.ts`                   | 814   | 0             | ✅ YES         | Delete               |
| `referralStore.ts`             | -     | 3             | ❌ NO          | Keep (actively used) |

```bash
# SAFE TO DELETE (verified no imports):
rm apps/web/src/stores/customizationStore.ts      # Re-export wrapper only
rm apps/web/src/stores/customizationStoreV2.ts    # Re-export wrapper only
rm apps/web/src/stores/pmStore.ts                 # No imports found

# DO NOT DELETE - unifiedCustomizationStore.ts has 5 active imports:
#   - ChatBubbleSettings.tsx (useChatCustomization hook)
#   - ThemedChatBubble.tsx (useChatCustomization hook)
#   - settingsFacade.ts
#   - stores/index.ts
#   - ChatBubbleSettings.HYBRID_EXAMPLE.tsx
# Migration required: Move useChatCustomization hook to customization/index.ts first

# DO NOT DELETE - referralStore.ts has 3 active imports:
#   - gamificationFacade.ts
#   - stores/index.ts
#   - ReferralDashboard.tsx

# CAREFUL - community/forumSlice.ts is identical to forumStore.ts (both 1552 lines)
# Before deleting, update apps/web/src/stores/community/index.ts to import from forumStore:
# Change: export { useForumStore, ... } from './forumSlice';
# To:     export { useForumStore, ... } from '../forumStore';
# Then delete: rm apps/web/src/stores/community/forumSlice.ts

# Verification commands:
grep -r "from.*customizationStore['\"]" apps/web/src/ --include="*.ts" --include="*.tsx"
grep -r "from.*pmStore" apps/web/src/ --include="*.ts" --include="*.tsx"
```

### 0.2 Remove Duplicate/Scattered Landing Pages

Multiple landing page variants exist in the wrong location:

```bash
# Web app has 4+ landing page files that belong in apps/landing/
ls -la apps/web/src/pages/Landing*.tsx

# Decision tree:
# 1. If using apps/landing/ for marketing (recommended): DELETE all from apps/web
# 2. If apps/web handles both: KEEP only LandingPage.tsx, delete others

# Option 1 (Recommended): Remove landing pages from web app
rm apps/web/src/pages/LandingPage.tsx
rm apps/web/src/pages/LandingPageUltimate.tsx
rm apps/web/src/pages/LandingPageOptimized.tsx
rm apps/web/src/pages/LandingPageEnhanced.tsx

# Update apps/web routes to redirect unauthenticated users to landing app
# In apps/web/src/App.tsx, change:
#   <Route path="/" element={<LandingPage />} />
# To:
#   <Route path="/" element={<Navigate to="/messages" replace />} />
#   (with auth guard redirecting to cgraph.org for unauthenticated)
```

### 0.3 Fix File Naming Issues

```bash
# File with space in name (breaks imports)
mv "apps/web/src/lib/crypto/migrateTo SecureStorage.ts" \
   "apps/web/src/lib/crypto/migrateToSecureStorage.ts"

# Update any imports:
grep -r "migrateTo SecureStorage" apps/web/src/ --include="*.ts" --include="*.tsx"
# Change to: import { ... } from './migrateToSecureStorage'
```

### 0.4 Consolidate Mobile Context Directories

Mobile app has both `/context/` and `/contexts/` directories with different content:

**Current structure (verified):**

```
apps/mobile/src/context/
└── __tests__/
    └── AuthContext.test.tsx    # Comprehensive test (newer version)

apps/mobile/src/contexts/
├── AuthContext.tsx
├── CustomizationContext.tsx
├── SettingsContext.tsx
├── ThemeContext.tsx
└── __tests__/
    └── AuthContext.test.tsx    # Different test version (older)
```

```bash
# Step 1: Compare the two test files (they are DIFFERENT versions!)
diff apps/mobile/src/context/__tests__/AuthContext.test.tsx \
     apps/mobile/src/contexts/__tests__/AuthContext.test.tsx

# Step 2: The context/__tests__/AuthContext.test.tsx is more comprehensive
# Keep the better version, update imports if needed
cp apps/mobile/src/context/__tests__/AuthContext.test.tsx \
   apps/mobile/src/contexts/__tests__/AuthContext.comprehensive.test.tsx

# Step 3: Remove the empty context/ directory (only had tests)
rm -rf apps/mobile/src/context/

# Step 4: Verify no imports reference the old path
grep -r "from.*context/" apps/mobile/src/ --include="*.ts" --include="*.tsx"
# If any found, update to: from "@/contexts/"
```

**Note:** The `context/` directory only contains tests, not actual context files. The actual context
implementations are all in `contexts/`.

### 0.5 Fix Index Files with Implementation Code

Index files should ONLY contain exports, not implementation. These need refactoring:

**Verified sizes:** | File | Actual Lines | Target | Status |
|------|-------------|--------|--------| | `stores/theme/index.ts` | 982 | <30 | ❌ Refactor needed
| | `stores/customization/index.ts` | 675 | <50 | ⚠️ Review needed |

```bash
# Check problematic index files
wc -l apps/web/src/stores/theme/index.ts        # 982 lines - TOO LARGE!
wc -l apps/web/src/stores/customization/index.ts # Check size

# Refactor theme/index.ts (982 lines → <30 lines)
# Step 1: Create themeStore.ts with implementation
mv apps/web/src/stores/theme/index.ts apps/web/src/stores/theme/themeStore.ts

# Step 2: Create clean index.ts with exports only
cat > apps/web/src/stores/theme/index.ts << 'EOF'
// Theme store - single export point
export { useThemeStore } from './themeStore';
export type { ThemeState, ThemeActions } from './themeStore';
EOF

# Step 3: Update imports throughout codebase
# Most imports already use: import { useThemeStore } from '@/stores/theme'
# This will continue to work since the export names remain the same
```

### 0.6 Remove TODO Comments from Production Code

Found ~31 TODO/FIXME comments that need resolution:

```bash
# List all TODOs with context
grep -rn "TODO\|FIXME\|HACK\|XXX" apps/web/src/ --include="*.ts" --include="*.tsx" | head -30

# Categories of TODOs found:
# 1. Security TODOs (CRITICAL - fix immediately)
grep -rn "TODO.*security\|TODO.*auth\|TODO.*encrypt" apps/web/src/

# 2. Feature TODOs (track in issue tracker, remove comment)
grep -rn "TODO.*implement\|TODO.*add\|TODO.*create" apps/web/src/

# 3. Cleanup TODOs (do now or remove)
grep -rn "TODO.*clean\|TODO.*remove\|TODO.*refactor" apps/web/src/

# For each TODO:
# - If critical: Fix it
# - If feature: Create GitHub issue, remove TODO comment
# - If cleanup: Do it now or delete the comment
```

### 0.7 Organize Test Files

Current test structure is inconsistent. Standardize before Phase 1:

```bash
# Current issues:
# - Tests in /src/__tests__/ (root level - wrong)
# - Tests in /src/lib/crypto/__tests__/ (correct for lib)
# - Most components have no co-located tests

# Step 1: Move root __tests__ to appropriate modules
mkdir -p apps/web/src/test/integration
mv apps/web/src/__tests__/*.test.ts apps/web/src/test/integration/

# Step 2: Create test fixtures directory
mkdir -p apps/web/src/test/fixtures
mkdir -p apps/web/src/test/mocks

# Step 3: Create test setup file
cat > apps/web/src/test/setup.ts << 'EOF'
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
EOF

# Step 4: Update vitest.config.ts
# Add: setupFiles: ['./src/test/setup.ts']
```

### 0.8 Delete Unused/Dead Code

```bash
# Find potentially unused exports
npx ts-prune apps/web/src/ 2>/dev/null | head -50

# Find files with no imports (potentially dead)
for file in $(find apps/web/src -name "*.ts" -o -name "*.tsx"); do
  filename=$(basename "$file")
  imports=$(grep -r "$filename" apps/web/src --include="*.ts" --include="*.tsx" | wc -l)
  if [ "$imports" -lt 2 ]; then
    echo "Potentially unused: $file ($imports imports)"
  fi
done

# Review each file before deletion - some may be entry points or dynamically imported
```

### 0.9 Clean Up Pages Folder (Test/Demo/Archive)

The pages folder has scattered test, demo, and archive files that don't belong in production:

```bash
# Found scattered folders in pages/:
ls -la apps/web/src/pages/archive/     # Old archived pages
ls -la apps/web/src/pages/demo/        # Demo/workshop files
ls -la apps/web/src/pages/test/        # Test pages

# Decision: Move or delete these
# Option 1: Delete if not needed
rm -rf apps/web/src/pages/archive/
rm -rf apps/web/src/pages/demo/
rm -rf apps/web/src/pages/test/

# Option 2: Move to separate dev-only directory
mkdir -p apps/web/src/__dev__
mv apps/web/src/pages/archive apps/web/src/__dev__/
mv apps/web/src/pages/demo apps/web/src/__dev__/
mv apps/web/src/pages/test apps/web/src/__dev__/

# Also found duplicate customization pages:
# - pages/customize/          (6 files)
# - pages/settings/ThemeCustomization.tsx
# Consolidate to single location in modules/settings/
```

### 0.10 Fix Duplicate Component Directories

```bash
# Current duplication:
# apps/web/src/components/forum/      (3 files)
# apps/web/src/components/forums/     (24 files) <- Keep this one

# Merge forum/ into forums/
for file in apps/web/src/components/forum/*; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    if [ ! -f "apps/web/src/components/forums/$filename" ]; then
      mv "$file" apps/web/src/components/forums/
    else
      echo "CONFLICT: $filename exists in both - manual merge needed"
    fi
  fi
done
rmdir apps/web/src/components/forum 2>/dev/null || echo "forum/ not empty, manual cleanup needed"

# Same for chat-related directories (will be handled in Phase 3)
# - components/chat/
# - components/conversation/
# - components/messages/
# - components/messaging/
```

### 0.11 Security File Audit

**Current status (verified Feb 2026):**

- `apps/web/.env` exists but contains ONLY public configuration (API URLs)
- No secrets, API keys, or credentials found in .env
- Backend secrets are properly managed via Fly.io secrets

```bash
# Check for .env files
find . -name ".env" -not -path "./node_modules/*"
# Result: apps/web/.env (contains only VITE_API_URL, VITE_WS_URL - public URLs)

# Verify .env contains no secrets (should only have VITE_* public vars)
grep -E "SECRET|PASSWORD|KEY|TOKEN|PRIVATE" apps/web/.env
# If any matches, those should be moved to environment variables

# Check for other sensitive files
find . -name "*.pem" -not -path "./node_modules/*"
find . -name "*secret*" -not -path "./node_modules/*" -not -name "*.md"

# Check for hardcoded secrets in code
grep -rn "sk_live_\|pk_live_\|AKIA\|password\s*[:=]\s*['\"][^'\"]*['\"]" apps/ \
  --include="*.ts" --include="*.tsx" --include="*.ex" | grep -v "test\|mock\|example"

# Ensure .env.example exists for documentation (without real values)
ls apps/web/.env.example apps/backend/.env.example 2>/dev/null
```

**Note:** The `apps/web/.env` file is acceptable as it only contains:

- `VITE_API_URL` - Public API endpoint
- `VITE_WS_URL` - Public WebSocket endpoint
- `VITE_APP_NAME` - App name
- `VITE_APP_VERSION` - Version string

These are NOT secrets and are safe to commit. Backend secrets (Stripe keys, JWT secrets, etc.) are
managed via Fly.io secrets and never committed.

### 0.12 Cleanup Checklist

Run this checklist before proceeding to Phase 1:

```markdown
## Pre-Phase 1 Cleanup Checklist (Verified Feb 2026)

### Deprecated Files (Safe to Delete)

- [ ] Deleted customizationStore.ts (re-export only, 0 imports)
- [ ] Deleted customizationStoreV2.ts (re-export only, 0 imports)
- [ ] Deleted pmStore.ts (0 imports)
- [ ] Fixed "migrateTo SecureStorage.ts" filename (space in name)

### Files Requiring Migration First

- [ ] unifiedCustomizationStore.ts - migrate useChatCustomization hook to customization/
- [ ] community/forumSlice.ts - update community/index.ts imports, then delete

### Files to KEEP (Actively Used)

- [ ] referralStore.ts - has 3 active imports (DO NOT DELETE)
- [ ] stores/facades/ - entire directory (7 domain facades - PRESERVE!)

### Pages Folder Cleanup

- [ ] Removed or moved pages/archive/ (old archived pages)
- [ ] Removed or moved pages/demo/ (workshop files)
- [ ] Removed or moved pages/test/ (test pages)
- [ ] Consolidated customize/ pages with settings/

### Landing Pages

- [ ] Decided: keep one LandingPage.tsx or use apps/landing/ exclusively
- [ ] Deleted unused landing page variants (Ultimate, Optimized, Enhanced)

### Directory Structure

- [ ] Removed mobile context/ directory (only had tests)
- [ ] Merged mobile context/**tests**/ into contexts/**tests**/
- [ ] Merged components/forum/ (3 files) → components/forums/ (24 files)
- [ ] Moved root **tests**/ (3 files) → test/integration/

### Index Files

- [ ] Refactored theme/index.ts (982 lines → <30 lines)
- [ ] All index.ts files contain exports only (no implementation)

### Code Quality

- [ ] Resolved security-related TODOs
- [ ] Created GitHub issues for feature TODOs
- [ ] Removed obsolete TODO comments

### Security (Verified OK)

- [ ] apps/web/.env contains only VITE\_\* public variables (acceptable)
- [ ] No hardcoded secrets in source code
- [ ] Backend secrets managed via Fly.io (not committed)

### Testing

- [ ] Created test/setup.ts with mocks
- [ ] Created test/fixtures/ and test/mocks/ directories
- [ ] Updated vitest.config.ts with setup file

### Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes (in apps/web)
- [ ] Application starts without errors
- [ ] No console errors in browser
```

### 0.13 Automated Cleanup Script

Create a script to automate safe cleanup operations:

```bash
#!/bin/bash
# scripts/cleanup-phase0.sh
# Verified safe operations as of Feb 2026

set -e  # Exit on error

echo "🧹 CGraph Phase 0 Cleanup"
echo "========================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to safely delete file if no imports
safe_delete() {
  local file=$1
  local name=$(basename "$file" | sed 's/\.[^.]*$//')

  # Check for imports (exclude the file itself)
  imports=$(grep -r "from.*['\"].*$name['\"]" apps/web/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "$file" | wc -l)

  if [ "$imports" -eq 0 ]; then
    echo -e "${GREEN}✓ Deleting $file (no imports found)${NC}"
    rm "$file"
    return 0
  else
    echo -e "${YELLOW}⚠ Skipping $file ($imports imports found)${NC}"
    return 1
  fi
}

# 1. Delete SAFE deprecated store wrappers (verified no imports)
echo -e "\n${YELLOW}Step 1: Deleting safe deprecated stores...${NC}"

# These are verified safe to delete (re-export wrappers with 0 imports)
SAFE_TO_DELETE=(
  "apps/web/src/stores/customizationStore.ts"
  "apps/web/src/stores/customizationStoreV2.ts"
  "apps/web/src/stores/pmStore.ts"
)

for store in "${SAFE_TO_DELETE[@]}"; do
  if [ -f "$store" ]; then
    safe_delete "$store"
  fi
done

# DO NOT DELETE these (have active imports):
echo -e "${YELLOW}⚠ NOT deleting unifiedCustomizationStore.ts (5 imports - needs migration)${NC}"
echo -e "${YELLOW}⚠ NOT deleting referralStore.ts (3 imports - actively used)${NC}"

# 2. Fix filename with space
echo -e "\n${YELLOW}Step 2: Fixing filename with space...${NC}"
if [ -f "apps/web/src/lib/crypto/migrateTo SecureStorage.ts" ]; then
  mv "apps/web/src/lib/crypto/migrateTo SecureStorage.ts" \
     "apps/web/src/lib/crypto/migrateToSecureStorage.ts"
  echo -e "${GREEN}✓ Renamed migrateToSecureStorage.ts${NC}"
else
  echo -e "${GREEN}✓ File already renamed or doesn't exist${NC}"
fi

# 3. Handle mobile context directories (context/ only has tests)
echo -e "\n${YELLOW}Step 3: Consolidating mobile context test directories...${NC}"
if [ -d "apps/mobile/src/context/__tests__" ]; then
  # Backup the comprehensive test to contexts/__tests__/
  if [ -f "apps/mobile/src/context/__tests__/AuthContext.test.tsx" ]; then
    cp "apps/mobile/src/context/__tests__/AuthContext.test.tsx" \
       "apps/mobile/src/contexts/__tests__/AuthContext.comprehensive.test.tsx"
    echo -e "${GREEN}✓ Copied comprehensive test to contexts/__tests__/${NC}"
  fi
  rm -rf apps/mobile/src/context/
  echo -e "${GREEN}✓ Removed empty context/ directory${NC}"
else
  echo -e "${GREEN}✓ context/ already cleaned up${NC}"
fi

# 4. Create test directories
echo -e "\n${YELLOW}Step 4: Creating test structure...${NC}"
mkdir -p apps/web/src/test/{integration,fixtures,mocks}
echo -e "${GREEN}✓ Created test directories${NC}"

# 5. Report TODOs
echo -e "\n${YELLOW}Step 5: TODO/FIXME Report${NC}"
todo_count=$(grep -rn "TODO\|FIXME" apps/web/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
echo "Found $todo_count TODO/FIXME comments to review"

# 6. Check .env files (web .env is OK - only has public VITE_* vars)
echo -e "\n${YELLOW}Step 6: Security check...${NC}"
if grep -qE "SECRET|PASSWORD|PRIVATE_KEY|sk_live|pk_live" apps/web/.env 2>/dev/null; then
  echo -e "${RED}⚠ WARNING: apps/web/.env contains potential secrets!${NC}"
else
  echo -e "${GREEN}✓ apps/web/.env contains only public VITE_* variables${NC}"
fi

# Check backend .env (should not exist in production)
if [ -f "apps/backend/.env" ]; then
  echo -e "${YELLOW}⚠ apps/backend/.env exists - ensure secrets are in Fly.io${NC}"
fi

echo -e "\n${GREEN}Phase 0 cleanup complete!${NC}"
echo ""
echo "Manual tasks remaining:"
echo "  1. Migrate useChatCustomization from unifiedCustomizationStore to customization/"
echo "  2. Update community/index.ts to import from forumStore instead of forumSlice"
echo "  3. Review and merge mobile test files"
echo ""
echo "Run 'pnpm typecheck && pnpm lint && pnpm test' to verify"
```

Make the script executable:

```bash
chmod +x scripts/cleanup-phase0.sh
```

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Establish Strict Conventions

**Create `/CGraph/.architecture/conventions.md`:**

```markdown
## CGraph Architecture Conventions

### File Size Limits (ENFORCED VIA ESLint)

- Components: MAX 400 lines (warn at 300)
- Stores: MAX 500 lines (warn at 400)
- Hooks: MAX 200 lines (warn at 150)
- Utils: MAX 150 lines (warn at 100)
- Backend modules: MAX 500 lines (warn at 400)

### Folder Depth

- Maximum: 5 levels from src/
- Pattern: src/{module}/{submodule}/{file}.tsx

### Naming Conventions

- Folders: kebab-case (chat-messages, not chatMessages)
- Components: PascalCase.tsx
- Hooks: use{Name}.ts
- Stores: {domain}Store.ts
- Utils: {name}.ts (camelCase)
- Tests: {name}.test.ts (co-located)

### Single Responsibility

- One component = one file
- One store = one domain
- One module = one feature
```

**Create ESLint rules:**

```javascript
// .eslintrc.js additions
module.exports = {
  rules: {
    'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 50 }],
  },
  overrides: [
    {
      files: ['*Store.ts', '*Slice.ts'],
      rules: { 'max-lines': ['error', { max: 500 }] },
    },
    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: { 'max-lines': 'off' },
    },
  ],
};
```

### 1.2 Create Module Architecture

**Target structure ():**

```
apps/web/src/
├── modules/                    # FEATURE-FIRST (replaces pages/, features/, stores/)
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── index.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   ├── __tests__/
│   │   │   └── authStore.test.ts
│   │   └── index.ts            # Single export point
│   │
│   ├── chat/                   # Merges: chat, conversation, messages, messaging
│   │   ├── components/
│   │   │   ├── ConversationList.tsx
│   │   │   ├── ConversationHeader.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   ├── store/
│   │   │   ├── chatStore.ts        # Main store (< 500 lines)
│   │   │   ├── messageSlice.ts     # Message-specific
│   │   │   ├── typingSlice.ts      # Typing indicators
│   │   │   └── index.ts
│   │   ├── api/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── forums/                 # Merges: forum, forums, forumHosting
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   │   ├── forumStore.ts
│   │   │   ├── threadSlice.ts
│   │   │   ├── postSlice.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   └── index.ts
│   │
│   ├── groups/                 #  servers
│   ├── gamification/           # XP, achievements, quests
│   ├── social/                 # Friends, presence, notifications
│   ├── settings/               # User settings + customization
│   ├── calls/                  # Voice/video calls
│   ├── moderation/             # Reports, bans, mod tools
│   ├── premium/                # Subscriptions, payments
│   ├── search/                 # Global search
│   └── admin/                  # Admin dashboard
│
├── shared/                     # TRULY shared code (replaces components/)
│   ├── components/
│   │   ├── ui/                 # Primitives: Button, Input, Modal, etc.
│   │   ├── layout/             # AppShell, Sidebar, Header
│   │   ├── feedback/           # Toast, Alert, Loading
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useMediaQuery.ts
│   │   ├── useDebounce.ts
│   │   └── index.ts
│   ├── utils/
│   └── types/
│
├── platform/                   # Platform-specific code
│   └── web/
│       ├── App.tsx
│       ├── router.tsx
│       └── main.tsx
│
└── lib/                        # External integrations
    ├── api/
    ├── socket/
    ├── crypto/
    └── analytics/
```

**Migration script to create structure:**

```bash
#!/bin/bash
# scripts/create-module-structure.sh

MODULES=(auth chat forums groups gamification social settings calls moderation premium search admin)

for module in "${MODULES[@]}"; do
  mkdir -p "apps/web/src/modules/$module/"{components,hooks,store,api,types,__tests__}

  # Create index.ts for each module
  cat > "apps/web/src/modules/$module/index.ts" << EOF
// $module module - single export point
export * from './components';
export * from './hooks';
export * from './store';
export * from './types';
EOF

  # Create component index
  echo "// $module components" > "apps/web/src/modules/$module/components/index.ts"
  echo "// $module hooks" > "apps/web/src/modules/$module/hooks/index.ts"
  echo "// $module store" > "apps/web/src/modules/$module/store/index.ts"
  echo "// $module types" > "apps/web/src/modules/$module/types/index.ts"
done

# Create shared structure
mkdir -p "apps/web/src/shared/"{components/ui,components/layout,components/feedback,hooks,utils,types}
```

---

## Phase 2: Store Consolidation (Weeks 2-3)

### 2.0 CRITICAL: Preserve Existing Facades

**⚠️ IMPORTANT**: The codebase already has a well-designed facade pattern that MUST be preserved!

**Existing facades (apps/web/src/stores/facades/):**

```
facades/
├── index.ts              # Exports all 7 facades
├── authFacade.ts         # Auth, user session, profile
├── chatFacade.ts         # Messages, conversations, calls, effects
├── communityFacade.ts    # Forums, groups, moderation, announcements
├── gamificationFacade.ts # XP, achievements, prestige, events
├── settingsFacade.ts     # User preferences, theme, customization
├── marketplaceFacade.ts  # Economy, items, borders
└── uiFacade.ts           # Notifications, search, calendar, plugins
```

**These facades already implement CGraph's pattern of domain-based aggregation!**

The migration strategy should:

1. **KEEP** all facades intact
2. **Move** underlying stores into module folders
3. **Update** facade imports to point to new locations
4. **Build** new features using facade pattern

### 2.1 Current State → Target State

**Current (61 files, ~30K LOC):**

```
stores/
├── authStore.ts (577)
├── chatStore.ts (1029) ← TOO LARGE
├── forumStore.ts (1552) ← TOO LARGE + DUPLICATE
├── community/forumSlice.ts (1552) ← DUPLICATE
├── gamificationStore.ts (681)
├── friendStore.ts (346)
├── pmStore.ts (814)
├── chatEffectsStore.ts (745)
├── facades/             ← PRESERVE THIS!
├── [50+ more files...]
```

**Target (12 stores, ~6K LOC):**

```
modules/
├── auth/store/authStore.ts (400 max)
├── chat/store/
│   ├── chatStore.ts (400 max)        # Core chat state
│   ├── messageSlice.ts (300 max)     # Message operations
│   ├── reactionSlice.ts (150 max)    # Reactions
│   └── index.ts                      # Combined export
├── forums/store/
│   ├── forumStore.ts (400 max)
│   ├── threadSlice.ts (300 max)
│   ├── postSlice.ts (300 max)
│   └── index.ts
├── groups/store/groupStore.ts (400 max)
├── gamification/store/
│   ├── gamificationStore.ts (400 max)
│   ├── achievementSlice.ts (200 max)
│   └── index.ts
├── social/store/socialStore.ts (400 max)  # Friends + notifications + presence
├── settings/store/settingsStore.ts (400 max)  # Settings + customization
├── calls/store/callStore.ts (300 max)
├── moderation/store/moderationStore.ts (400 max)
├── premium/store/premiumStore.ts (300 max)
└── search/store/searchStore.ts (200 max)
```

### 2.2 Store Migration Process

**Step 1: Create new chat store (merge 5 stores):**

```typescript
// modules/chat/store/chatStore.ts (< 400 lines)
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Import slices
import { createMessageSlice, MessageSlice } from './messageSlice';
import { createReactionSlice, ReactionSlice } from './reactionSlice';
import { createTypingSlice, TypingSlice } from './typingSlice';

export interface ChatStore extends MessageSlice, ReactionSlice, TypingSlice {
  // Core state
  conversations: Map<string, Conversation>;
  activeConversationId: string | null;

  // Core actions
  setActiveConversation: (id: string) => void;
  loadConversations: () => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      immer((set, get, api) => ({
        // Core state
        conversations: new Map(),
        activeConversationId: null,

        // Core actions
        setActiveConversation: (id) => set({ activeConversationId: id }),
        loadConversations: async () => {
          // Implementation
        },

        // Merge slices
        ...createMessageSlice(set, get, api),
        ...createReactionSlice(set, get, api),
        ...createTypingSlice(set, get, api),
      })),
      { name: 'chat-store' }
    ),
    { name: 'ChatStore' }
  )
);
```

**Step 2: Create message slice (extracted from chatStore):**

```typescript
// modules/chat/store/messageSlice.ts (< 300 lines)
import type { StateCreator } from 'zustand';

export interface MessageSlice {
  messages: Map<string, Message[]>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadMessages: (conversationId: string, cursor?: string) => Promise<void>;
}

export const createMessageSlice: StateCreator<MessageSlice> = (set, get) => ({
  messages: new Map(),

  sendMessage: async (conversationId, content) => {
    // Optimistic update + API call
  },

  editMessage: async (messageId, content) => {
    // Implementation
  },

  deleteMessage: async (messageId) => {
    // Implementation
  },

  loadMessages: async (conversationId, cursor) => {
    // Pagination implementation
  },
});
```

**Step 3: Migrate old stores (PRESERVE FACADES):**

```bash
# ⚠️ DO NOT delete stores/facades/ - these are actively used!

# After all modules migrated, move old stores to modules:
# Example: Move chatStore to modules/chat/store/
mv apps/web/src/stores/chatStore.ts apps/web/src/modules/chat/store/
mv apps/web/src/stores/chatEffectsStore.ts apps/web/src/modules/chat/store/

# Update facade imports to point to new locations:
# In facades/chatFacade.ts, change:
#   from '../chatStore' → from '../../modules/chat/store/chatStore'

# Only delete after verifying no direct imports remain:
grep -r "from.*stores/chatStore" apps/web/src/ --include="*.ts" --include="*.tsx"
# If results only show facade imports, the store can be moved

# NEVER use rm -rf on directories - move files individually
# Keep facades/ directory permanently - it's the public API

# After migration, stores/ should only contain:
# stores/
# ├── facades/          # KEEP - public API for stores
# ├── index.ts          # KEEP - re-exports facades
# └── middleware.ts     # KEEP - shared middleware
```

---

## Phase 3: Component Restructuring (Weeks 3-5)

### 3.1 Kill Mega-Components

**CustomizationDemo.tsx (3,510 lines) → 15 files:**

```
modules/settings/components/customization-demo/
├── CustomizationDemo.tsx (200 lines - orchestrator)
├── ThemePreview.tsx (250 lines)
├── AvatarPreview.tsx (200 lines)
├── ChatBubblePreview.tsx (200 lines)
├── ProfilePreview.tsx (200 lines)
├── EffectsPreview.tsx (200 lines)
├── AnimationPreview.tsx (200 lines)
├── BorderPreview.tsx (150 lines)
├── FontPreview.tsx (150 lines)
├── ColorPicker.tsx (200 lines)
├── PresetSelector.tsx (150 lines)
├── ExportImport.tsx (200 lines)
├── hooks/
│   ├── useCustomizationDemo.ts (200 lines)
│   └── usePreviewState.ts (150 lines)
├── types.ts (50 lines)
└── index.ts (20 lines)
```

**Conversation.tsx (1,006 lines) → 8 component files + hooks:**

```
modules/chat/components/conversation/
├── Conversation.tsx (150 lines - orchestrator)
├── ConversationHeader.tsx (150 lines)
├── MessageList.tsx (200 lines)
├── MessageInput.tsx (200 lines)
├── MessageBubble.tsx (150 lines)
├── AttachmentPreview.tsx (100 lines)
├── TypingIndicator.tsx (50 lines)
├── hooks/
│   ├── useConversation.ts (150 lines)
│   └── useMessageActions.ts (100 lines)
└── index.ts
```

### 3.2 Eliminate Duplicate Folders

**Current chaos:**

```
components/
├── forum/ (3 files)
├── forums/ (24 files)       ← MERGE INTO forums/
├── messages/ (11 files)
├── messaging/ (3 files)     ← MERGE INTO chat/
├── chat/ (14 files)
├── conversation/ (7 files)  ← MERGE INTO chat/
```

**Migration commands:**

```bash
# Step 1: Move forum/ contents to forums/ (if not done in Phase 0)
# Use the safe merge approach from Phase 0.10:
for file in apps/web/src/components/forum/*; do
  [ -f "$file" ] && mv "$file" apps/web/src/components/forums/ 2>/dev/null
done
rmdir apps/web/src/components/forum 2>/dev/null

# Step 2: Consolidate into modules/chat/
mkdir -p apps/web/src/modules/chat/components/

# Move all chat-related
mv apps/web/src/components/chat/* apps/web/src/modules/chat/components/
mv apps/web/src/components/conversation/* apps/web/src/modules/chat/components/
mv apps/web/src/components/messages/* apps/web/src/modules/chat/components/
mv apps/web/src/components/messaging/* apps/web/src/modules/chat/components/

# Remove empty folders (rmdir will fail if not empty - safer than rm -rf)
rmdir apps/web/src/components/chat apps/web/src/components/conversation \
      apps/web/src/components/messages apps/web/src/components/messaging 2>/dev/null || \
      echo "Some directories not empty - check for remaining files"
```

### 3.3 Shared Component Library

**Target: 40 truly shared components**

```
shared/components/
├── ui/                         # Design system primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Switch.tsx
│   ├── Checkbox.tsx
│   ├── Radio.tsx
│   ├── Slider.tsx
│   ├── Modal.tsx
│   ├── Dialog.tsx
│   ├── Drawer.tsx
│   ├── Popover.tsx
│   ├── Tooltip.tsx
│   ├── Dropdown.tsx
│   ├── Menu.tsx
│   ├── Tabs.tsx
│   ├── Accordion.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Skeleton.tsx
│   └── index.ts
│
├── layout/                     # Layout components
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Container.tsx
│   ├── Grid.tsx
│   ├── Stack.tsx
│   ├── Divider.tsx
│   └── index.ts
│
├── feedback/                   # User feedback
│   ├── Toast.tsx
│   ├── Alert.tsx
│   ├── Progress.tsx
│   ├── Spinner.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   └── index.ts
│
├── data-display/               # Data visualization
│   ├── Table.tsx
│   ├── List.tsx
│   ├── DataGrid.tsx
│   ├── Timeline.tsx
│   └── index.ts
│
└── index.ts                    # Unified export
```

---

## Phase 4: Backend Module Restructuring (Weeks 5-7)

### 4.1 Split God Modules

**Forums.ex (3,316 lines, 141 functions) → 8 modules:**

```elixir
# lib/cgraph/forums/forums.ex (FACADE - 200 lines max)
defmodule CGraph.Forums do
  @moduledoc "Forums context facade - delegates to specialized modules"

  # Forum CRUD
  defdelegate list_forums(opts \\ []), to: CGraph.Forums.Core
  defdelegate get_forum(id), to: CGraph.Forums.Core
  defdelegate create_forum(attrs), to: CGraph.Forums.Core
  defdelegate update_forum(forum, attrs), to: CGraph.Forums.Core
  defdelegate delete_forum(forum), to: CGraph.Forums.Core

  # Threads
  defdelegate list_threads(forum, opts), to: CGraph.Forums.Threads
  defdelegate create_thread(forum, user, attrs), to: CGraph.Forums.Threads

  # Posts
  defdelegate list_posts(thread, opts), to: CGraph.Forums.Posts
  defdelegate create_post(thread, user, attrs), to: CGraph.Forums.Posts

  # Voting
  defdelegate vote(user, target, direction), to: CGraph.Forums.Voting
  defdelegate get_karma(user), to: CGraph.Forums.Voting

  # Moderation
  defdelegate ban_user(forum, user, reason), to: CGraph.Forums.Moderation
  defdelegate remove_post(post, reason), to: CGraph.Forums.Moderation

  # Search
  defdelegate search(query, opts), to: CGraph.Forums.Search

  # Subscriptions
  defdelegate subscribe(user, forum), to: CGraph.Forums.Subscriptions
end
```

**New module structure:**

```
lib/cgraph/forums/
├── forums.ex                   # Facade (200 lines)
├── core.ex                     # Forum CRUD (300 lines)
├── threads.ex                  # Thread operations (300 lines)
├── posts.ex                    # Post operations (300 lines)
├── comments.ex                 # Comment operations (200 lines)
├── voting.ex                   # Voting + karma (250 lines)
├── moderation.ex               # Mod actions (300 lines)
├── search.ex                   # Search (200 lines)
├── subscriptions.ex            # Subscriptions (150 lines)
├── permissions.ex              # Permission checks (200 lines)
├── schemas/
│   ├── forum.ex
│   ├── thread.ex
│   ├── post.ex
│   ├── comment.ex
│   ├── vote.ex
│   └── ban.ex
└── queries/
    ├── forum_queries.ex
    ├── thread_queries.ex
    └── post_queries.ex
```

**Accounts.ex (1,814 lines) → 5 modules:**

```
lib/cgraph/accounts/
├── accounts.ex                 # Facade (200 lines)
├── users.ex                    # User CRUD (300 lines)
├── authentication.ex           # Login, logout, tokens (400 lines)
├── registration.ex             # Signup, verification (250 lines)
├── profile.ex                  # Profile management (200 lines)
├── settings.ex                 # User settings (200 lines)
├── sessions.ex                 # Session management (200 lines)
└── schemas/
    ├── user.ex
    ├── session.ex
    └── profile.ex
```

### 4.2 Controller Size Limits

**ForumController.ex (500 lines) → Split by resource:**

```
lib/cgraph_web/controllers/api/v1/forums/
├── forum_controller.ex         # Forum CRUD (150 lines)
├── thread_controller.ex        # Thread CRUD (150 lines)
├── post_controller.ex          # Post CRUD (150 lines)
├── comment_controller.ex       # Comments (100 lines)
├── vote_controller.ex          # Voting (100 lines)
├── subscription_controller.ex  # Subscriptions (80 lines)
└── moderation_controller.ex    # Mod actions (150 lines)
```

---

## Phase 5: Platform Parity (Weeks 7-9)

### 5.1 Unified Package Architecture

**Current state:**

- Web: 61 stores, complex architecture
- Mobile: 1 store, completely different approach
- Shared packages: Only 9 UI components

**Target state:**

```
packages/
├── shared-types/               # ALL shared types
│   ├── models/
│   │   ├── user.ts
│   │   ├── message.ts
│   │   ├── conversation.ts
│   │   ├── forum.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── requests.ts
│   │   ├── responses.ts
│   │   └── index.ts
│   └── index.ts
│
├── core/                       # Business logic (platform-agnostic)
│   ├── auth/
│   │   ├── authService.ts
│   │   ├── tokenManager.ts
│   │   └── index.ts
│   ├── chat/
│   │   ├── messageService.ts
│   │   ├── encryptionService.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── apiClient.ts
│   │   ├── endpoints.ts
│   │   └── index.ts
│   └── index.ts
│
├── state/                      # Shared store logic
│   ├── stores/
│   │   ├── createAuthStore.ts
│   │   ├── createChatStore.ts
│   │   ├── createForumStore.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── persist.ts
│   │   ├── devtools.ts
│   │   └── index.ts
│   └── index.ts
│
├── ui/                         # Shared UI (40+ components)
│   ├── primitives/             # Button, Input, etc.
│   ├── composite/              # Avatar, Badge, Card
│   ├── layout/                 # Stack, Grid, Container
│   └── index.ts
│
├── crypto/                     # E2EE shared implementation
│   ├── x3dh.ts
│   ├── doubleRatchet.ts
│   ├── aes.ts
│   └── index.ts
│
├── hooks/                      # Platform-agnostic hooks
│   ├── useDebounce.ts
│   ├── useAsync.ts
│   ├── useLocalStorage.ts
│   └── index.ts
│
└── utils/                      # Utilities
    ├── formatting.ts
    ├── validation.ts
    ├── dates.ts
    └── index.ts
```

### 5.2 Store Factory Pattern

**Create stores that work on both platforms:**

```typescript
// packages/state/stores/createAuthStore.ts
import { StateCreator } from 'zustand';
import type { User } from '@cgraph/shared-types';
import { AuthService } from '@cgraph/core/auth';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export const createAuthStore =
  (authService: AuthService): StateCreator<AuthStore> =>
  (set, get) => ({
    // State
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // Actions
    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const user = await authService.login(email, password);
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },

    logout: async () => {
      await authService.logout();
      set({ user: null, isAuthenticated: false });
    },

    refreshToken: async () => {
      await authService.refreshToken();
    },
  });
```

**Platform-specific wrappers:**

```typescript
// apps/web/src/modules/auth/store/authStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createAuthStore, AuthStore } from '@cgraph/state';
import { webAuthService } from '../api/authService';

export const useAuthStore = create<AuthStore>()(
  devtools(persist(createAuthStore(webAuthService), { name: 'auth-store' }), { name: 'AuthStore' })
);
```

```typescript
// apps/mobile/src/modules/auth/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAuthStore, AuthStore } from '@cgraph/state';
import { mobileAuthService } from '../api/authService';
import { zustandStorage } from '@/lib/storage';

export const useAuthStore = create<AuthStore>()(
  persist(createAuthStore(mobileAuthService), {
    name: 'auth-store',
    storage: zustandStorage, // AsyncStorage adapter
  })
);
```

---

## Phase 6: Testing & Quality (Weeks 9-11)

### 6.1 Test Co-location

**Current: 3% coverage with separated tests**

**Target: 80% coverage with co-located tests**

```
modules/chat/components/
├── MessageBubble.tsx
├── MessageBubble.test.tsx      # Co-located!
├── MessageBubble.stories.tsx   # Co-located!
├── MessageList.tsx
├── MessageList.test.tsx
└── MessageList.stories.tsx
```

**Test template:**

```typescript
// modules/chat/components/MessageBubble.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import { mockMessage } from '@/test/fixtures';

describe('MessageBubble', () => {
  it('renders message content', () => {
    render(<MessageBubble message={mockMessage} />);
    expect(screen.getByText(mockMessage.content)).toBeInTheDocument();
  });

  it('shows edit option for own messages', () => {
    render(<MessageBubble message={mockMessage} isOwn />);
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('handles reactions', async () => {
    const onReact = vi.fn();
    render(<MessageBubble message={mockMessage} onReact={onReact} />);

    fireEvent.click(screen.getByRole('button', { name: /react/i }));
    fireEvent.click(screen.getByText('👍'));

    expect(onReact).toHaveBeenCalledWith('👍');
  });
});
```

### 6.2 Coverage Requirements

**CI enforcement:**

```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Check coverage thresholds
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 80% threshold"
      exit 1
    fi
```

---

## Phase 7: Performance & Polish (Weeks 11-12)

### 7.1 Bundle Analysis

**Target bundle sizes (CGraph-comparable):**

| Chunk          | Max Size | Current | Target |
| -------------- | -------- | ------- | ------ |
| Main           | 200KB    | ~400KB  | 180KB  |
| Chat module    | 100KB    | ~200KB  | 90KB   |
| Forums module  | 80KB     | ~150KB  | 70KB   |
| Gamification   | 50KB     | ~100KB  | 45KB   |
| Vendor (React) | 150KB    | ~150KB  | 130KB  |

**Lazy loading enforcement:**

```typescript
// apps/web/src/platform/web/router.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LoadingScreen } from '@/shared/components';

// Lazy load all modules
const ChatModule = lazy(() => import('@/modules/chat'));
const ForumsModule = lazy(() => import('@/modules/forums'));
const GamificationModule = lazy(() => import('@/modules/gamification'));
const SettingsModule = lazy(() => import('@/modules/settings'));
const AdminModule = lazy(() => import('@/modules/admin'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        path: 'messages/*',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <ChatModule />
          </Suspense>
        ),
      },
      {
        path: 'forums/*',
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <ForumsModule />
          </Suspense>
        ),
      },
      // ... other routes
    ],
  },
]);
```

### 7.2 Import Analysis

**Banned patterns (ESLint rules):**

```javascript
// eslint-plugin-cgraph/rules/no-cross-module-import.js
module.exports = {
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        const currentFile = context.getFilename();

        // Prevent importing from other modules directly
        if (currentFile.includes('/modules/chat/') && source.includes('/modules/forums/')) {
          context.report({
            node,
            message: 'Cross-module imports not allowed. Use shared types or events.',
          });
        }
      },
    };
  },
};
```

---

## Metrics & Success Criteria (Updated February 4, 2026)

### Architecture Metrics

| Metric                  | Start   | Current            | Target | Status           |
| ----------------------- | ------- | ------------------ | ------ | ---------------- |
| Store files             | 61      | **67**             | 20     | ❌ Got worse     |
| Component folders       | 39      | 12 modules         | 12     | ✅ Done          |
| Max file size           | 3,510   | **5,840** (mobile) | 300    | ❌ Got worse     |
| Dead packages           | 0       | **7 (9,300 LOC)**  | 0      | ❌ Critical      |
| Test coverage           | 3%      | 8.5%               | 70%    | ⚠️ Slow progress |
| Cross-module imports    | Unknown | **30+**            | 0      | ❌ Needs work    |
| Module exports complete | 0/12    | 2/12               | 12/12  | ⚠️ Incomplete    |

### Quality Metrics

| Metric                 | Current | Target | Status      |
| ---------------------- | ------- | ------ | ----------- |
| TypeScript strict      | Yes     | Yes    | ✅          |
| ESLint errors          | 0       | 0      | ✅          |
| Console.log statements | 49      | <10    | ⚠️          |
| `any` types            | 38      | <20    | ⚠️          |
| Files >500 lines       | 153     | 0      | ❌ Critical |
| Files >1000 lines      | 29      | 0      | ❌ Critical |

---

## Implementation Timeline

```
Week 1-2:   Foundation (conventions, module structure)
Week 2-3:   Store consolidation (53 → 12)
Week 3-5:   Component restructuring (kill mega-components)
Week 5-7:   Backend module splitting
Week 7-9:   Platform parity (shared packages)
Week 9-11:  Testing & quality (80% coverage)
Week 11-12: Performance & polish
```

---

## Post-Transformation Architecture

```
CGraph/
├── apps/
│   ├── web/src/
│   │   ├── modules/            # 12 feature modules
│   │   ├── shared/             # 40+ shared components
│   │   ├── platform/           # Web-specific code
│   │   └── lib/                # External integrations
│   │
│   ├── mobile/src/
│   │   ├── modules/            # Same 12 modules (shared logic)
│   │   ├── shared/             # Uses packages/ui
│   │   ├── platform/           # Mobile-specific code
│   │   └── lib/
│   │
│   └── backend/lib/
│       ├── cgraph/             # 15 focused contexts (max 500 lines each)
│       └── cgraph_web/         # Thin controller layer
│
└── packages/                   # 60+ shared items
    ├── shared-types/
    ├── core/
    ├── state/
    ├── ui/
    ├── crypto/
    ├── hooks/
    └── utils/
```

---

## Final Score Projection (Outperform Industry Giants)

| Aspect               | Start      | Current    | After Plan | Meta/Google | CGraph     |
| -------------------- | ---------- | ---------- | ---------- | ----------- | ---------- |
| Folder Organization  | 4/10       | 6/10       | 10/10      | 9/10        | 9/10       |
| Component Structure  | 5/10       | 4/10       | 10/10      | 9/10        | 9/10       |
| State Management     | 4/10       | 3/10       | 10/10      | 9/10        | 9/10       |
| Code Sharing         | 3/10       | 1/10       | 10/10      | 8/10        | 8/10       |
| File Size Discipline | 3/10       | 2/10       | 10/10      | 9/10        | 9/10       |
| Feature Completeness | 5/10       | 5/10       | 10/10      | 10/10       | 9/10       |
| Test Coverage        | 2/10       | 3/10       | 10/10      | 9/10        | 8/10       |
| Backend Modularity   | 5/10       | 7/10       | 10/10      | 9/10        | 8/10       |
| Platform Parity      | 3/10       | 1/10       | 10/10      | 9/10        | 8/10       |
| **OVERALL**          | **3.7/10** | **4.8/10** | **10/10**  | **9/10**    | **8.5/10** |

---

## What's Already Built (Solid Foundation)

✅ **12 proper modules** - Structure matches CGraph ✅ **117 components migrated** - Real
implementation ✅ **Triple Ratchet E2EE** - Post-quantum encryption (PQXDH + ML-KEM-768) ✅ **7
working facades** - Clean abstraction pattern ✅ **Phoenix/Elixir backend** - Same stack as CGraph
✅ **TypeScript strict mode** - Professional quality ✅ **9 shared packages** - Platform parity
infrastructure ✅ **Stripe integration** - Subscription tiers ready

---

## Implementation Priorities (Build Order)

### Phase 1: Complete Forum System (Week 1-2)

- [ ] Forum creation with tier limits
- [ ] Invite link generation & sharing
- [ ] Join via invite flow (web + mobile)
- [ ] Forum settings & member management
- [ ] Real-time member count updates

### Phase 2: Connect Packages (Week 2-3)

- [ ] `@cgraph/crypto` → Used by web + mobile E2EE
- [ ] `@cgraph/socket` → Phoenix channels for both apps
- [ ] `@cgraph/hooks` → Shared hook library
- [ ] `@cgraph/core` → Business logic layer
- [ ] `@cgraph/state` → Shared store factories

### Phase 3: Mobile Feature Parity (Week 3-4)

- [ ] Forum creation on mobile
- [ ] Thread creation on mobile
- [ ] Voice calls on mobile
- [ ] Video calls on mobile
- [ ] Push notifications connected

### Phase 4: Refactor Large Files (Week 4-5)

- [ ] ConversationScreen.tsx → 15 components
- [ ] CustomizationDemo.tsx → 12 components
- [ ] ForumAdmin.tsx → 6 components
- [ ] socket.ts → Extracted channel handlers

### Phase 5: Complete Module Exports (Week 5-6)

- [ ] All 12 modules export components, hooks, store, types
- [ ] All facades updated to use module imports
- [ ] Documentation for each module

### Phase 6: Testing & Quality (Week 6-7)

- [ ] 70%+ test coverage
- [ ] Co-located component tests
- [ ] E2E tests for critical flows
- [ ] Performance benchmarks

### Phase 7: Scale & Polish (Week 7-8)

- [ ] Database query optimization
- [ ] Redis caching implementation
- [ ] CDN for static assets
- [ ] Bundle size optimization
- [ ] Load testing (10K concurrent)

---

## Commands for Developers

```bash
# Verify current state
pnpm typecheck && pnpm lint && pnpm test

# Run development (all apps)
pnpm dev

# Check package usage
grep -rn "@cgraph/crypto" apps/ --include="*.ts" --include="*.tsx"

# Find large files to refactor
find apps/ -name "*.tsx" -exec wc -l {} \; | sort -rn | head -20

# Count stores per module
for dir in apps/web/src/modules/*/store; do
  echo "$dir: $(find $dir -name '*.ts' | wc -l) files"
done

# Check module exports
for module in apps/web/src/modules/*/index.ts; do
  echo "=== $module ==="
  grep "export \*" $module
done

# Run specific tests
pnpm test -- --filter="forum"
pnpm test -- --filter="invite"
```

---

## Why CGraph Will Outperform Industry Giants

### vs CGraph

- **Better E2EE**: Signal Protocol (CGraph has none)
- **User-owned forums**: Users create their own communities
- **Better mobile**: React Native with native performance
- **Open pricing**: Transparent tier system

### vs Meta (CGraph/Messenger)

- **Better privacy**: E2EE by default, no data mining
- **Forum communities**: Not just 1:1 messaging
- **Better gamification**: XP, achievements, karma
- **Cross-platform**: True feature parity

### vs CGraph

- **Better encryption**: Signal Protocol > MTProto
- **Better moderation**: Built-in tools for community management
- **Subscription model**: Sustainable business without ads
- **Professional codebase**: TypeScript + Elixir, not custom C++

---

## Core Philosophy

> **"We don't delete code because it's hard. We implement it properly."**

1. **Every package exists for a reason** - Connect it, don't delete it
2. **Large files need refactoring** - Extract components, don't abandon them
3. **Features need completion** - Mobile needs parity with web
4. **Quality is non-negotiable** - Follow the coding standards
5. **Build for scale** - 100M+ users from day one

---

## This Plan Will Make CGraph:

1. **The most secure** - Triple Ratchet / PQXDH E2EE everywhere
2. **The most feature-rich** - Forums + Chat + Calls + Gamification
3. **The most accessible** - Web + iOS + Android with parity
4. **The most scalable** - Built on CGraph's proven Elixir stack
5. **The most professional** - Code that outperforms Meta/Google standards

**Build. Ship. Outperform.**
