/**
 * Typed API endpoint constants — single source of truth.
 *
 * Every backend route is defined here with its canonical HTTP verb and path.
 * Web and mobile clients MUST use these constants instead of hardcoding paths.
 *
 * Generated from: apps/backend/lib/cgraph_web/router/*.ex
 * @see docs/api/ENDPOINT_CATALOG.md for full cross-reference
 *
 * @module @cgraph/api-client/endpoints
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointDef {
  readonly method: HttpVerb;
  readonly path: string;
}

/** Helper to create a typed endpoint definition. */
function ep(method: HttpVerb, path: string): EndpointDef {
  return { method, path } as const;
}

// ─── Health & Telemetry ──────────────────────────────────────────────────────

export const HEALTH = {
  index: ep('GET', '/health'),
  ready: ep('GET', '/ready'),
  metrics: ep('GET', '/metrics'),
} as const;

export const WEBHOOKS = {
  stripe: ep('POST', '/api/webhooks/stripe'),
} as const;

export const TELEMETRY = {
  createError: ep('POST', '/api/v1/telemetry/errors'),
  createMetric: ep('POST', '/api/v1/telemetry/metrics'),
} as const;

// ─── Auth ────────────────────────────────────────────────────────────────────

export const AUTH = {
  register: ep('POST', '/api/v1/auth/register'),
  login: ep('POST', '/api/v1/auth/login'),
  loginTwoFactor: ep('POST', '/api/v1/auth/login/2fa'),
  refresh: ep('POST', '/api/v1/auth/refresh'),
  walletChallenge: ep('POST', '/api/v1/auth/wallet/challenge'),
  walletVerify: ep('POST', '/api/v1/auth/wallet/verify'),
  forgotPassword: ep('POST', '/api/v1/auth/forgot-password'),
  resetPassword: ep('POST', '/api/v1/auth/reset-password'),
  verifyEmail: ep('POST', '/api/v1/auth/verify-email'),
  qrSession: ep('POST', '/api/v1/auth/qr-session'),
  logout: ep('POST', '/api/v1/auth/logout'),
  resendVerification: ep('POST', '/api/v1/auth/resend-verification'),
  qrLogin: ep('POST', '/api/v1/auth/qr-login'),
} as const;

export const OAUTH = {
  providers: ep('GET', '/api/v1/auth/oauth/providers'),
  authorize: (provider: string) => ep('GET', `/api/v1/auth/oauth/${provider}`),
  callback: (provider: string) => ep('GET', `/api/v1/auth/oauth/${provider}/callback`),
  mobile: (provider: string) => ep('POST', `/api/v1/auth/oauth/${provider}/mobile`),
  link: (provider: string) => ep('POST', `/api/v1/auth/oauth/${provider}/link`),
  unlink: (provider: string) => ep('DELETE', `/api/v1/auth/oauth/${provider}/link`),
} as const;

export const WALLET_AUTH = {
  generate: ep('POST', '/api/v1/auth/wallet/generate'),
  validatePin: ep('POST', '/api/v1/auth/wallet/validate-pin'),
  register: ep('POST', '/api/v1/auth/wallet/register'),
  login: ep('POST', '/api/v1/auth/wallet/login'),
  recoverCode: ep('POST', '/api/v1/auth/wallet/recover/code'),
  recoverFile: ep('POST', '/api/v1/auth/wallet/recover/file'),
  linkWallet: ep('POST', '/api/v1/auth/wallet/link'),
  updatePin: ep('PUT', '/api/v1/auth/wallet/pin'),
  unlinkWallet: ep('DELETE', '/api/v1/auth/wallet/unlink'),
} as const;

export const TWO_FACTOR = {
  status: ep('GET', '/api/v1/auth/2fa/status'),
  setup: ep('POST', '/api/v1/auth/2fa/setup'),
  enable: ep('POST', '/api/v1/auth/2fa/enable'),
  verify: ep('POST', '/api/v1/auth/2fa/verify'),
  disable: ep('POST', '/api/v1/auth/2fa/disable'),
  regenerateBackupCodes: ep('POST', '/api/v1/auth/2fa/backup-codes'),
  useBackupCode: ep('POST', '/api/v1/auth/2fa/backup-codes/use'),
} as const;

// ─── Public ──────────────────────────────────────────────────────────────────

export const TIERS = {
  index: ep('GET', '/api/v1/tiers'),
  compare: ep('GET', '/api/v1/tiers/compare'),
  show: (tier: string) => ep('GET', `/api/v1/tiers/${tier}`),
  myTier: ep('GET', '/api/v1/tiers/me'),
  checkAction: (action: string) => ep('GET', `/api/v1/tiers/check/${action}`),
  checkFeature: (feature: string) => ep('GET', `/api/v1/tiers/features/${feature}`),
} as const;

export const EXPLORE = {
  index: ep('GET', '/api/v1/explore'),
} as const;

// ─── User & Settings ────────────────────────────────────────────────────────

export const ME = {
  show: ep('GET', '/api/v1/me'),
  update: ep('PUT', '/api/v1/me'),
  changeUsername: ep('PUT', '/api/v1/me/username'),
  delete: ep('DELETE', '/api/v1/me'),
  uploadAvatar: ep('POST', '/api/v1/me/avatar'),
  sessions: ep('GET', '/api/v1/me/sessions'),
  revokeSession: (id: string) => ep('DELETE', `/api/v1/me/sessions/${id}`),
  requestExport: ep('POST', '/api/v1/me/export'),
  completeOnboarding: ep('POST', '/api/v1/me/onboarding/complete'),
  deleteAccount: ep('POST', '/api/v1/me/delete-account'),
  cancelDeleteAccount: ep('DELETE', '/api/v1/me/delete-account'),
  theme: ep('GET', '/api/v1/me/theme'),
  updateTheme: ep('PUT', '/api/v1/me/theme'),
  customizations: ep('GET', '/api/v1/me/customizations'),
  updateCustomizations: ep('PATCH', '/api/v1/me/customizations'),
  deleteCustomizations: ep('DELETE', '/api/v1/me/customizations'),
  avatarBorder: ep('GET', '/api/v1/me/avatar-border'),
  updateAvatarBorder: ep('PATCH', '/api/v1/me/avatar-border'),
} as const;

export const SETTINGS = {
  show: ep('GET', '/api/v1/settings'),
  update: ep('PUT', '/api/v1/settings'),
  updateNotifications: ep('PUT', '/api/v1/settings/notifications'),
  updatePrivacy: ep('PUT', '/api/v1/settings/privacy'),
  updateAppearance: ep('PUT', '/api/v1/settings/appearance'),
  updateLocale: ep('PUT', '/api/v1/settings/locale'),
  reset: ep('POST', '/api/v1/settings/reset'),
  getDnd: ep('GET', '/api/v1/settings/dnd'),
  setDnd: ep('POST', '/api/v1/settings/dnd'),
  clearDnd: ep('DELETE', '/api/v1/settings/dnd'),
} as const;

export const USERS = {
  index: ep('GET', '/api/v1/users'),
  show: (id: string) => ep('GET', `/api/v1/users/${id}`),
  profile: (username: string) => ep('GET', `/api/v1/users/${username}/profile`),
  leaderboard: ep('GET', '/api/v1/users/leaderboard'),
  checkUsername: ep('GET', '/api/v1/users/check-username'),
  presence: (id: string) => ep('GET', `/api/v1/users/${id}/presence`),
  bulkPresence: ep('POST', '/api/v1/users/presence/bulk'),
} as const;

// ─── Conversations & Messages ────────────────────────────────────────────────

export const CONVERSATIONS = {
  index: ep('GET', '/api/v1/conversations'),
  create: ep('POST', '/api/v1/conversations'),
  show: (id: string) => ep('GET', `/api/v1/conversations/${id}`),
  markRead: (id: string) => ep('POST', `/api/v1/conversations/${id}/read`),
  updateTtl: (id: string) => ep('PUT', `/api/v1/conversations/${id}/ttl`),
  messages: (id: string) => ep('GET', `/api/v1/conversations/${id}/messages`),
  createMessage: (id: string) => ep('POST', `/api/v1/conversations/${id}/messages`),
  typing: (id: string) => ep('POST', `/api/v1/conversations/${id}/typing`),
} as const;

export const MESSAGES = {
  forward: (id: string) => ep('POST', `/api/v1/messages/${id}/forward`),
  reschedule: (id: string) => ep('PATCH', `/api/v1/messages/${id}/reschedule`),
  cancelSchedule: (id: string) => ep('DELETE', `/api/v1/messages/${id}/cancel-schedule`),
  translate: (id: string) => ep('POST', `/api/v1/messages/${id}/translate`),
  reactions: (id: string) => ep('POST', `/api/v1/messages/${id}/reactions`),
  removeReaction: (id: string, emoji: string) =>
    ep('DELETE', `/api/v1/messages/${id}/reactions/${emoji}`),
} as const;

// ─── Groups & Channels ──────────────────────────────────────────────────────

export const GROUPS = {
  index: ep('GET', '/api/v1/groups'),
  create: ep('POST', '/api/v1/groups'),
  show: (id: string) => ep('GET', `/api/v1/groups/${id}`),
  update: (id: string) => ep('PUT', `/api/v1/groups/${id}`),
  delete: (id: string) => ep('DELETE', `/api/v1/groups/${id}`),
  channels: (groupId: string) => ep('GET', `/api/v1/groups/${groupId}/channels`),
  createChannel: (groupId: string) => ep('POST', `/api/v1/groups/${groupId}/channels`),
} as const;

export const INVITES = {
  show: (code: string) => ep('GET', `/api/v1/invites/${code}`),
  join: (code: string) => ep('POST', `/api/v1/invites/${code}/join`),
} as const;

// ─── Nodes (Virtual Currency) ────────────────────────────────────────────────

export const NODES = {
  wallet: ep('GET', '/api/v1/nodes/wallet'),
  transactions: ep('GET', '/api/v1/nodes/transactions'),
  bundles: ep('GET', '/api/v1/nodes/bundles'),
  checkout: ep('POST', '/api/v1/nodes/checkout'),
  tip: ep('POST', '/api/v1/nodes/tip'),
  unlock: ep('POST', '/api/v1/nodes/unlock'),
  withdraw: ep('POST', '/api/v1/nodes/withdraw'),
} as const;

// ─── Cosmetics & Shop ───────────────────────────────────────────────────────

export const SHOP = {
  index: ep('GET', '/api/v1/shop'),
  categories: ep('GET', '/api/v1/shop/categories'),
  purchases: ep('GET', '/api/v1/shop/purchases'),
  show: (id: string) => ep('GET', `/api/v1/shop/${id}`),
  purchase: (id: string) => ep('POST', `/api/v1/shop/${id}/purchase`),
} as const;

export const AVATAR_BORDERS = {
  list: ep('GET', '/api/v1/avatar-borders'),
  unlocked: ep('GET', '/api/v1/avatar-borders/unlocked'),
  equip: (id: string) => ep('POST', `/api/v1/avatar-borders/${id}/equip`),
  purchase: (id: string) => ep('POST', `/api/v1/avatar-borders/${id}/purchase`),
} as const;

export const PROFILE_THEMES = {
  list: ep('GET', '/api/v1/profile-themes'),
  active: ep('GET', '/api/v1/profile-themes/active'),
  activate: (id: string) => ep('POST', `/api/v1/profile-themes/${id}/activate`),
  customize: (id: string) => ep('PUT', `/api/v1/profile-themes/${id}/customize`),
} as const;

export const CHAT_EFFECTS = {
  list: ep('GET', '/api/v1/chat-effects'),
  sync: ep('POST', '/api/v1/chat-effects/sync'),
  activate: (id: string) => ep('POST', `/api/v1/chat-effects/${id}/activate`),
} as const;

// ─── Forums ──────────────────────────────────────────────────────────────────

export const FORUMS = {
  index: ep('GET', '/api/v1/forums'),
  show: (id: string) => ep('GET', `/api/v1/forums/${id}`),
  create: ep('POST', '/api/v1/forums'),
  update: (id: string) => ep('PUT', `/api/v1/forums/${id}`),
  delete: (id: string) => ep('DELETE', `/api/v1/forums/${id}`),
  leaderboard: ep('GET', '/api/v1/forums/leaderboard'),
  top: ep('GET', '/api/v1/forums/top'),
  popularFeed: ep('GET', '/api/v1/forums/feed/popular'),
  homeFeed: ep('GET', '/api/v1/forums/feed/home'),
  tree: ep('GET', '/api/v1/forums/tree'),
  roots: ep('GET', '/api/v1/forums/roots'),
  vote: (id: string) => ep('POST', `/api/v1/forums/${id}/vote`),
  subscribe: (id: string) => ep('POST', `/api/v1/forums/${id}/subscribe`),
  unsubscribe: (id: string) => ep('DELETE', `/api/v1/forums/${id}/subscribe`),
} as const;

export const POSTS = {
  feed: ep('GET', '/api/v1/posts/feed'),
  showById: (id: string) => ep('GET', `/api/v1/posts/${id}`),
} as const;

// ─── Pulse Reputation ────────────────────────────────────────────────────────

export const PULSE = {
  me: ep('GET', '/api/v1/pulse/me'),
  community: (id: string) => ep('GET', `/api/v1/pulse/community/${id}`),
  vote: ep('POST', '/api/v1/pulse/vote'),
  top: (communityId: string) => ep('GET', `/api/v1/pulse/top/${communityId}`),
} as const;

// ─── Discovery ───────────────────────────────────────────────────────────────

export const DISCOVERY = {
  feed: ep('GET', '/api/v1/feed'),
  topics: ep('GET', '/api/v1/topics'),
  frequencies: ep('GET', '/api/v1/frequencies'),
  updateFrequencies: ep('PUT', '/api/v1/frequencies'),
} as const;

// ─── Creator Economy ─────────────────────────────────────────────────────────

export const CREATOR = {
  onboard: ep('POST', '/api/v1/creator/onboard'),
  status: ep('GET', '/api/v1/creator/status'),
  refreshOnboard: ep('POST', '/api/v1/creator/onboard/refresh'),
  balance: ep('GET', '/api/v1/creator/balance'),
  requestPayout: ep('POST', '/api/v1/creator/payout'),
  listPayouts: ep('GET', '/api/v1/creator/payouts'),
  updateMonetization: (forumId: string) => ep('PUT', `/api/v1/forums/${forumId}/monetization`),
  analytics: {
    overview: ep('GET', '/api/v1/creator/analytics/overview'),
    earnings: ep('GET', '/api/v1/creator/analytics/earnings'),
    subscribers: ep('GET', '/api/v1/creator/analytics/subscribers'),
    content: ep('GET', '/api/v1/creator/analytics/content'),
  },
} as const;

// ─── AI ──────────────────────────────────────────────────────────────────────

export const AI = {
  summarize: ep('POST', '/api/v1/ai/summarize'),
  smartReplies: ep('POST', '/api/v1/ai/smart-replies'),
  moderate: ep('POST', '/api/v1/ai/moderate'),
  sentiment: ep('POST', '/api/v1/ai/sentiment'),
} as const;

// ─── Sync ────────────────────────────────────────────────────────────────────

export const SYNC = {
  pull: ep('GET', '/api/v1/sync/pull'),
  push: ep('POST', '/api/v1/sync/push'),
} as const;

// ─── Animations ──────────────────────────────────────────────────────────────

export const ANIMATIONS = {
  emojis: ep('GET', '/api/v1/animations/emojis'),
  searchEmojis: ep('GET', '/api/v1/animations/emojis/search'),
  showEmoji: (codepoint: string) => ep('GET', `/api/v1/animations/emojis/${codepoint}`),
  categories: ep('GET', '/api/v1/animations/categories'),
  borders: ep('GET', '/api/v1/animations/borders'),
  effects: ep('GET', '/api/v1/animations/effects'),
} as const;

// ─── Search ──────────────────────────────────────────────────────────────────

export const SEARCH = {
  index: ep('GET', '/api/v1/search'),
  users: ep('GET', '/api/v1/search/users'),
  messages: ep('GET', '/api/v1/search/messages'),
  posts: ep('GET', '/api/v1/search/posts'),
  groups: ep('GET', '/api/v1/search/groups'),
  forums: ep('GET', '/api/v1/search/forums'),
  suggestions: ep('GET', '/api/v1/search/suggestions'),
  recent: ep('GET', '/api/v1/search/recent'),
  clearHistory: ep('DELETE', '/api/v1/search/recent'),
} as const;

// ─── Notifications ───────────────────────────────────────────────────────────

export const NOTIFICATIONS = {
  index: ep('GET', '/api/v1/notifications'),
  markAllRead: ep('PUT', '/api/v1/notifications/read_all'),
  show: (id: string) => ep('GET', `/api/v1/notifications/${id}`),
  markRead: (id: string) => ep('POST', `/api/v1/notifications/${id}/read`),
  delete: (id: string) => ep('DELETE', `/api/v1/notifications/${id}`),
} as const;

// ─── Friends ─────────────────────────────────────────────────────────────────

export const FRIENDS = {
  index: ep('GET', '/api/v1/friends'),
  requests: ep('GET', '/api/v1/friends/requests'),
  sent: ep('GET', '/api/v1/friends/sent'),
  suggestions: ep('GET', '/api/v1/friends/suggestions'),
  create: ep('POST', '/api/v1/friends'),
  accept: (id: string) => ep('POST', `/api/v1/friends/${id}/accept`),
  decline: (id: string) => ep('POST', `/api/v1/friends/${id}/decline`),
  block: (id: string) => ep('POST', `/api/v1/friends/${id}/block`),
  unblock: (id: string) => ep('DELETE', `/api/v1/friends/${id}/block`),
  delete: (id: string) => ep('DELETE', `/api/v1/friends/${id}`),
  mutual: (id: string) => ep('GET', `/api/v1/friends/${id}/mutual`),
} as const;

// ─── Titles ──────────────────────────────────────────────────────────────────

export const TITLES = {
  index: ep('GET', '/api/v1/titles'),
  owned: ep('GET', '/api/v1/titles/owned'),
  equip: (id: string) => ep('POST', `/api/v1/titles/${id}/equip`),
  unequip: (id: string) => ep('POST', `/api/v1/titles/${id}/unequip`),
  unequipAll: ep('POST', '/api/v1/titles/unequip'),
  purchase: (id: string) => ep('POST', `/api/v1/titles/${id}/purchase`),
} as const;

// ─── Gamification ────────────────────────────────────────────────────────────

export const ACHIEVEMENTS = {
  list: ep('GET', '/api/v1/gamification/achievements'),
  show: (id: string) => ep('GET', `/api/v1/gamification/achievements/${id}`),
  unlock: (id: string) => ep('POST', `/api/v1/gamification/achievements/${id}/unlock`),
} as const;

export const PREMIUM = {
  status: ep('GET', '/api/v1/premium/status'),
  tiers: ep('GET', '/api/v1/premium/tiers'),
  features: ep('GET', '/api/v1/premium/features'),
  subscribe: ep('POST', '/api/v1/premium/subscribe'),
  cancel: ep('POST', '/api/v1/premium/cancel'),
} as const;

export const IAP = {
  validate: ep('POST', '/api/v1/iap/validate'),
  restore: ep('POST', '/api/v1/iap/restore'),
} as const;

// ─── Billing ─────────────────────────────────────────────────────────────────

export const BILLING = {
  plans: ep('GET', '/api/v1/billing/plans'),
  status: ep('GET', '/api/v1/billing/status'),
  invoices: ep('GET', '/api/v1/billing/invoices'),
  checkout: ep('POST', '/api/v1/billing/checkout'),
  portal: ep('POST', '/api/v1/billing/portal'),
  updatePlan: ep('POST', '/api/v1/billing/update-plan'),
} as const;
