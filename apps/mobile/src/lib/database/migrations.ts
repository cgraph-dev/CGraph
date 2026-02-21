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
  // addColumns,
  // unsafeExecuteSql,
} from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // Version 1 → initial creation (no-op: first install gets full schema)
    // Future migrations go here, e.g.:
    // {
    //   toVersion: 2,
    //   steps: [
    //     addColumns({
    //       table: 'messages',
    //       columns: [{ name: 'thread_id', type: 'string', isOptional: true }],
    //     }),
    //   ],
    // },
  ],
});
