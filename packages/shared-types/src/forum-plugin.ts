/**
 * Forum Plugin System — shared type definitions.
 *
 * Covers plugin registration, hook events, configuration,
 * and the runtime contract between the backend plugin executor
 * and the web / mobile configuration UI.
 */

// ── Core Plugin Types ──────────────────────────────────────────────

/** A registered plugin within a forum. */
export interface ForumPlugin {
  id: string;
  forum_id: string;
  /** Unique slug used for routing / config keys. */
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  /** Whether the plugin is currently enabled for this forum. */
  enabled: boolean;
  /** Module path on the backend (e.g. "CGraph.Forums.Plugins.WelcomeBot"). */
  module: string;
  /** Plugin-declared settings schema (JSON Schema subset). */
  settings_schema: PluginSettingsSchema;
  /** Current runtime settings for this forum. */
  settings: PluginSettings;
  /** Which lifecycle hooks this plugin subscribes to. */
  hooks: PluginHookEvent[];
  installed_at: string;
  updated_at: string;
}

// ── Hook Events ────────────────────────────────────────────────────

/**
 * Lifecycle events that plugins can subscribe to.
 * The backend `PluginRuntime` dispatches these at the appropriate points.
 */
export type PluginHookEvent =
  | 'thread.created'
  | 'thread.updated'
  | 'thread.deleted'
  | 'post.created'
  | 'post.updated'
  | 'post.deleted'
  | 'member.joined'
  | 'member.left'
  | 'member.role_changed'
  | 'forum.settings_changed'
  | 'moderation.action_taken'
  | 'warning.issued'
  | 'poll.created'
  | 'poll.voted'
  | 'poll.closed';

/** Payload delivered to a plugin when a hook fires. */
export interface PluginHookPayload {
  event: PluginHookEvent;
  forum_id: string;
  actor_id: string;
  /** Event-specific data — shape depends on the event. */
  data: Record<string, unknown>;
  timestamp: string;
}

/** Result returned by a plugin after handling a hook. */
export interface PluginHookResult {
  /** Whether the plugin handled the event successfully. */
  ok: boolean;
  /** Optional mutations the plugin wants applied. */
  mutations?: PluginMutation[];
  /** Human-readable log message for debugging. */
  log?: string;
}

export interface PluginMutation {
  type: 'send_message' | 'update_metadata' | 'trigger_webhook' | 'add_reaction';
  payload: Record<string, unknown>;
}

// ── Plugin Settings ────────────────────────────────────────────────

/**
 * Runtime settings for a plugin instance.
 * Values conform to the plugin's `settings_schema`.
 */
export type PluginSettings = Record<string, unknown>;

/** Simplified JSON-Schema-like descriptor for one setting field. */
export interface PluginSettingField {
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'url';
  default_value: unknown;
  required: boolean;
  /** Only for `select` type. */
  options?: { label: string; value: string }[];
  /** Validation constraints. */
  min?: number;
  max?: number;
  pattern?: string;
}

/** Top-level schema that a plugin publishes. */
export interface PluginSettingsSchema {
  fields: PluginSettingField[];
}

// ── Plugin Configuration ───────────────────────────────────────────

/** Full configuration blob for a plugin in a forum. */
export interface PluginConfig {
  plugin_id: string;
  forum_id: string;
  enabled: boolean;
  settings: PluginSettings;
  hooks: PluginHookEvent[];
  /** Rate-limit: max hook dispatches per minute. */
  rate_limit: number;
  /** Timeout in ms for a single hook execution. */
  timeout_ms: number;
  /** Whether errors in this plugin should be silently swallowed. */
  fail_open: boolean;
}

/** Payload for updating plugin configuration from the UI. */
export interface UpdatePluginConfigPayload {
  enabled?: boolean;
  settings?: Partial<PluginSettings>;
  hooks?: PluginHookEvent[];
  rate_limit?: number;
  timeout_ms?: number;
  fail_open?: boolean;
}

// ── Plugin Marketplace (future) ────────────────────────────────────

/** Minimal listing info for a marketplace plugin. */
export interface PluginListing {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
  hooks: PluginHookEvent[];
  icon_url?: string;
  repository_url?: string;
  tags: string[];
}
