/**
 * Hard limits and bounds for data structures across CGraph.
 *
 * These values MUST match the backend validation rules.
 * @module @cgraph/config/limits
 */

export const LIMITS = {
  /** Max messages retained in a conversation store */
  MAX_MESSAGES: 500,
  /** Max conversations in store */
  MAX_CONVERSATIONS: 200,
  /** Max threads in forum store */
  MAX_THREADS: 500,
  /** Max posts in forum store */
  MAX_POSTS: 500,
  /** Max groups in store */
  MAX_GROUPS: 200,
  /** Max announcements in store */
  MAX_ANNOUNCEMENTS: 200,
  /** Max listings in marketplace store */
  MAX_LISTINGS: 500,
  /** Max purchase history items */
  MAX_PURCHASE_HISTORY: 500,
  /** Max selected user IDs in admin */
  MAX_SELECTED_USERS: 100,
  /** Max calendar events */
  MAX_EVENTS: 500,
  /** Max calendar categories */
  MAX_CATEGORIES: 100,
  /** Max unlocked effects */
  MAX_UNLOCKED_EFFECTS: 200,
  /** Max multi-quote buffer */
  MAX_MULTI_QUOTE: 20,
  /** Max thread prefixes */
  MAX_THREAD_PREFIXES: 100,
  /** Max subscriptions */
  MAX_SUBSCRIPTIONS: 500,
  /** Max forum boards */
  MAX_BOARDS: 200,

  /** Username length bounds */
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  /** Display name max */
  DISPLAY_NAME_MAX: 100,
  /** Bio max */
  BIO_MAX: 500,
  /** Custom status max */
  CUSTOM_STATUS_MAX: 100,
  /** Password length bounds */
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72,
  /** Message content max */
  MESSAGE_MAX: 4000,
  /** Forum post max */
  POST_MAX: 50000,
} as const;
