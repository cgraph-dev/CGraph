/**
 * WatermelonDB Schema — SQLite-backed offline-first data layer.
 *
 * Tables mirror the backend Ecto schemas with sync-compatible metadata columns.
 * Uses snake_case column names to match the REST API wire format.
 *
 * @see https://watermelondb.dev/docs/Schema
 */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const SCHEMA_VERSION = 2;

export default appSchema({
  version: SCHEMA_VERSION,
  tables: [
    // ─── Conversations ──────────────────────────────────────────
    tableSchema({
      name: 'conversations',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'type', type: 'string' }, // direct | group
        { name: 'name', type: 'string', isOptional: true },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'last_message_content', type: 'string', isOptional: true },
        { name: 'last_message_at', type: 'number', isOptional: true },
        { name: 'last_message_sender_id', type: 'string', isOptional: true },
        { name: 'unread_count', type: 'number' },
        { name: 'is_muted', type: 'boolean' },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'encryption_key_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Conversation Participants ──────────────────────────────
    tableSchema({
      name: 'conversation_participants',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'role', type: 'string' }, // owner | admin | member
        { name: 'joined_at', type: 'number' },
        { name: 'last_read_at', type: 'number', isOptional: true },
      ],
    }),

    // ─── Messages ───────────────────────────────────────────────
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'channel_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'sender_id', type: 'string', isIndexed: true },
        { name: 'content', type: 'string' },
        { name: 'encrypted_content', type: 'string', isOptional: true },
        { name: 'message_type', type: 'string' }, // text | image | file | system | voice
        { name: 'reply_to_id', type: 'string', isOptional: true },
        { name: 'attachments_json', type: 'string', isOptional: true },
        { name: 'metadata_json', type: 'string', isOptional: true },
        { name: 'reactions_json', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // sending | sent | delivered | read | failed
        { name: 'is_edited', type: 'boolean' },
        { name: 'is_deleted', type: 'boolean' },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'is_optimistic', type: 'boolean' },
        { name: 'sender_display_name', type: 'string', isOptional: true },
        { name: 'sender_avatar_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Users (contacts / profile cache) ───────────────────────
    tableSchema({
      name: 'users',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'username', type: 'string', isIndexed: true },
        { name: 'uid', type: 'string', isOptional: true }, // 10-digit public uid
        { name: 'display_name', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'bio', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isOptional: true }, // online | offline | away | dnd
        { name: 'status_message', type: 'string', isOptional: true },
        { name: 'karma', type: 'number' },
        { name: 'is_verified', type: 'boolean' },
        { name: 'is_premium', type: 'boolean' },
        { name: 'tier', type: 'string' }, // free | premium | enterprise
        { name: 'title', type: 'string', isOptional: true },
        { name: 'title_rarity', type: 'string', isOptional: true },
        { name: 'last_seen_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Friends ────────────────────────────────────────────────
    tableSchema({
      name: 'friends',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'friend_user_id', type: 'string', isIndexed: true },
        { name: 'status', type: 'string' }, // pending | accepted | blocked
        { name: 'direction', type: 'string' }, // incoming | outgoing | mutual
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Groups ─────────────────────────────────────────────────
    tableSchema({
      name: 'groups',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'slug', type: 'string', isIndexed: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'icon_url', type: 'string', isOptional: true },
        { name: 'banner_url', type: 'string', isOptional: true },
        { name: 'owner_id', type: 'string' },
        { name: 'is_public', type: 'boolean' },
        { name: 'member_count', type: 'number' },
        { name: 'online_member_count', type: 'number' },
        { name: 'my_role', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Channels (within Groups) ──────────────────────────────
    tableSchema({
      name: 'channels',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'group_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' }, // text | voice | announcements | stage
        { name: 'topic', type: 'string', isOptional: true },
        { name: 'position', type: 'number' },
        { name: 'is_private', type: 'boolean' },
        { name: 'is_nsfw', type: 'boolean' },
        { name: 'slow_mode_seconds', type: 'number' },
        { name: 'unread_count', type: 'number' },
        { name: 'last_message_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Offline Queue (persisted pending operations) ──────────
    tableSchema({
      name: 'offline_queue',
      columns: [
        { name: 'operation_type', type: 'string' }, // message | reaction | post | ...
        { name: 'priority', type: 'number' }, // 1=critical .. 4=low
        { name: 'endpoint', type: 'string' },
        { name: 'method', type: 'string' }, // GET | POST | PUT | DELETE
        { name: 'payload_json', type: 'string' },
        { name: 'headers_json', type: 'string', isOptional: true },
        { name: 'retry_count', type: 'number' },
        { name: 'max_retries', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // pending | processing | failed | completed
        { name: 'metadata_json', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Sync Metadata (last-sync timestamps per table) ────────
    tableSchema({
      name: 'sync_metadata',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true },
        { name: 'last_pulled_at', type: 'number' },
        { name: 'last_pushed_at', type: 'number' },
        { name: 'pull_cursor', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // idle | pulling | pushing | error
        { name: 'error_message', type: 'string', isOptional: true },
      ],
    }),
  ],
});
