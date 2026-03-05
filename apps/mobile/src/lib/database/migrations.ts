/**
 * WatermelonDB migrations for incremental schema changes.
 *
 * When bumping SCHEMA_VERSION in schema.ts, add a migration step here
 * so existing users get an ALTER TABLE instead of a full database wipe.
 *
 * @see https://watermelondb.dev/docs/Advanced/Migrations
 */
import {
  schemaMigrations,
  // createTable,
  addColumns,
  // unsafeExecuteSql,
} from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // Version 1 → 2: Add sender profile columns to messages table
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'messages',
          columns: [
            { name: 'sender_display_name', type: 'string', isOptional: true },
            { name: 'sender_avatar_url', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
