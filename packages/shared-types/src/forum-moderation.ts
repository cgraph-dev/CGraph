/**
 * Forum Moderation — shared type definitions.
 *
 * Covers the moderation queue, automod rules, warnings / strike system,
 * and moderation statistics that the backend, web, and mobile apps share.
 */

// ── Moderation Queue ───────────────────────────────────────────────

/** A single item waiting in the moderator review queue. */
export interface ModQueueItem {
  id: string;
  forum_id: string;
  content_type: 'thread' | 'post' | 'comment';
  content_id: string;
  content_preview: string;
  reporter: ModQueueReporter;
  reported_user: ModQueueUser;
  reason: string;
  status: ModQueueStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution?: ModResolution;
}

export type ModQueueStatus = 'pending' | 'reviewed' | 'resolved';
export type ModResolution = 'approved' | 'rejected' | 'hidden' | 'deleted';

export interface ModQueueReporter {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface ModQueueUser {
  id: string;
  username: string;
}

/** Payload for taking a moderation action on a queue item. */
export interface ModActionPayload {
  action: ModResolution;
  reason?: string;
  /** Whether to also issue a warning to the reported user. */
  issue_warning?: boolean;
  warning_reason?: string;
  warning_points?: number;
}

// ── Automod Rules ──────────────────────────────────────────────────

/** The full automod configuration for a single forum. */
export interface ForumAutomodRules {
  id: string;
  forum_id: string;
  enabled: boolean;
  word_filter: WordFilterConfig;
  link_filter: LinkFilterConfig;
  spam_filter: SpamFilterConfig;
  caps_filter: CapsFilterConfig;
  updated_at: string;
}

export interface WordFilterConfig {
  enabled: boolean;
  /** Words that are always blocked. */
  blocked_words: string[];
  /** Words that trigger moderator review rather than auto-reject. */
  flagged_words: string[];
  action: AutomodAction;
}

export interface LinkFilterConfig {
  enabled: boolean;
  /** Allow links only from these domains. Empty = allow all. */
  allowed_domains: string[];
  /** Always block links from these domains. */
  blocked_domains: string[];
  block_all_links: boolean;
  action: AutomodAction;
}

export interface SpamFilterConfig {
  enabled: boolean;
  /** Max posts per user per minute before triggering. */
  max_posts_per_minute: number;
  /** Max identical messages before triggering. */
  max_duplicate_messages: number;
  action: AutomodAction;
}

export interface CapsFilterConfig {
  enabled: boolean;
  /** Minimum message length to check (avoids flagging "OK"). */
  min_length: number;
  /** Max percentage of uppercase characters (0-100). */
  max_caps_percentage: number;
  action: AutomodAction;
}

export type AutomodAction = 'flag' | 'hide' | 'delete' | 'warn';

/** Payload for updating automod rules. */
export interface UpdateAutomodPayload {
  enabled?: boolean;
  word_filter?: Partial<WordFilterConfig>;
  link_filter?: Partial<LinkFilterConfig>;
  spam_filter?: Partial<SpamFilterConfig>;
  caps_filter?: Partial<CapsFilterConfig>;
}

// ── Warnings / Strike System ───────────────────────────────────────

/** A warning issued to a user within a forum. */
export interface ForumWarning {
  id: string;
  forum_id: string;
  user: ModQueueUser;
  reason: string;
  points: number;
  issued_by: ModQueueUser;
  created_at: string;
  expires_at?: string;
  acknowledged: boolean;
  revoked: boolean;
  revoked_by?: string;
  revoked_at?: string;
}

/** Payload for issuing a new warning. */
export interface IssueWarningPayload {
  user_id: string;
  reason: string;
  points: number;
  /** ISO-8601 expiry date, or omit for permanent. */
  expires_at?: string;
}

/** Threshold configuration for auto-actions on accumulated points. */
export interface WarningThreshold {
  points: number;
  action: 'mute' | 'temp_ban' | 'permanent_ban';
  /** Duration in minutes (for mute / temp_ban). */
  duration_minutes?: number;
}

// ── Moderation Statistics ──────────────────────────────────────────

/** Aggregated moderation stats for a forum. */
export interface ModStats {
  pending_count: number;
  resolved_today: number;
  active_warnings: number;
  recent_bans: number;
  /** Optional historical data for charts. */
  daily_actions?: DailyModActions[];
}

export interface DailyModActions {
  date: string;
  approved: number;
  rejected: number;
  hidden: number;
  deleted: number;
  warnings_issued: number;
}

// ── Moderation Action Log ──────────────────────────────────────────

/** A recorded moderation action for the audit trail. */
export interface ForumModAction {
  id: string;
  forum_id: string;
  moderator: ModQueueUser;
  action_type: ModResolution | 'warn' | 'mute' | 'ban' | 'unban' | 'revoke_warning';
  target_user?: ModQueueUser;
  target_content_id?: string;
  target_content_type?: 'thread' | 'post' | 'comment';
  reason?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}
