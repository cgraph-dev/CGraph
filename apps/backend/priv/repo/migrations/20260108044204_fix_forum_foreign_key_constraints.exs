defmodule Cgraph.Repo.Migrations.FixForumForeignKeyConstraints do
  @moduledoc """
  Fixes foreign key constraint conflicts in forum platform tables.
  
  These tables have columns defined as NOT NULL but with on_delete: :nilify_all,
  which causes PostgreSQL constraint violations when deleting users.
  
  This migration changes affected constraints to either:
  - ON DELETE CASCADE: For author/uploader IDs where content should be deleted with user
  - ON DELETE SET NULL + NULLABLE: For issued_by/moderator IDs where we want audit trail
  
  Affected tables from 20251230030000_create_forum_hosting_platform.exs:
  - threads (author_id)
  - thread_posts (author_id)
  - thread_attachments (uploader_id)
  - forum_announcements (author_id)
  - forum_warnings (issued_by_id) - Keep for audit trail, make nullable
  - forum_mod_logs (moderator_id) - Keep for audit trail, make nullable
  - forum_themes (created_by_id) - Already nullable, just fix constraint
  """
  use Ecto.Migration

  def up do
    # =========================================================================
    # THREADS TABLE - Author content deleted with user
    # =========================================================================
    execute """
    ALTER TABLE threads
    DROP CONSTRAINT IF EXISTS threads_author_id_fkey,
    ADD CONSTRAINT threads_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # last_poster_id is already nullable with nilify_all - this is correct
    # (we want to keep the thread but clear last_poster reference)

    # =========================================================================
    # THREAD_POSTS TABLE - Post content deleted with user
    # =========================================================================
    execute """
    ALTER TABLE thread_posts
    DROP CONSTRAINT IF EXISTS thread_posts_author_id_fkey,
    ADD CONSTRAINT thread_posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # edited_by_id is nullable and nilify_all is correct for edit attribution

    # =========================================================================
    # THREAD_ATTACHMENTS TABLE - Uploads deleted with user
    # =========================================================================
    execute """
    ALTER TABLE thread_attachments
    DROP CONSTRAINT IF EXISTS thread_attachments_uploader_id_fkey,
    ADD CONSTRAINT thread_attachments_uploader_id_fkey
      FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # =========================================================================
    # FORUM_ANNOUNCEMENTS TABLE - Announcements deleted with user
    # (Or optionally keep but nullify - depends on use case)
    # =========================================================================
    execute """
    ALTER TABLE forum_announcements
    DROP CONSTRAINT IF EXISTS forum_announcements_author_id_fkey,
    ADD CONSTRAINT forum_announcements_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # =========================================================================
    # FORUM_WARNINGS TABLE - Keep warnings for audit trail
    # Make issued_by_id nullable and keep nilify_all behavior
    # =========================================================================
    execute "ALTER TABLE forum_warnings ALTER COLUMN issued_by_id DROP NOT NULL;"
    
    execute """
    ALTER TABLE forum_warnings
    DROP CONSTRAINT IF EXISTS forum_warnings_issued_by_id_fkey,
    ADD CONSTRAINT forum_warnings_issued_by_id_fkey
      FOREIGN KEY (issued_by_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    # =========================================================================
    # FORUM_MOD_LOGS TABLE - Keep logs for audit trail
    # Make moderator_id nullable and keep nilify_all behavior
    # =========================================================================
    execute "ALTER TABLE forum_mod_logs ALTER COLUMN moderator_id DROP NOT NULL;"
    
    execute """
    ALTER TABLE forum_mod_logs
    DROP CONSTRAINT IF EXISTS forum_mod_logs_moderator_id_fkey,
    ADD CONSTRAINT forum_mod_logs_moderator_id_fkey
      FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    # forum_themes.created_by_id is already nullable - just ensure constraint is correct
    execute """
    ALTER TABLE forum_themes
    DROP CONSTRAINT IF EXISTS forum_themes_created_by_id_fkey,
    ADD CONSTRAINT forum_themes_created_by_id_fkey
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    # =========================================================================
    # REPUTATION_ENTRIES TABLE - Delete reputation entries with user
    # (Both from_user_id and to_user_id should cascade)
    # =========================================================================
    # These are already correctly set to ON DELETE CASCADE in the migration

    # =========================================================================
    # Additional forum tables that may have issues
    # =========================================================================
    
    # forum_categories - This table only has forum_id, not owner_id
    # The forum_id constraint is already correct with ON DELETE CASCADE
    # No changes needed here

    # forum_posts (if exists separately from thread_posts) - author_id
    execute """
    DO $$ 
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'forum_posts' AND table_schema = 'public'
      ) THEN
        -- Check if it has author_id column with not null constraint
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'forum_posts' 
          AND column_name = 'author_id' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE forum_posts
          DROP CONSTRAINT IF EXISTS forum_posts_author_id_fkey,
          ADD CONSTRAINT forum_posts_author_id_fkey
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END IF;
    END $$;
    """

    # forum_comments (if exists) - author_id
    execute """
    DO $$ 
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'forum_comments' AND table_schema = 'public'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'forum_comments' 
          AND column_name = 'author_id' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE forum_comments
          DROP CONSTRAINT IF EXISTS forum_comments_author_id_fkey,
          ADD CONSTRAINT forum_comments_author_id_fkey
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END IF;
    END $$;
    """

    # forum_bans (if exists) - banned_by_id (should be nullable for audit)
    execute """
    DO $$ 
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'forum_bans' AND table_schema = 'public'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'forum_bans' 
          AND column_name = 'banned_by_id' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE forum_bans ALTER COLUMN banned_by_id DROP NOT NULL;
          ALTER TABLE forum_bans
          DROP CONSTRAINT IF EXISTS forum_bans_banned_by_id_fkey,
          ADD CONSTRAINT forum_bans_banned_by_id_fkey
            FOREIGN KEY (banned_by_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END IF;
    END $$;
    """

    # forum_content_reports (if exists) - author_id
    execute """
    DO $$ 
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'forum_content_reports' AND table_schema = 'public'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'forum_content_reports' 
          AND column_name = 'author_id' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE forum_content_reports
          DROP CONSTRAINT IF EXISTS forum_content_reports_author_id_fkey,
          ADD CONSTRAINT forum_content_reports_author_id_fkey
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END IF;
    END $$;
    """

    # forum_attachments (if exists separately from thread_attachments)
    execute """
    DO $$ 
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'forum_attachments' AND table_schema = 'public'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'forum_attachments' 
          AND column_name = 'uploader_id' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE forum_attachments
          DROP CONSTRAINT IF EXISTS forum_attachments_uploader_id_fkey,
          ADD CONSTRAINT forum_attachments_uploader_id_fkey
            FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END IF;
    END $$;
    """

    # forum_mod_actions (if exists) - moderator_id
    execute """
    DO $$ 
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'forum_mod_actions' AND table_schema = 'public'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'forum_mod_actions' 
          AND column_name = 'moderator_id' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE forum_mod_actions ALTER COLUMN moderator_id DROP NOT NULL;
          ALTER TABLE forum_mod_actions
          DROP CONSTRAINT IF EXISTS forum_mod_actions_moderator_id_fkey,
          ADD CONSTRAINT forum_mod_actions_moderator_id_fkey
            FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END IF;
    END $$;
    """
  end

  def down do
    # Revert to original constraints (problematic but original state)
    # Note: This will restore the bug - only use in emergencies
    
    execute """
    ALTER TABLE threads
    DROP CONSTRAINT IF EXISTS threads_author_id_fkey,
    ADD CONSTRAINT threads_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE thread_posts
    DROP CONSTRAINT IF EXISTS thread_posts_author_id_fkey,
    ADD CONSTRAINT thread_posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE thread_attachments
    DROP CONSTRAINT IF EXISTS thread_attachments_uploader_id_fkey,
    ADD CONSTRAINT thread_attachments_uploader_id_fkey
      FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE forum_announcements
    DROP CONSTRAINT IF EXISTS forum_announcements_author_id_fkey,
    ADD CONSTRAINT forum_announcements_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    # Restore NOT NULL constraints that we removed
    execute "ALTER TABLE forum_warnings ALTER COLUMN issued_by_id SET NOT NULL;"
    execute """
    ALTER TABLE forum_warnings
    DROP CONSTRAINT IF EXISTS forum_warnings_issued_by_id_fkey,
    ADD CONSTRAINT forum_warnings_issued_by_id_fkey
      FOREIGN KEY (issued_by_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute "ALTER TABLE forum_mod_logs ALTER COLUMN moderator_id SET NOT NULL;"
    execute """
    ALTER TABLE forum_mod_logs
    DROP CONSTRAINT IF EXISTS forum_mod_logs_moderator_id_fkey,
    ADD CONSTRAINT forum_mod_logs_moderator_id_fkey
      FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE forum_themes
    DROP CONSTRAINT IF EXISTS forum_themes_created_by_id_fkey,
    ADD CONSTRAINT forum_themes_created_by_id_fkey
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
    """
  end
end
