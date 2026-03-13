/**
 * WatermelonDB database instance — singleton.
 *
 * Initializes SQLite adapter with the CGraph schema and model classes.
 * This module is the single source of truth for the local database.
 *
 * Usage:
 *   import { database } from '@/lib/database';
 *   const messages = database.get<Message>('messages');
 */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations';
import {
  Conversation,
  ConversationParticipant,
  Message,
  User,
  Friend,
  Group,
  Channel,
  OfflineQueueItem,
  SyncMetadata,
} from './models';

// ─── Adapter ────────────────────────────────────────────────────
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'cgraph',
  // Use JSI for synchronous, zero-bridge-overhead DB access on new arch
  jsi: true,
  // Called when migration fails — reset DB as recovery
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Setup error, resetting database:', error);
    // In production we'd want to report this to Sentry
  },
});

// ─── Database ───────────────────────────────────────────────────
export const database = new Database({
  adapter,
  modelClasses: [
    Conversation,
    ConversationParticipant,
    Message,
    User,
    Friend,
    Group,
    Channel,
    OfflineQueueItem,
    SyncMetadata,
  ],
});

// ─── Convenience getters ────────────────────────────────────────
export const conversationsCollection = database.get<Conversation>('conversations');
export const participantsCollection = database.get<ConversationParticipant>(
  'conversation_participants'
);
export const messagesCollection = database.get<Message>('messages');
export const usersCollection = database.get<User>('users');
export const friendsCollection = database.get<Friend>('friends');
export const groupsCollection = database.get<Group>('groups');
export const channelsCollection = database.get<Channel>('channels');
export const offlineQueueCollection = database.get<OfflineQueueItem>('offline_queue');
export const syncMetadataCollection = database.get<SyncMetadata>('sync_metadata');

// ─── Reset (for logout) ────────────────────────────────────────
/**
 * Reset database.
 *
 */
export async function resetDatabase(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

// ─── Re-export models & schema for convenience ─────────────────
export * from './models';
export { default as schema, SCHEMA_VERSION } from './schema';
