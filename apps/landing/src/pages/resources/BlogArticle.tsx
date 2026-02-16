/**
 * Blog Article Page - Individual blog post rendering
 *
 * Renders full article content for each blog post using slug-based routing.
 * All content reflects real milestones from the project changelog and documentation.
 *
 * @since v0.9.15
 */

import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { MarketingLayout } from '@/components/marketing';

interface BlogArticleData {
  title: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
  content: string;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Engineering: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
  Security: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171' },
  Architecture: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399' },
  Product: { bg: 'rgba(234, 179, 8, 0.12)', text: '#fbbf24' },
};

const articleSlugs = [
  'architecture-refactor',
  'compliance-pass',
  'platform-parity',
  'architecture-transformation',
  'e2ee-test-suite',
  'store-consolidation',
  'code-simplification',
  'dual-app-architecture',
  'critical-security-fixes',
  'why-elixir',
  'introducing-cgraph',
];

const blogArticles: Record<string, BlogArticleData> = {
  'architecture-refactor': {
    title: 'Architecture Refactor: Router Split, Component Organization & Build Hardening',
    category: 'Architecture',
    author: 'Burca Lucas',
    date: 'February 15, 2026',
    readTime: '8 min read',
    image: '🏗️',
    tags: ['Architecture', 'Phoenix', 'React', 'Turborepo', 'DX'],
    content: `
<p>With v0.9.26 we implemented all recommendations from our architecture audit (scored 7.7/10), bringing the codebase to <strong>9.2/10</strong>. The refactor touched 96 files with +1,952 / -2,996 lines — a net reduction of over 1,000 lines while improving structure, discoverability, and build performance.</p>

<h3>Phoenix Router Split</h3>

<p>The monolithic <code>router.ex</code> had grown to <strong>989 lines</strong> — every API route in a single file. We decomposed it into <strong>7 domain macro modules</strong> using Phoenix's <code>defmacro</code> pattern:</p>

<table>
<thead><tr><th>Module</th><th>Lines</th><th>Scope</th></tr></thead>
<tbody>
<tr><td>health_routes.ex</td><td>38</td><td>Health checks, readiness probes</td></tr>
<tr><td>auth_routes.ex</td><td>90</td><td>Login, register, OAuth, tokens</td></tr>
<tr><td>public_routes.ex</td><td>71</td><td>Public API endpoints</td></tr>
<tr><td>user_routes.ex</td><td>257</td><td>User CRUD, profiles, settings</td></tr>
<tr><td>messaging_routes.ex</td><td>87</td><td>DMs, conversations, voice</td></tr>
<tr><td>forum_routes.ex</td><td>117</td><td>Forums, posts, comments, votes</td></tr>
<tr><td>gamification_routes.ex</td><td>124</td><td>XP, achievements, quests, leaderboards</td></tr>
<tr><td>admin_routes.ex</td><td>135</td><td>Admin panel, moderation, metrics</td></tr>
</tbody>
</table>

<p>The main <code>router.ex</code> dropped from 989 to <strong>122 lines</strong> — containing only pipeline definitions and macro imports. Each domain module expands at compile time, so zero runtime overhead.</p>

<h3>Frontend Component Organization</h3>

<p>The web app's <code>components/</code> directory had <strong>28 files in a flat structure</strong>. We organized them into 6 categorized subdirectories:</p>

<ul>
<li><strong>ui/</strong> — Button, Input, TextArea, Select, Modal, Tooltip</li>
<li><strong>feedback/</strong> — ErrorBoundary, Loading, Toast, ProgressBar, EmptyState</li>
<li><strong>media/</strong> — VoiceMessagePlayer, VoiceMessageRecorder, Waveform, FileUpload</li>
<li><strong>content/</strong> — MarkdownRenderer, MarkdownEditor, BBCodeRenderer, BBCodeEditor</li>
<li><strong>user/</strong> — Avatar, UserBadge</li>
<li><strong>navigation/</strong> — Tabs, Switch, Dropdown, TagInput, AnimatedLogo</li>
</ul>

<p>Each directory has a barrel <code>index.ts</code> for clean imports. The root barrel re-exports everything for backward compatibility — <strong>zero breaking changes</strong> for the 17 consumers importing through the barrel.</p>

<h3>Build & Tooling Hardening</h3>

<ul>
<li><strong>Turborepo remote caching</strong> — enabled in <code>turbo.json</code> for faster CI builds across the team</li>
<li><strong>Bundle size monitoring</strong> — 8 size-limit budgets (Web JS 500KB, CSS 100KB, Landing JS 200KB, core 50KB, utils 30KB, ui 80KB, shared-types 20KB) with <code>pnpm size:check</code> for CI gating</li>
<li><strong>TypeScript path aliases</strong> — all 12 <code>@cgraph/*</code> aliases now defined in both web and mobile tsconfigs</li>
<li><strong>Version alignment</strong> — all 16 packages synchronized to v0.9.26</li>
</ul>

<h3>Dead Code Removal</h3>

<p>Removed <strong>854 lines</strong> of deprecated circuit breaker code (two modules with zero callers) and cleaned up the orphaned <code>apps/apps/</code> directory. The active circuit breakers (<code>CGraph.CircuitBreaker</code>, <code>CGraph.HTTP.Middleware.CircuitBreaker</code>, <code>CGraph.Redis</code>) remain unchanged.</p>

<h3>Impact Summary</h3>

<table>
<thead><tr><th>Metric</th><th>Before</th><th>After</th></tr></thead>
<tbody>
<tr><td>Architecture audit score</td><td>7.7/10</td><td>9.2/10</td></tr>
<tr><td>router.ex lines</td><td>989</td><td>122 + 7 modules</td></tr>
<tr><td>Flat component files</td><td>28</td><td>0 (6 directories)</td></tr>
<tr><td>Deprecated dead code</td><td>854 lines</td><td>0</td></tr>
<tr><td>tsconfig path aliases</td><td>6 (web), 7 (mobile)</td><td>12 each</td></tr>
<tr><td>Bundle monitoring</td><td>None</td><td>8 budgets, CI-gated</td></tr>
<tr><td>Remote caching</td><td>Disabled</td><td>Enabled</td></tr>
</tbody>
</table>
`,
  },
  'compliance-pass': {
    title: 'Architecture Compliance Pass: All Modules Under Size Limits',
    category: 'Architecture',
    author: 'Burca Lucas',
    date: 'February 15, 2026',
    readTime: '10 min read',
    image: '🏗️',
    tags: ['Architecture', 'Elixir', 'React', 'Compliance'],
    content: `
<p>With v0.9.25 we completed a full architecture compliance pass across the entire CGraph codebase. The goal: <strong>every backend module under 500 lines</strong> and <strong>every React component under 300 lines</strong>. We hit both targets — and added 56 <code>@spec</code> type annotations, audited all 45 <code>Repo.delete</code> calls for soft delete compliance, and synchronized documentation across the project.</p>

<h3>Backend Module Splits</h3>

<p>Eight Elixir modules exceeded the 500-line threshold. Each was refactored using the <strong>sub-module + defdelegate pattern</strong>: business logic moves into focused sub-modules under the parent namespace, while the parent retains its public API via <code>defdelegate</code> calls. Zero breaking changes, full backward compatibility.</p>

<table>
<thead><tr><th>Module</th><th>Before</th><th>After</th><th>Sub-modules Created</th></tr></thead>
<tbody>
<tr><td>CgraphWeb.GroupChannel</td><td>892 lines</td><td>285 lines</td><td>MessageHandler, ReactionHandler, TypingHandler, PinHandler</td></tr>
<tr><td>Cgraph.Notifications</td><td>680 lines</td><td>312 lines</td><td>Delivery, Preferences, Templates</td></tr>
<tr><td>Cgraph.Audit</td><td>620 lines</td><td>289 lines</td><td>Logger, QueryBuilder, Retention</td></tr>
<tr><td>Cgraph.Uploads</td><td>590 lines</td><td>276 lines</td><td>Processor, Storage, Validator</td></tr>
<tr><td>Cgraph.Admin</td><td>575 lines</td><td>298 lines</td><td>Reports, UserManagement, ServerManagement</td></tr>
<tr><td>Cgraph.TierLimits</td><td>560 lines</td><td>267 lines</td><td>Calculator, Enforcer, FeatureGates</td></tr>
<tr><td>Cgraph.Friends</td><td>545 lines</td><td>254 lines</td><td>Requests, Blocking, Suggestions</td></tr>
<tr><td>Cgraph.Events</td><td>530 lines</td><td>241 lines</td><td>Scheduler, RSVP, Reminders</td></tr>
</tbody>
</table>

<p>Total: <strong>4,992 lines refactored</strong> into 26 focused sub-modules averaging ~115 lines each.</p>

<h3>Frontend Component Splits</h3>

<p>Five React components exceeded the 300-line threshold. Each was decomposed using <strong>component extraction + custom hooks</strong>:</p>

<table>
<thead><tr><th>Component</th><th>Before</th><th>After</th><th>Extracted To</th></tr></thead>
<tbody>
<tr><td>MessageBubble</td><td>487 lines</td><td>189 lines</td><td>MessageContent, MessageActions, MessageReactions, useMessageState</td></tr>
<tr><td>Matrix3DEnvironment</td><td>423 lines</td><td>167 lines</td><td>SceneRenderer, CameraController, useMatrixAnimation</td></tr>
<tr><td>ConversationMessages</td><td>398 lines</td><td>201 lines</td><td>MessageList, DateSeparator, useInfiniteScroll</td></tr>
<tr><td>VoiceMessageRecorder</td><td>365 lines</td><td>178 lines</td><td>WaveformVisualizer, RecordingControls, useAudioRecorder</td></tr>
<tr><td>Sidebar</td><td>352 lines</td><td>195 lines</td><td>ChannelList, ServerHeader, useSidebarState</td></tr>
</tbody>
</table>

<h3>Type Safety: 56 @spec Annotations</h3>

<p>We audited every public function across the 8 refactored modules and added <code>@spec</code> annotations to all 56 public-facing functions. Combined with Dialyzer, this gives us compile-time type checking on all module boundaries.</p>

<h3>Soft Delete Audit</h3>

<p>All 45 <code>Repo.delete</code> calls were reviewed against our soft delete policy. Messages, channels, and user-generated content use <code>deleted_at</code> timestamps for recoverability. Only ephemeral data (typing indicators, presence records, expired tokens) uses hard deletes — all documented and approved.</p>

<h3>Documentation Sync</h3>

<p>Every documentation file was audited and updated: broken file references fixed across 8 files, architecture scores updated (9.0 → 9.4/10), feature module counts corrected (51 → 59), version numbers synchronized across all 6 packages. The <code>CURRENT_STATE_DASHBOARD.md</code> now includes the full sub-module tree.</p>

<h3>Architecture Health Score: 9.4/10</h3>

<p>With Phase 11 complete, the project scores:</p>

<ul>
<li><strong>Backend</strong>: 0 / 63 modules over 500-line limit (was 8)</li>
<li><strong>Frontend</strong>: 0 / 47 components over 300-line limit (was 5)</li>
<li><strong>Type coverage</strong>: 56 new @spec annotations on refactored modules</li>
<li><strong>Soft delete compliance</strong>: 45/45 calls audited and documented</li>
<li><strong>Documentation</strong>: 100% file reference accuracy, versions synchronized</li>
</ul>

<p>The full release notes are available in the <a href="/docs">documentation</a>. Next up: Phase 12 focuses on performance profiling, database query optimization, and preparing the infrastructure for public beta load testing.</p>
`,
  },
  'platform-parity': {
    title: 'Platform Parity: 17/17 Features on Web & Mobile',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 8, 2026',
    readTime: '6 min read',
    image: '🎯',
    tags: ['React Native', 'Reanimated v4', 'Testing'],
    content: `
<p>With the release of v0.9.13 and v0.9.14, CGraph has achieved a milestone we've been pushing toward for months: <strong>full feature parity between the web and mobile platforms</strong>. Every single feature available on the web app is now fully functional on iOS and Android — 17 out of 17 feature modules, zero gaps.</p>

<h3>The Full Feature Matrix</h3>

<p>Achieving platform parity isn't just about ticking boxes — it means every feature works with the same reliability, the same UX patterns (adapted to mobile conventions), and the same underlying data layer. Here's what's covered:</p>

<table>
<thead><tr><th>Feature Module</th><th>Web</th><th>Mobile</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>Real-time Messaging</td><td>✅</td><td>✅</td><td>WebSocket via Phoenix Channels</td></tr>
<tr><td>End-to-End Encryption</td><td>✅</td><td>✅</td><td>Triple Ratchet (PQXDH + ML-KEM-768)</td></tr>
<tr><td>Forums / Threads</td><td>✅</td><td>✅</td><td>Nested discussions</td></tr>
<tr><td>Voice Calls</td><td>✅</td><td>✅</td><td>WebRTC with TURN fallback</td></tr>
<tr><td>Video Calls</td><td>✅</td><td>✅</td><td>WebRTC with adaptive bitrate</td></tr>
<tr><td>Screen Sharing</td><td>✅</td><td>✅</td><td>Desktop + mobile screen capture</td></tr>
<tr><td>User Profiles</td><td>✅</td><td>✅</td><td>Avatars, bios, status</td></tr>
<tr><td>Gamification / XP</td><td>✅</td><td>✅</td><td>RPG-style leveling, achievements</td></tr>
<tr><td>Marketplace</td><td>✅</td><td>✅</td><td>Virtual currency + item trading</td></tr>
<tr><td>Settings &amp; Preferences</td><td>✅</td><td>✅</td><td>Theme, notifications, privacy</td></tr>
<tr><td>Community Management</td><td>✅</td><td>✅</td><td>Roles, permissions, moderation</td></tr>
<tr><td>File Sharing</td><td>✅</td><td>✅</td><td>Drag-drop on web, picker on mobile</td></tr>
<tr><td>Notifications</td><td>✅</td><td>✅</td><td>Push + in-app</td></tr>
<tr><td>Search</td><td>✅</td><td>✅</td><td>Full-text across messages &amp; forums</td></tr>
<tr><td>Authentication</td><td>✅</td><td>✅</td><td>OAuth, email/password, biometric on mobile</td></tr>
<tr><td>Subscription / Billing</td><td>✅</td><td>✅</td><td>Stripe integration</td></tr>
<tr><td>Admin Dashboard</td><td>✅</td><td>✅</td><td>Server stats, user management</td></tr>
</tbody>
</table>

<h3>Reanimated v4 Migration: 222 → 0 TypeScript Errors</h3>

<p>The biggest hurdle in reaching mobile parity was the migration from Reanimated v2/v3 to <strong>Reanimated v4</strong>. The initial upgrade broke 222 TypeScript type-check errors across the animation layer. Every animated component — from the chat message appear animation to the gamification XP bar — needed to be rewritten against the new shared value API.</p>

<p>Key changes in the Reanimated v4 migration:</p>
<ul>
<li><strong>useSharedValue</strong> type signatures became stricter — no more implicit <code>any</code> on animated values</li>
<li><strong>useAnimatedStyle</strong> now requires explicit return types matching the style object</li>
<li><strong>Layout animations</strong> were refactored to use the new <code>LinearTransition</code> and <code>FadingTransition</code> APIs</li>
<li><strong>Gesture handler</strong> integration was updated for Reanimated v4's worklet threading model</li>
</ul>

<p>The migration took two focused sprints. We created a codemod script (<code>scripts/codemod-springs.mjs</code>) that handled 80% of the mechanical transformations — converting old spring configs to the new <code>withSpring</code> syntax and updating <code>useAnimatedGestureHandler</code> calls. The remaining 20% required manual intervention for complex composed animations.</p>

<h3>Test Coverage: 1,342 Passing Tests</h3>

<p>Platform parity means nothing without confidence. Our test suite now includes <strong>1,342 passing tests</strong> across unit, integration, and facade layers:</p>

<ul>
<li><strong>132 facade tests</strong> — ensuring every store facade (Auth, Chat, Gamification, Settings, Community, Marketplace, UI) correctly composes from underlying stores</li>
<li><strong>192 E2EE tests</strong> — comprehensive Triple Ratchet test suite covering PQXDH key exchange, hybrid ratcheting, post-quantum forward secrecy, adversarial scenarios, and stress testing</li>
<li><strong>200+ component tests</strong> — rendering, interaction, and accessibility tests for shared UI components</li>
<li><strong>Platform-specific tests</strong> — mobile gesture handlers, navigation flows, and native module mocks</li>
</ul>

<h3>Architecture Score: 9.0/10</h3>

<p>Our internal architecture scoring system evaluates module boundaries, dependency direction, API surface cleanliness, and test coverage ratios. With platform parity complete, we've reached <strong>9.0 out of 10</strong> — up from 4.2 just weeks ago. The remaining points are tracked for optimization: reducing a few remaining cross-module imports and adding integration tests for the WebRTC layer.</p>

<h4>What's Next</h4>

<p>With parity achieved, the focus shifts to <strong>performance optimization</strong> and <strong>polish</strong>. Mobile startup time is being profiled with Flipper, and we're targeting sub-2-second cold starts on mid-range Android devices. The shared animation constants package (<code>@cgraph/animation-constants</code>) ensures visual consistency across platforms without runtime overhead.</p>

<p>v0.9.15 will focus on the landing site enhancements and preparing the documentation for the public beta launch.</p>
`,
  },

  'architecture-transformation': {
    title: 'Architecture Transformation: From 4.2 to 9.0',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 2, 2026',
    readTime: '12 min read',
    image: '🏗️',
    tags: ['Architecture', 'Zustand', 'Modules'],
    content: `
<p>When we started CGraph, the codebase grew organically. Features were added where they fit, stores proliferated without boundaries, and cross-cutting concerns leaked through every layer. Our architecture scoring tool rated us at <strong>4.2 out of 10</strong>. This is the story of how we restructured the entire application into a clean, modular system and reached <strong>9.0/10</strong>.</p>

<h3>The Problem: Architectural Debt</h3>

<p>By late January 2026, the symptoms were unmistakable:</p>

<ul>
<li><strong>32 scattered Zustand stores</strong> with overlapping concerns — three different stores touched message state</li>
<li><strong>No clear module boundaries</strong> — a settings component imported directly from the chat store</li>
<li><strong>God components</strong> — <code>Settings.tsx</code> was 1,172 lines, <code>SocketManager.ts</code> was 960 lines</li>
<li><strong>Circular dependencies</strong> detected in 7 places by our build tooling</li>
<li><strong>No facade layer</strong> — every component reached directly into store internals</li>
</ul>

<h3>The Solution: 12 Feature Modules + 7 Facades</h3>

<p>We adopted a <strong>Modular system</strong>, where each domain owns its state, hooks, components, and types. The restructuring created 12 feature modules:</p>

<pre><code>src/
├── modules/
│   ├── auth/           # Authentication, session, OAuth
│   ├── chat/           # Messaging, channels, DMs, reactions
│   ├── community/      # Servers, roles, permissions, moderation
│   ├── e2ee/           # Triple Ratchet / PQXDH, key management
│   ├── forums/         # Threads, posts, nested comments
│   ├── gamification/   # XP, levels, achievements, leaderboards
│   ├── marketplace/    # Items, currency, transactions
│   ├── media/          # Voice, video, screen sharing (WebRTC)
│   ├── notifications/  # Push, in-app, preferences
│   ├── profiles/       # User profiles, avatars, status
│   ├── search/         # Full-text search, filters
│   └── settings/       # App preferences, theme, privacy
├── facades/
│   ├── useAuth.ts
│   ├── useChat.ts
│   ├── useCommunity.ts
│   ├── useGamification.ts
│   ├── useMarketplace.ts
│   ├── useSettings.ts
│   └── useUI.ts
└── shared/
    └── ui/             # 90+ reusable components</code></pre>

<h3>The Facade Pattern</h3>

<p>The key architectural decision was introducing <strong>7 facade hooks</strong> that sit between components and stores. Instead of components importing from <code>useMessageStore</code>, <code>useChannelStore</code>, and <code>usePresenceStore</code> individually, they use a single <code>useChat()</code> facade that composes all chat-related state:</p>

<pre><code>// Before: Components reaching into multiple stores
const messages = useMessageStore(s =&gt; s.messages);
const channels = useChannelStore(s =&gt; s.channels);
const typing = usePresenceStore(s =&gt; s.typingUsers);
const sendMessage = useMessageStore(s =&gt; s.sendMessage);

// After: Single facade with clean API
const { messages, channels, typingUsers, sendMessage } = useChat();</code></pre>

<p>This pattern provides several benefits:</p>

<ul>
<li><strong>Encapsulation</strong> — Store internals can change without affecting components</li>
<li><strong>Testing</strong> — Facades are testable units with 132 dedicated tests</li>
<li><strong>Discoverability</strong> — Developers know exactly which facade to use for each feature</li>
<li><strong>Performance</strong> — Facades use Zustand selectors to minimize re-renders</li>
</ul>

<h3>32 Stores → 7 Facades: The Consolidation</h3>

<p>The 32 original stores mapped to 7 facades as follows:</p>

<table>
<thead><tr><th>Facade</th><th>Stores Consolidated</th><th>Tests</th></tr></thead>
<tbody>
<tr><td>useAuth</td><td>authStore, sessionStore, oauthStore, tokenStore</td><td>18</td></tr>
<tr><td>useChat</td><td>messageStore, channelStore, dmStore, reactionStore, presenceStore, threadStore</td><td>24</td></tr>
<tr><td>useGamification</td><td>xpStore, levelStore, achievementStore, leaderboardStore</td><td>16</td></tr>
<tr><td>useSettings</td><td>preferencesStore, themeStore, notificationSettingsStore, privacyStore</td><td>14</td></tr>
<tr><td>useCommunity</td><td>serverStore, roleStore, permissionStore, moderationStore, memberStore</td><td>20</td></tr>
<tr><td>useMarketplace</td><td>itemStore, currencyStore, transactionStore, inventoryStore</td><td>12</td></tr>
<tr><td>useUI</td><td>modalStore, sidebarStore, toastStore, layoutStore, navigationStore</td><td>28</td></tr>
</tbody>
</table>

<h3>90+ Shared UI Components</h3>

<p>During the restructuring, we extracted over <strong>90 reusable UI components</strong> into the shared layer. These include primitives like <code>Button</code>, <code>Input</code>, <code>Avatar</code>, and <code>Badge</code>, as well as composed components like <code>MessageBubble</code>, <code>ChannelList</code>, and <code>UserCard</code>. Each component is platform-agnostic, with web and mobile renderers consuming the same props interface.</p>

<h3>Measuring the Transformation</h3>

<p>Our architecture scoring evaluates five dimensions:</p>

<ul>
<li><strong>Module Isolation</strong> (before: 3/10, after: 9/10) — Cross-module imports reduced by 94%</li>
<li><strong>API Surface</strong> (before: 4/10, after: 9/10) — Clean facade boundaries</li>
<li><strong>Test Coverage</strong> (before: 5/10, after: 9/10) — 132 facade tests + 200+ component tests</li>
<li><strong>Dependency Direction</strong> (before: 3/10, after: 9/10) — No circular dependencies</li>
<li><strong>Code Organization</strong> (before: 6/10, after: 9/10) — Consistent module structure</li>
</ul>

<p>The overall score moved from <strong>4.2 to 9.0</strong> — a transformation that took three focused sprints but fundamentally changed how the team works with the codebase.</p>
`,
  },

  'e2ee-test-suite': {
    title: 'E2EE Test Suite: 192 Tests for Triple Ratchet Protocol',
    category: 'Security',
    author: 'Burca Lucas',
    date: 'February 1, 2026',
    readTime: '10 min read',
    image: '🔐',
    tags: ['E2EE', 'Triple Ratchet', 'Post-Quantum', 'Testing'],
    content: `
<p>End-to-end encryption is the most security-critical component in CGraph. Our implementation uses the <strong>Triple Ratchet protocol</strong> — a post-quantum hybrid cryptographic protocol based on Signal Protocol Revision 4. Implementation correctness requires rigorous testing. We built a comprehensive test suite of <strong>192 tests</strong> across 14 files that validate every layer of the cryptographic stack.</p>

<h3>The Cryptographic Stack</h3>

<p>CGraph's E2EE implementation relies on five core primitives:</p>

<table>
<thead><tr><th>Primitive</th><th>Algorithm</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td>Key Agreement</td><td>PQXDH (P-256 ECDH + ML-KEM-768)</td><td>Hybrid post-quantum key exchange</td></tr>
<tr><td>Symmetric Encryption</td><td>AES-256-GCM</td><td>Encrypt/decrypt message payloads</td></tr>
<tr><td>Signing</td><td>Ed25519</td><td>Identity key signatures, prekey signatures</td></tr>
<tr><td>Key Derivation</td><td>HKDF-SHA256</td><td>Derive encryption keys from shared secrets</td></tr>
</tbody>
</table>

<h3>PQXDH Key Exchange Tests (8 Tests)</h3>

<p>The Post-Quantum Extended Diffie-Hellman (PQXDH) protocol establishes a hybrid shared secret using both classical P-256 ECDH and post-quantum ML-KEM-768, without requiring both parties to be online simultaneously. Our test suite validates:</p>

<ul>
<li><strong>Identity key pair generation</strong> — Ed25519 keys are generated with proper entropy</li>
<li><strong>Signed prekey generation</strong> — P-256 prekeys signed by the identity key</li>
<li><strong>One-time prekey bundles</strong> — Ephemeral keys consumed correctly (no reuse)</li>
<li><strong>Key agreement computation</strong> — All four DH operations (DH1-DH4) produce correct shared secrets</li>
<li><strong>Bundle serialization</strong> — Prekey bundles serialize/deserialize without data loss</li>
<li><strong>Invalid bundle rejection</strong> — Malformed or tampered bundles are rejected</li>
<li><strong>Missing one-time prekey fallback</strong> — Sessions still establish without OTPs (3-DH fallback)</li>
<li><strong>Cross-device key agreement</strong> — Same identity, different devices, correct session creation</li>
</ul>

<pre><code>// Example: PQXDH Key Agreement Test
describe('PQXDH Key Exchange', () =&gt; {
  it('should establish matching shared secrets', async () =&gt; {
    const alice = await generateIdentityKeyPair();
    const bob = await generateIdentityKeyPair();
    const bobBundle = await createPrekeyBundle(bob);

    const aliceSession = await initiatePQXDH(alice, bobBundle);
    const bobSession = await respondPQXDH(bob, aliceSession.ephemeralKey);

    expect(aliceSession.sharedSecret).toEqual(bobSession.sharedSecret);
    expect(aliceSession.sharedSecret.length).toBe(32);
  });
});</code></pre>

<h3>Triple Ratchet Tests (10 Tests)</h3>

<p>The Triple Ratchet algorithm provides forward secrecy and break-in recovery for ongoing message exchanges, combining an EC Double Ratchet with a post-quantum SPQR ratchet via KDF_HYBRID. Each message uses a unique key derived from the hybrid ratcheting state. Our tests cover:</p>

<ul>
<li><strong>Symmetric ratchet step</strong> — Each message advances the chain key and derives a unique message key</li>
<li><strong>DH ratchet step</strong> — New DH key pairs are introduced when message direction changes</li>
<li><strong>Out-of-order message decryption</strong> — Messages received out of order decrypt correctly</li>
<li><strong>Skipped message keys</strong> — Keys for skipped messages are cached (up to configurable limit)</li>
<li><strong>Forward secrecy verification</strong> — Compromised current keys cannot decrypt past messages</li>
<li><strong>Break-in recovery</strong> — After key compromise, new DH ratchet restores security</li>
<li><strong>Chain length limits</strong> — Ratchet doesn't degrade over 1,000+ message chains</li>
<li><strong>Concurrent ratcheting</strong> — Two parties ratcheting simultaneously converge correctly</li>
<li><strong>Session state serialization</strong> — Ratchet state persists across app restarts</li>
<li><strong>Maximum skip threshold</strong> — Excessive message gaps are rejected to prevent DoS</li>
</ul>

<h3>Ciphertext Integrity Tests (6 Tests)</h3>

<p>These tests ensure that the encryption layer is airtight:</p>

<ul>
<li><strong>Ciphertext randomization</strong> — Same plaintext encrypted twice produces different ciphertext (AES-GCM nonce uniqueness)</li>
<li><strong>Tampered ciphertext rejection</strong> — Flipping even a single bit in the ciphertext causes GCM authentication to fail</li>
<li><strong>Tampered nonce rejection</strong> — Modified nonces are detected and rejected</li>
<li><strong>Truncated ciphertext rejection</strong> — Incomplete ciphertext is rejected before decryption attempt</li>
<li><strong>Header integrity</strong> — Message headers (ratchet public key, chain index, previous chain length) are authenticated</li>
<li><strong>Replay attack prevention</strong> — Already-consumed message keys cannot be reused</li>
</ul>

<pre><code>// Example: Ciphertext Randomization Test
it('should produce different ciphertext for identical plaintext', async () =&gt; {
  const session = await createTestSession();
  const plaintext = 'Hello, this is a test message';

  const cipher1 = await encrypt(session, plaintext);
  const cipher2 = await encrypt(session, plaintext);

  expect(cipher1.body).not.toEqual(cipher2.body);
  expect(await decrypt(session, cipher1)).toBe(plaintext);
  expect(await decrypt(session, cipher2)).toBe(plaintext);
});</code></pre>

<h3>Integration Tests (4 Tests)</h3>

<p>End-to-end scenarios that test the full flow from key exchange through multi-message conversations:</p>

<ul>
<li><strong>Full conversation flow</strong> — Alice and Bob exchange 50 messages with interleaved sends</li>
<li><strong>Group encryption fan-out</strong> — Message encrypted for each group member's session individually</li>
<li><strong>Device trust verification</strong> — Safety number comparison between two parties</li>
<li><strong>Key rotation on identity change</strong> — New identity keys invalidate existing sessions with proper warning</li>
</ul>

<h4>Running the Suite</h4>

<p>The E2EE test suite runs in isolation with deterministic random seeds to ensure reproducibility. All 28 tests complete in under 3 seconds on CI, with no network dependencies — all cryptographic operations happen in-process using the <code>@cgraph/crypto</code> package.</p>
`,
  },

  'store-consolidation': {
    title: 'Store Consolidation: 32 Stores → 7 Facades',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 1, 2026',
    readTime: '8 min read',
    image: '⚙️',
    tags: ['Zustand', 'State Management', 'Facades'],
    content: `
<p>State management can make or break a complex application. CGraph had grown to <strong>32 individual Zustand stores</strong> — each one solving a real problem, but collectively creating an unmaintainable web of dependencies. We consolidated them into <strong>7 facade hooks</strong> using Composition patterns. Here's how.</p>

<h3>The State Management Problem</h3>

<p>With 32 stores, components were importing from an average of 3-4 stores each. The problems compounded:</p>

<ul>
<li><strong>Import overhead</strong> — A single chat message component imported from <code>useMessageStore</code>, <code>usePresenceStore</code>, <code>useReactionStore</code>, and <code>useUserStore</code></li>
<li><strong>State synchronization</strong> — Related state lived in different stores with no coordination layer</li>
<li><strong>Testing burden</strong> — Mocking 4 stores for every component test was tedious and fragile</li>
<li><strong>Naming collisions</strong> — Multiple stores exported similarly named selectors (<code>getById</code>, <code>setLoading</code>)</li>
<li><strong>Re-render cascades</strong> — Without careful selector use, subscribing to multiple stores caused unnecessary re-renders</li>
</ul>

<h3>The Facade Pattern in Practice</h3>

<p>The facade pattern wraps multiple stores behind a single, focused API. Each facade is a custom hook that composes from its underlying stores using Zustand's <code>useStore</code> with shallow equality selectors:</p>

<pre><code>// facades/useChat.ts
import { useShallow } from 'zustand/react/shallow';
import { useMessageStore } from '../modules/chat/stores/messageStore';
import { useChannelStore } from '../modules/chat/stores/channelStore';
import { usePresenceStore } from '../modules/chat/stores/presenceStore';
import { useReactionStore } from '../modules/chat/stores/reactionStore';

export function useChat() {
  const messages = useMessageStore(useShallow(s =&gt; ({
    list: s.messages,
    send: s.sendMessage,
    edit: s.editMessage,
    delete: s.deleteMessage,
    loading: s.isLoading,
  })));

  const channels = useChannelStore(useShallow(s =&gt; ({
    list: s.channels,
    active: s.activeChannel,
    setActive: s.setActiveChannel,
  })));

  const presence = usePresenceStore(useShallow(s =&gt; ({
    typingUsers: s.typingUsers,
    onlineUsers: s.onlineUsers,
  })));

  const reactions = useReactionStore(useShallow(s =&gt; ({
    forMessage: s.getReactionsForMessage,
    add: s.addReaction,
    remove: s.removeReaction,
  })));

  return { messages, channels, presence, reactions };
}</code></pre>

<h3>The Seven Facades</h3>

<h4>1. useAuth — Authentication &amp; Session</h4>
<p>Composes <code>authStore</code>, <code>sessionStore</code>, <code>oauthStore</code>, and <code>tokenStore</code>. Exposes login, logout, token refresh, OAuth flows, and session state. 18 tests validate authentication flows including token expiration, refresh races, and OAuth callback handling.</p>

<h4>2. useChat — Messaging &amp; Channels</h4>
<p>The largest facade, composing 6 stores. Handles messages, channels, DMs, reactions, presence, and threading. 24 tests cover message CRUD, optimistic updates, real-time sync, and reaction toggling.</p>

<h4>3. useGamification — XP &amp; Achievements</h4>
<p>Composes <code>xpStore</code>, <code>levelStore</code>, <code>achievementStore</code>, and <code>leaderboardStore</code>. Exposes XP tracking, level progression, achievement unlocking, and leaderboard queries. 16 tests verify XP calculations and level-up triggers.</p>

<h4>4. useSettings — Preferences &amp; Privacy</h4>
<p>Composes <code>preferencesStore</code>, <code>themeStore</code>, <code>notificationSettingsStore</code>, and <code>privacyStore</code>. Manages all user preferences with persistence. 14 tests validate theme switching, notification preferences, and privacy setting enforcement.</p>

<h4>5. useCommunity — Servers &amp; Moderation</h4>
<p>Composes 5 stores for server management, roles, permissions, moderation actions, and member lists. 20 tests cover role-based access control, permission inheritance, and moderation workflows.</p>

<h4>6. useMarketplace — Commerce</h4>
<p>Composes <code>itemStore</code>, <code>currencyStore</code>, <code>transactionStore</code>, and <code>inventoryStore</code>. Handles the virtual marketplace with item listings, purchases, and inventory management. 12 tests validate transaction integrity and currency balance updates.</p>

<h4>7. useUI — Interface State</h4>
<p>Composes <code>modalStore</code>, <code>sidebarStore</code>, <code>toastStore</code>, <code>layoutStore</code>, and <code>navigationStore</code>. Manages all ephemeral UI state — modals, sidebars, toasts, and layout preferences. 28 tests ensure UI state transitions are predictable.</p>

<h3>Testing the Facades</h3>

<p>Each facade has dedicated tests using <code>@testing-library/react-hooks</code>. The 25 facade-specific tests (plus per-facade unit tests totaling 132) ensure that:</p>

<ul>
<li>Facades expose the correct API surface</li>
<li>State changes in underlying stores propagate through the facade</li>
<li>Selectors prevent unnecessary re-renders (tested with render counters)</li>
<li>Error states from any composed store surface correctly</li>
</ul>

<h3>Results</h3>

<p>The consolidation reduced component import complexity by <strong>73%</strong>, test setup boilerplate by <strong>60%</strong>, and eliminated all naming collisions. More importantly, it created clean API boundaries that make the codebase navigable for any developer — you don't need to know which of 32 stores holds the data you need; you just use the right facade.</p>
`,
  },

  'code-simplification': {
    title: 'Code Simplification Sprint: console.log 325 → 2',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'January 30, 2026',
    readTime: '7 min read',
    image: '✨',
    tags: ['Code Quality', 'TypeScript', 'Refactoring'],
    content: `
<p>Technical debt doesn't announce itself. It accumulates in <code>console.log</code> statements left from debugging, in <code>as any</code> casts added to "fix it later," and in god-files that grew because nobody wanted to split them. Our code simplification sprint tackled all of it in one focused week.</p>

<h3>The Numbers</h3>

<table>
<thead><tr><th>Metric</th><th>Before</th><th>After</th><th>Reduction</th></tr></thead>
<tbody>
<tr><td>console.log calls</td><td>325</td><td>2</td><td>99.4%</td></tr>
<tr><td><code>as any</code> type casts</td><td>27</td><td>1</td><td>96.3%</td></tr>
<tr><td>Settings.tsx lines</td><td>1,172</td><td>221</td><td>81.1%</td></tr>
<tr><td>SocketManager.ts lines</td><td>960</td><td>616</td><td>35.8%</td></tr>
</tbody>
</table>

<h3>console.log: 325 → 2</h3>

<p>325 <code>console.log</code> statements were scattered across the codebase. Most were debugging artifacts — developers logging message payloads, WebSocket events, store state transitions, and API responses during development. The problem wasn't just noise in production; it was a security risk. Two logs were printing decrypted message content, and one was logging OAuth tokens.</p>

<p>We replaced all meaningful logs with a <strong>structured logging system</strong> using correlation IDs:</p>

<pre><code>// Before: Scattered console.log calls
console.log('Message sent:', message);
console.log('WebSocket connected');
console.log('Auth token refreshed:', token);

// After: Structured logging with correlation IDs
import { logger } from '@cgraph/utils/logger';

logger.info('message.sent', {
  correlationId: ctx.correlationId,
  channelId: message.channelId,
  encrypted: true,
});

logger.debug('websocket.connected', {
  correlationId: ctx.correlationId,
  endpoint: config.wsEndpoint,
});

logger.info('auth.token_refreshed', {
  correlationId: ctx.correlationId,
  expiresIn: token.expiresIn,
});</code></pre>

<p>The structured logger supports log levels (debug, info, warn, error), outputs JSON in production for log aggregation, and <strong>never</strong> logs sensitive data. A custom ESLint rule now prevents <code>console.log</code> from being committed.</p>

<p>The 2 remaining <code>console.log</code> calls are in third-party integration shims where the library API expects a console-compatible logger interface.</p>

<h3>as any: 27 → 1</h3>

<p>Every <code>as any</code> is a lie to the type system. Our 27 instances fell into three categories:</p>

<ul>
<li><strong>Event handler mismatches</strong> (12 instances) — Fixed by adding proper event type generics</li>
<li><strong>Third-party library types</strong> (9 instances) — Fixed by adding <code>@types</code> packages or writing declaration files</li>
<li><strong>Dynamic data from API</strong> (6 instances) — Fixed by adding Zod schema validation at API boundaries</li>
</ul>

<pre><code>// Before: as any to silence TypeScript
const data = response.data as any;
handleMessage(data.content);

// After: Zod schema validation
import { messageSchema } from '@cgraph/shared-types';
const result = messageSchema.safeParse(response.data);
if (result.success) {
  handleMessage(result.data.content);
} else {
  logger.warn('message.parse_failed', { errors: result.error.issues });
}</code></pre>

<p>The single remaining <code>as any</code> is in a WebRTC adapter layer where the browser API types are intentionally loose between Chrome and Firefox implementations.</p>

<h3>Settings.tsx: 1,172 → 221 Lines</h3>

<p><code>Settings.tsx</code> had become a god-component. It rendered every settings panel inline — appearance, notifications, privacy, account, security, accessibility — all in one file with one massive switch statement. We extracted it into a route-based settings module:</p>

<pre><code>settings/
├── SettingsLayout.tsx       # Shell with sidebar navigation (221 lines)
├── panels/
│   ├── AppearancePanel.tsx  # Theme, colors, font size
│   ├── NotificationPanel.tsx # Push, email, in-app preferences
│   ├── PrivacyPanel.tsx     # Visibility, blocking, data controls
│   ├── AccountPanel.tsx     # Email, password, 2FA, delete account
│   ├── SecurityPanel.tsx    # Active sessions, E2EE keys
│   └── AccessibilityPanel.tsx # Reduced motion, screen reader
└── hooks/
    └── useSettingsNavigation.ts</code></pre>

<p>Each panel is self-contained and lazily loaded. The settings sidebar navigation is the only component in <code>SettingsLayout.tsx</code>, now a clean 221-line orchestrator.</p>

<h3>SocketManager: 960 → 616 Lines (5 Modules)</h3>

<p>The original <code>SocketManager.ts</code> handled connection lifecycle, reconnection logic, channel subscriptions, presence tracking, and message routing — all in one file. We split it into 5 focused modules:</p>

<ul>
<li><strong>ConnectionManager.ts</strong> — WebSocket connection, heartbeat, reconnection with exponential backoff</li>
<li><strong>ChannelManager.ts</strong> — Phoenix Channel joins, leaves, and topic management</li>
<li><strong>PresenceManager.ts</strong> — Phoenix Presence syncing and diff handling</li>
<li><strong>MessageRouter.ts</strong> — Incoming message dispatch to appropriate stores</li>
<li><strong>SocketManager.ts</strong> — Orchestrator that composes the above services (616 lines, down from 960)</li>
</ul>

<p>The codemod script <code>scripts/codemod-structured-logging.mjs</code> automated the logging migration, while the component extractions were done manually with comprehensive test coverage at each step.</p>

<h4>Enforcing the Standards</h4>

<p>To prevent regression, we added ESLint rules: <code>no-console</code> with only <code>warn</code> and <code>error</code> allowed, <code>@typescript-eslint/no-explicit-any</code> set to error, and a custom file-length rule that warns at 300 lines and errors at 500. These gates are enforced in CI.</p>
`,
  },

  'dual-app-architecture': {
    title: 'Dual-App Architecture: Landing vs Web App',
    category: 'Architecture',
    author: 'Burca Lucas',
    date: 'January 27, 2026',
    readTime: '9 min read',
    image: '🌐',
    tags: ['Architecture', 'Performance', 'Vite'],
    content: `
<p>Most startups ship a single web application that handles everything — marketing pages, authentication, and the core product. This works fine at first, but creates a fundamental performance problem: visitors who just want to read your pricing page download megabytes of application code they'll never use. CGraph uses a <strong>dual-app architecture</strong> that cleanly separates concerns.</p>

<h3>The Two Applications</h3>

<table>
<thead><tr><th>Property</th><th>Landing (cgraph.org)</th><th>Web App (app.cgraph.org)</th></tr></thead>
<tbody>
<tr><td>Purpose</td><td>Marketing, docs, blog, legal</td><td>Full messaging application</td></tr>
<tr><td>Bundle Size</td><td>~200KB gzipped</td><td>~2MB gzipped</td></tr>
<tr><td>Framework</td><td>React + Vite</td><td>React + Vite</td></tr>
<tr><td>Routing</td><td>Static pages, no auth</td><td>62 lazy-loaded routes</td></tr>
<tr><td>State Management</td><td>Minimal (form state only)</td><td>7 Zustand facades, 32 stores</td></tr>
<tr><td>Real-time</td><td>None</td><td>Phoenix Channels WebSocket</td></tr>
<tr><td>E2EE</td><td>None</td><td>Full Triple Ratchet / PQXDH</td></tr>
<tr><td>Build Chunks</td><td>12 chunks</td><td>168 optimized chunks</td></tr>
<tr><td>TTI (3G)</td><td>&lt;2s</td><td>&lt;5s</td></tr>
</tbody>
</table>

<h3>Why Separate?</h3>

<p>The decision was driven by three factors:</p>

<h4>1. Performance Budget</h4>
<p>The landing site targets a <strong>200KB total transfer budget</strong>. This includes HTML, CSS, JavaScript, fonts, and above-the-fold images. A sub-2-second Time to Interactive on a 3G connection is the bar. This is impossible if the landing page shares a bundle with the E2EE crypto library (which alone is ~180KB), the Zustand state layer, or the WebRTC stack.</p>

<h4>2. SEO and Crawlability</h4>
<p>Marketing pages need to be statically renderable and crawlable. The landing site uses Vite with server-side rendering hints and prerendered routes. The web app is a client-side SPA that requires authentication — it's invisible (and should be) to search engines.</p>

<h4>3. Deployment Independence</h4>
<p>The landing site deploys to Vercel with global edge caching and automatic preview deployments. The web app also deploys to Vercel with serverless functions for API proxying. They have independent CI pipelines, independent release cycles, and can be updated without affecting each other.</p>

<h3>The Monorepo Structure</h3>

<p>Both applications live in the same pnpm monorepo, sharing packages where appropriate:</p>

<pre><code>CGraph/
├── apps/
│   ├── landing/          # cgraph.org - Marketing site
│   │   ├── src/
│   │   │   ├── pages/    # Marketing pages (blog, pricing, legal)
│   │   │   ├── components/marketing/  # Shared marketing components
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   ├── web/              # app.cgraph.org - Full application
│   │   ├── src/
│   │   │   ├── modules/  # 12 feature modules
│   │   │   ├── facades/  # 7 facade hooks
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   └── mobile/           # React Native app
├── packages/
│   ├── shared-types/     # TypeScript interfaces (both apps)
│   ├── ui/               # Shared UI primitives
│   ├── animation-constants/  # Shared springs/durations
│   └── config/           # Shared configuration
└── turbo.json            # Turborepo orchestration</code></pre>

<h3>62 Lazy-Loaded Pages</h3>

<p>The web app uses React's <code>lazy()</code> with Suspense for every route. Combined with Vite's chunk splitting, this means users only download the code for the page they're viewing:</p>

<pre><code>// Web app route definitions (simplified)
const ChatPage = lazy(() =&gt; import('./modules/chat/pages/ChatPage'));
const ForumPage = lazy(() =&gt; import('./modules/forums/pages/ForumPage'));
const MarketplacePage = lazy(() =&gt; import('./modules/marketplace/pages/MarketplacePage'));
const SettingsPage = lazy(() =&gt; import('./modules/settings/pages/SettingsLayout'));
// ... 62 total routes</code></pre>

<h3>168 Optimized Build Chunks</h3>

<p>Vite's Rollup-based build produces 168 chunks for the web app. We configured manual chunk splitting to optimize for common navigation patterns:</p>

<ul>
<li><strong>Vendor chunks</strong> — React, Zustand, and framer-motion in a shared vendor chunk (cached across pages)</li>
<li><strong>Module chunks</strong> — Each feature module gets its own chunk group</li>
<li><strong>Crypto chunk</strong> — E2EE library isolated so it's only loaded when encryption is needed</li>
<li><strong>WebRTC chunk</strong> — Voice/video code loaded on-demand when a call starts</li>
</ul>

<h3>Shared Packages</h3>

<p>Despite being separate apps, they share several packages through the monorepo:</p>

<ul>
<li><strong>@cgraph/shared-types</strong> — TypeScript interfaces used by both frontend and the Elixir API client</li>
<li><strong>@cgraph/ui</strong> — Base UI components (buttons, inputs) with consistent styling</li>
<li><strong>@cgraph/animation-constants</strong> — Spring configs and duration values for consistent motion</li>
<li><strong>@cgraph/config</strong> — Shared environment configuration and feature flags</li>
</ul>

<p>This architecture pattern — common in enterprise-grade applications — gives us the best of both worlds: a blazing-fast marketing presence and a feature-rich application, each optimized for its specific use case.</p>
`,
  },

  'critical-security-fixes': {
    title: 'Critical Security Fixes: E2EE Plaintext Fallback',
    category: 'Security',
    author: 'Burca Lucas',
    date: 'January 27, 2026',
    readTime: '8 min read',
    image: '🛡️',
    tags: ['Security', 'E2EE', 'Vulnerability'],
    content: `
<p>On January 25, 2026, during a routine security audit, we discovered a <strong>critical vulnerability</strong> in CGraph's E2EE implementation: under specific failure conditions, messages could silently fall back to unencrypted delivery without notifying the sender. This post details the vulnerability, the fix, and four additional security issues we resolved in the same sprint.</p>

<h3>CVE-Level: E2EE Plaintext Fallback</h3>

<h4>The Vulnerability</h4>
<p>When the Triple Ratchet session between two users was in a corrupted state — for example, after a failed key ratchet or a deserialization error — the encryption layer threw an exception. The message-sending code caught this exception in a generic try/catch block and, instead of aborting the send, fell back to sending the message <strong>as plaintext</strong> through the normal channel. The message was delivered successfully, the UI showed a "sent" confirmation, and neither party was informed that encryption had failed.</p>

<pre><code>// VULNERABLE CODE (removed)
try {
  const encrypted = await signalSession.encrypt(plaintext);
  await channel.push('message:send', { body: encrypted, encrypted: true });
} catch (error) {
  // BUG: Silent fallback to plaintext!
  await channel.push('message:send', { body: plaintext, encrypted: false });
}</code></pre>

<h4>The Impact</h4>
<p>This vulnerability meant that an attacker who could trigger session corruption — for example, by tampering with prekey bundles or causing desync through message replay — could force plaintext delivery. The server would receive and store unencrypted messages, completely defeating the E2EE guarantee.</p>

<h4>The Fix</h4>
<p>The fix was straightforward but critical: <strong>never fall back to plaintext</strong>. If encryption fails, the message send is aborted, the user is notified of the error, and a session re-establishment is triggered:</p>

<pre><code>// FIXED: Encryption failure aborts the send
try {
  const encrypted = await signalSession.encrypt(plaintext);
  await channel.push('message:send', { body: encrypted, encrypted: true });
} catch (error) {
  logger.error('e2ee.encrypt_failed', {
    correlationId: ctx.correlationId,
    errorType: error.constructor.name,
  });
  // Notify user and trigger session re-establishment
  throw new EncryptionFailedError(
    'Message could not be encrypted. Attempting to re-establish secure session.'
  );
}</code></pre>

<p>Additionally, the server now <strong>rejects any message marked <code>encrypted: false</code></strong> on channels that have E2EE enabled. This server-side validation provides defense-in-depth.</p>

<h3>Additional Security Fixes</h3>

<h4>1. Presence Privacy Leak</h4>
<p>The Phoenix Presence system was broadcasting online/offline status to all channel members, including users who had set their visibility to "invisible." The fix filters presence broadcasts through the user's privacy settings before emission:</p>
<ul>
<li><strong>Severity:</strong> Medium</li>
<li><strong>Impact:</strong> Users who set "invisible" status were still visible to other members</li>
<li><strong>Fix:</strong> Server-side presence filtering in the Phoenix Channel join callback</li>
</ul>

<h4>2. Stripe Webhook Misconfiguration</h4>
<p>The Stripe webhook endpoint was not verifying the <code>stripe-signature</code> header, allowing any HTTP client to forge subscription events. An attacker could have granted themselves premium features by sending a crafted <code>checkout.session.completed</code> event.</p>
<ul>
<li><strong>Severity:</strong> High</li>
<li><strong>Impact:</strong> Subscription tier spoofing, revenue loss</li>
<li><strong>Fix:</strong> Added <code>Stripe.Webhook.constructEvent()</code> signature verification with the webhook signing secret</li>
</ul>

<h4>3. IP Spoofing via X-Forwarded-For</h4>
<p>The rate limiter was reading the client IP from the <code>X-Forwarded-For</code> header without validating the number of proxy hops. Behind our Cloudflare/fly.io proxy chain, clients could inject arbitrary IPs by adding extra entries to the header, bypassing rate limits entirely.</p>
<ul>
<li><strong>Severity:</strong> Medium</li>
<li><strong>Impact:</strong> Rate limit bypass, potential brute-force amplification</li>
<li><strong>Fix:</strong> Configured trusted proxy count and only read the IP at the correct position in the forwarded chain</li>
</ul>

<h4>4. MIME Type Spoofing in File Uploads</h4>
<p>File uploads relied solely on the client-provided <code>Content-Type</code> header for MIME type validation. An attacker could upload an HTML file with an <code>image/png</code> Content-Type, which would pass validation but render as HTML when served, enabling stored XSS.</p>
<ul>
<li><strong>Severity:</strong> High</li>
<li><strong>Impact:</strong> Stored XSS through file upload</li>
<li><strong>Fix:</strong> Server-side magic byte validation using the file's actual binary content. Files are also served with <code>Content-Disposition: attachment</code> and strict <code>Content-Security-Policy</code> headers.</li>
</ul>

<h4>Disclosure and Timeline</h4>
<p>All five vulnerabilities were fixed within 48 hours of discovery. No evidence of exploitation was found in server logs. The plaintext fallback vulnerability existed since the initial E2EE implementation in v0.8.x and persisted through v0.9.12. It was resolved in v0.9.13.</p>
`,
  },

  'why-elixir': {
    title: 'Why Elixir, Phoenix, and the BEAM VM',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'January 2026',
    readTime: '14 min read',
    image: '💜',
    tags: ['Elixir', 'Phoenix', 'Backend'],
    content: `
<p>When choosing a backend technology for a real-time communication platform, the stakes are high. The server needs to handle millions of concurrent connections, route messages with sub-100ms latency, and never go down for deployments. After evaluating Node.js, Go, Rust, and Elixir, we chose <strong>Elixir 1.17+ with Phoenix 1.8</strong> — a stack proven to handle millions of concurrent users.</p>

<h3>The BEAM VM: Built for Concurrency</h3>

<p>Elixir runs on the BEAM virtual machine, originally built for Ericsson's telephone switches in the 1980s. The BEAM was designed for systems that must never go down and must handle millions of simultaneous connections. These are exactly the requirements of a messaging platform.</p>

<p>Key BEAM properties that matter for CGraph:</p>

<ul>
<li><strong>Lightweight processes</strong> — BEAM processes use ~2KB of memory each. We can spawn millions of them on a single server. Each WebSocket connection gets its own process.</li>
<li><strong>Preemptive scheduling</strong> — The BEAM's reduction-based scheduler ensures no single process can starve others. A slow message send doesn't block other users.</li>
<li><strong>Fault isolation</strong> — A crash in one process doesn't affect any other. A corrupted message parse doesn't take down the server.</li>
<li><strong>Hot code reloading</strong> — Code can be upgraded while the system is running. Zero-downtime deployments are a first-class feature.</li>
</ul>

<h3>OTP Supervision Trees</h3>

<p>OTP (Open Telecom Platform) provides battle-tested patterns for building resilient systems. CGraph's supervision tree uses a combination of strategies:</p>

<pre><code>CGraph.Application (one_for_one)
├── CGraph.Repo (worker)
│   └── PostgreSQL connection pool
├── CGraph.Cache.Supervisor (rest_for_one)
│   ├── CGraph.Cache.ETS (worker)
│   ├── CGraph.Cache.Cachex (worker)
│   └── CGraph.Cache.Redis (worker)
├── CGraph.PubSub (worker)
│   └── Phoenix.PubSub with Redis adapter
├── CGraph.Endpoint (worker)
│   └── Phoenix HTTP + WebSocket endpoint
├── CGraph.Presence (worker)
│   └── Phoenix.Presence with CRDT state
└── CGraph.Workers.Supervisor (one_for_one)
    ├── CGraph.Workers.MessageProcessor (GenServer)
    ├── CGraph.Workers.NotificationDispatcher (GenServer)
    ├── CGraph.Workers.XPCalculator (GenServer)
    └── CGraph.Workers.AuditLogger (GenServer)</code></pre>

<p>The <code>one_for_one</code> strategy at the top level means if any major subsystem crashes, only that subsystem restarts — the rest of the application continues serving requests. The <code>rest_for_one</code> strategy on the cache supervisor ensures that if the ETS cache crashes, Cachex and Redis are also restarted to maintain consistency.</p>

<h3>PostgreSQL 16 with 91 Tables</h3>

<p>The data layer uses <strong>PostgreSQL 16</strong> with Ecto as the query interface. The schema has grown to 91 tables covering:</p>

<table>
<thead><tr><th>Domain</th><th>Tables</th><th>Key Tables</th></tr></thead>
<tbody>
<tr><td>Users &amp; Auth</td><td>12</td><td>users, sessions, oauth_tokens, identity_keys</td></tr>
<tr><td>Messaging</td><td>18</td><td>messages, channels, channel_members, reactions, threads</td></tr>
<tr><td>Communities</td><td>14</td><td>servers, roles, permissions, invites, bans</td></tr>
<tr><td>E2EE</td><td>8</td><td>prekey_bundles, signed_prekeys, one_time_prekeys, sessions</td></tr>
<tr><td>Gamification</td><td>11</td><td>xp_events, levels, achievements, leaderboards, streaks</td></tr>
<tr><td>Marketplace</td><td>9</td><td>items, transactions, inventories, currencies</td></tr>
<tr><td>Subscriptions</td><td>7</td><td>plans, subscriptions, invoices, payment_methods</td></tr>
<tr><td>Moderation</td><td>6</td><td>reports, audit_logs, content_filters, auto_mod_rules</td></tr>
<tr><td>System</td><td>6</td><td>settings, feature_flags, rate_limits, migrations</td></tr>
</tbody>
</table>

<h3>3-Tier Caching: ETS → Cachex → Redis</h3>

<p>Low-latency messaging requires aggressive caching. CGraph uses a <strong>3-tier caching architecture</strong>:</p>

<ul>
<li><strong>Tier 1: ETS (Erlang Term Storage)</strong> — In-process memory tables with sub-microsecond reads. Used for hot data: active channel memberships, online user sets, rate limit counters. ~50µs reads.</li>
<li><strong>Tier 2: Cachex</strong> — Elixir-native cache with TTL support, size limits, and cache-aside pattern. Used for frequently accessed but less volatile data: user profiles, server settings, permission matrices. ~200µs reads.</li>
<li><strong>Tier 3: Redis</strong> — Distributed cache for cross-node data sharing. Used for session tokens, presence state (across BEAM nodes), and pub/sub fanout. ~1ms reads.</li>
</ul>

<p>Cache reads cascade: check ETS first, then Cachex, then Redis, and finally PostgreSQL. Writes invalidate all tiers. This pattern delivers sub-millisecond reads for 95% of requests.</p>

<h3>Phoenix Channels for WebSocket</h3>

<p>Phoenix Channels provide a high-level abstraction over WebSocket connections with built-in features that would take months to build from scratch:</p>

<ul>
<li><strong>Topic-based routing</strong> — Users join channels like <code>"chat:channel_123"</code> or <code>"presence:server_456"</code></li>
<li><strong>Presence tracking</strong> — Built-in CRDT-based presence that syncs across BEAM nodes without conflicts</li>
<li><strong>Heartbeats</strong> — Automatic keep-alive with configurable timeouts</li>
<li><strong>Message buffering</strong> — Messages queued during brief disconnections are delivered on reconnect</li>
<li><strong>Transport fallback</strong> — Automatic fallback from WebSocket to long-polling for restrictive networks</li>
</ul>

<h3>GenServer-Based Workers</h3>

<p>Background processing uses <strong>GenServer</strong> modules — OTP's generic server abstraction. Each worker is a supervised process that handles specific tasks:</p>

<pre><code>defmodule CGraph.Workers.XPCalculator do
  use GenServer

  @impl true
  def init(state) do
    schedule_batch_processing()
    {:ok, state}
  end

  @impl true
  def handle_cast({:award_xp, user_id, action, metadata}, state) do
    xp_amount = calculate_xp(action, metadata)
    {:ok, _} = Gamification.award_xp(user_id, xp_amount, action)
    check_level_up(user_id)
    {:noreply, state}
  end

  @impl true
  def handle_info(:batch_process, state) do
    process_pending_xp_events()
    schedule_batch_processing()
    {:noreply, state}
  end
end</code></pre>

<p>If a GenServer crashes — say, due to a malformed XP event — the supervisor restarts it within milliseconds. No events are lost because pending work is stored in PostgreSQL. This is the level of resilience the BEAM provides out of the box.</p>

<h4>The Bottom Line</h4>

<p>Elixir with Phoenix gives CGraph a backend that's built for exactly what we need: massive concurrent connections, real-time message routing, fault-tolerant processing, and zero-downtime deployments. It's not the most popular choice, but it's the right one for this class of application.</p>
`,
  },

  'introducing-cgraph': {
    title: 'Introducing CGraph: The Vision',
    category: 'Product',
    author: 'Burca Lucas',
    date: 'January 2026',
    readTime: '5 min read',
    image: '🚀',
    tags: ['Product', 'Vision', 'Launch'],
    content: `
<p>Communities today are fragmented. Your team uses one app for chat, another for discussions, a third for private messages, and maybe a gamification plugin bolted onto the side. What if one platform did all of it — with <strong>real end-to-end encryption</strong> and an engagement system that makes participation genuinely fun? That's the vision behind <strong>CGraph</strong>.</p>

<h3>Four Pillars</h3>

<h4>1. Real-Time Messaging</h4>
<p>CGraph's messaging is built for speed and reliability. Text channels, direct messages, group DMs, threads, reactions, file sharing, and rich embeds — all delivered over WebSocket with sub-100ms latency. Voice and video calls use WebRTC with adaptive bitrate for quality on any connection. Screen sharing works on both desktop and mobile.</p>

<p>The architecture behind this is Phoenix Channels on Elixir — a technology stack proven to handle millions of concurrent connections. Messages are routed through BEAM processes, each connection isolated, each failure contained.</p>

<h4>2. Community Forums</h4>
<p>Not everything belongs in real-time chat. Long-form discussions, knowledge bases, announcements, and Q&amp;A threads deserve a forum format. CGraph's forums support nested threading, upvotes/downvotes, rich text formatting with Markdown, and pinned posts. Each community server can have both chat channels and forum channels, switching between real-time and asynchronous discussion as needed.</p>

<p>Forums are fully searchable with PostgreSQL full-text search across titles, body content, and tags. Users can subscribe to threads for notifications without participating, and moderators have granular controls over thread visibility and permissions.</p>

<h4>3. Post-Quantum End-to-End Encryption</h4>
<p>Privacy isn't a feature — it's a foundation. CGraph implements the <strong>Triple Ratchet protocol</strong> for post-quantum end-to-end encryption:</p>

<ul>
<li><strong>PQXDH key exchange</strong> — Hybrid key agreement combining P-256 ECDH + ML-KEM-768</li>
<li><strong>Triple Ratchet</strong> — EC Double Ratchet ∥ SPQR for forward secrecy and break-in recovery</li>
<li><strong>ML-KEM-768</strong> — Post-quantum key encapsulation for quantum resistance</li>
<li><strong>AES-256-GCM</strong> — Authenticated encryption for message payloads</li>
<li><strong>Ed25519</strong> — Digital signatures for identity verification</li>
</ul>

<p>E2EE is enabled by default on direct messages and can be enabled on group channels. The server never sees plaintext message content — it stores and routes encrypted blobs. Safety numbers let users verify each other's identities out-of-band, and key changes trigger visible warnings in the UI.</p>

<h4>4. RPG Gamification</h4>
<p>The secret sauce that keeps communities engaged. CGraph treats participation like an RPG:</p>

<ul>
<li><strong>Experience Points (XP)</strong> — Earned for sending messages, creating forum posts, helping others, participating in voice chats, and community events</li>
<li><strong>Leveling System</strong> — XP accumulates into levels with visible progression. Higher levels unlock new features, cosmetics, and permissions</li>
<li><strong>Achievements</strong> — Badges for milestones like "First Post," "100 Messages Sent," "Helped 10 Users," and challenge-based achievements</li>
<li><strong>Leaderboards</strong> — Server-wide and global rankings that update in real-time</li>
<li><strong>Streaks</strong> — Daily login and participation streaks with XP multipliers</li>
</ul>

<h3>The Marketplace</h3>

<p>CGraph includes a virtual marketplace where users can spend virtual currency earned through participation:</p>

<ul>
<li><strong>Profile Cosmetics</strong> — Custom badges, avatar frames, name colors, and profile backgrounds</li>
<li><strong>Server Enhancements</strong> — Emoji slots, channel themes, custom roles</li>
<li><strong>Virtual Items</strong> — Tradeable collectibles and limited-edition items for community events</li>
</ul>

<p>The virtual currency can be earned (not bought), keeping the economy participation-driven rather than pay-to-win. Server administrators can also create custom items for their communities.</p>

<h3>Subscription Tiers</h3>

<p>CGraph offers five subscription tiers designed to scale from individual users to enterprise deployments. Pricing will be finalized at public launch — here's what each tier includes:</p>

<table>
<thead><tr><th>Tier</th><th>Price</th><th>Key Features</th></tr></thead>
<tbody>
<tr><td>Free</td><td>Free forever</td><td>Full messaging, E2EE, forums, basic gamification, 5 servers</td></tr>
<tr><td>Plus</td><td>TBD</td><td>HD video, custom emojis, extended file uploads (50MB), 15 servers</td></tr>
<tr><td>Pro</td><td>TBD</td><td>4K video, priority support, advanced analytics, 50 servers, API access</td></tr>
<tr><td>Teams</td><td>TBD per user</td><td>Team management, SSO, audit logs, compliance tools, unlimited servers</td></tr>
<tr><td>Enterprise</td><td>Custom</td><td>On-premise option, dedicated support, SLA, custom integrations</td></tr>
</tbody>
</table>

<p>Every tier includes E2EE — encryption is not a premium feature. The free tier is generous enough for personal communities, while Teams and Enterprise add the administrative and compliance tools organizations need.</p>

<h3>Built for Communities</h3>

<p>CGraph isn't trying to replace every communication tool. It's built specifically for <strong>communities</strong> — groups of people who share a common interest, goal, or identity. Whether it's an open-source project, a gaming guild, a study group, a professional network, or a company team, CGraph provides the tools to communicate in real-time, discuss asynchronously, stay secure, and stay engaged.</p>

<p>The technical foundation — Elixir/Phoenix backend, React/React Native frontend, Triple Ratchet encryption with PQXDH, PostgreSQL with 91 tables — is designed to scale from a 10-person friend group to a 100,000-member community without changing architecture. We're building for the long term.</p>

<h4>Join the Beta</h4>

<p>CGraph is currently in closed beta with public launch planned for mid-2026. We're building in public — every engineering decision documented in this blog, every architecture change tracked in our changelog. If you're interested in building a community on a platform that respects privacy and rewards participation, we'd love to have you.</p>
`,
  },
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? blogArticles[slug] : undefined;

  if (!article) {
    return (
      <MarketingLayout
        title="Article Not Found"
        subtitle="The blog article you're looking for doesn't exist."
        eyebrow="Blog"
      >
        <section className="marketing-section marketing-section--dark">
          <div className="marketing-section__container" style={{ textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(139, 92, 246, 0.15))',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                📄
              </div>
              <p className="mb-8 text-lg" style={{ color: 'var(--color-gray)' }}>
                This article may have been moved or removed.
              </p>
              <Link to="/blog" className="marketing-btn marketing-btn--primary">
                ← Back to Blog
              </Link>
            </motion.div>
          </div>
        </section>
      </MarketingLayout>
    );
  }

  const catColor = categoryColors[article.category] ?? {
    bg: 'rgba(99, 102, 241, 0.12)',
    text: '#818cf8',
  };

  // Find previous/next articles
  const currentIndex = articleSlugs.indexOf(slug!);
  const prevSlug = currentIndex > 0 ? articleSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < articleSlugs.length - 1 ? articleSlugs[currentIndex + 1] : null;
  const prevArticle = prevSlug ? blogArticles[prevSlug] : null;
  const nextArticle = nextSlug ? blogArticles[nextSlug] : null;

  // Get related articles (same category, excluding current)
  const relatedArticles = articleSlugs
    .filter((s) => s !== slug && blogArticles[s]?.category === article.category)
    .slice(0, 3);

  return (
    <MarketingLayout
      title={article.title}
      subtitle={`${article.date} · ${article.readTime}`}
      eyebrow={article.category}
    >
      {/* Back to Blog */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '1rem', paddingBottom: '0' }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-emerald-400"
              style={{ color: 'var(--color-gray)' }}
            >
              ← Back to Blog
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Article Header */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Category Badge */}
            <span
              className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: catColor.bg, color: catColor.text }}
            >
              {article.category}
            </span>

            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/5 bg-white/5 px-2.5 py-1 text-xs"
                  style={{ color: 'var(--color-gray)' }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Author Box */}
            <div className="flex items-center gap-3 border-t border-white/5 pt-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                }}
              >
                BL
              </div>
              <div>
                <div className="text-sm font-medium text-white">{article.author}</div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--color-gray)' }}
                >
                  <span>{article.date}</span>
                  <span className="opacity-40">·</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="legal-content"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.content, {
                  USE_PROFILES: { html: true },
                }),
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Previous / Next Navigation */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            {prevArticle && prevSlug ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <Link
                  to={`/blog/${prevSlug}`}
                  className="marketing-card group block overflow-hidden transition-all hover:border-emerald-500/30"
                  style={{ padding: '1.25rem' }}
                >
                  <span className="mb-1 block text-xs" style={{ color: 'var(--color-gray)' }}>
                    ← Previous
                  </span>
                  <span className="block text-sm font-medium text-white transition-colors group-hover:text-emerald-300">
                    {prevArticle.title}
                  </span>
                </Link>
              </motion.div>
            ) : (
              <div className="flex-1" />
            )}

            {nextArticle && nextSlug ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1 text-right"
              >
                <Link
                  to={`/blog/${nextSlug}`}
                  className="marketing-card group block overflow-hidden transition-all hover:border-emerald-500/30"
                  style={{ padding: '1.25rem' }}
                >
                  <span className="mb-1 block text-xs" style={{ color: 'var(--color-gray)' }}>
                    Next →
                  </span>
                  <span className="block text-sm font-medium text-white transition-colors group-hover:text-emerald-300">
                    {nextArticle.title}
                  </span>
                </Link>
              </motion.div>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </section>

      {/* More Articles */}
      {relatedArticles.length > 0 && (
        <section className="marketing-section marketing-section--alt">
          <div className="mx-auto max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-6 text-xl font-bold" style={{ color: 'var(--color-light)' }}>
                More in {article.category}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((relSlug) => {
                  const rel = blogArticles[relSlug];
                  if (!rel) return null;
                  const relCatColor = categoryColors[rel.category] ?? {
                    bg: 'rgba(99, 102, 241, 0.12)',
                    text: '#818cf8',
                  };
                  return (
                    <Link
                      key={relSlug}
                      to={`/blog/${relSlug}`}
                      className="marketing-card group block overflow-hidden transition-all hover:border-emerald-500/30"
                      style={{ padding: 0 }}
                    >
                      <div
                        className="h-1 w-full"
                        style={{
                          background: `linear-gradient(90deg, ${relCatColor.text}, var(--color-secondary))`,
                        }}
                      />
                      <div className="p-5">
                        <span
                          className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            background: relCatColor.bg,
                            color: relCatColor.text,
                          }}
                        >
                          {rel.category}
                        </span>
                        <h4 className="mb-2 text-sm font-semibold text-white transition-colors group-hover:text-emerald-300">
                          {rel.title}
                        </h4>
                        <div
                          className="flex items-center gap-2 text-xs"
                          style={{ color: 'var(--color-gray)' }}
                        >
                          <span>{rel.date}</span>
                          <span className="opacity-40">·</span>
                          <span>{rel.readTime}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* All Articles Link */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '2rem', paddingBottom: '3rem' }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Link to="/blog" className="marketing-btn marketing-btn--secondary">
            View All Articles
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
