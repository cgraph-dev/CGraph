defmodule Cgraph.Repo.Migrations.FixForeignKeyConstraints do
  @moduledoc """
  Fixes foreign key constraint conflicts where columns are defined as NOT NULL
  but have on_delete: :nilify_all, which would cause database errors on deletion.

  This migration changes critical tables to use ON DELETE CASCADE for proper cascade
  deletion, preventing orphaned records and constraint violations.

  Affected tables:
  - conversations (user_one_id, user_two_id)
  - messages (sender_id)
  - groups (owner_id)
  - invites (created_by_id)
  - audit_logs (user_id)
  - message_edits (edited_by_id)
  """
  use Ecto.Migration

  def up do
    # Use raw SQL for constraint modification - more reliable than Ecto's drop constraint
    # which requires exact constraint names

    # =========================================================================
    # CONVERSATIONS TABLE
    # =========================================================================
    execute """
    ALTER TABLE conversations
    DROP CONSTRAINT IF EXISTS conversations_user_one_id_fkey,
    ADD CONSTRAINT conversations_user_one_id_fkey
      FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    execute """
    ALTER TABLE conversations
    DROP CONSTRAINT IF EXISTS conversations_user_two_id_fkey,
    ADD CONSTRAINT conversations_user_two_id_fkey
      FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # =========================================================================
    # MESSAGES TABLE
    # =========================================================================
    execute """
    ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
    ADD CONSTRAINT messages_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # =========================================================================
    # MESSAGE EDITS TABLE
    # =========================================================================
    execute """
    ALTER TABLE message_edits
    DROP CONSTRAINT IF EXISTS message_edits_edited_by_id_fkey,
    ADD CONSTRAINT message_edits_edited_by_id_fkey
      FOREIGN KEY (edited_by_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # =========================================================================
    # GROUPS TABLE
    # =========================================================================
    execute """
    ALTER TABLE groups
    DROP CONSTRAINT IF EXISTS groups_owner_id_fkey,
    ADD CONSTRAINT groups_owner_id_fkey
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # =========================================================================
    # INVITES TABLE
    # =========================================================================
    execute """
    ALTER TABLE invites
    DROP CONSTRAINT IF EXISTS invites_created_by_id_fkey,
    ADD CONSTRAINT invites_created_by_id_fkey
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE;
    """

    # =========================================================================
    # AUDIT LOGS TABLE
    # =========================================================================
    execute """
    ALTER TABLE audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey,
    ADD CONSTRAINT audit_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    """
  end

  def down do
    # Revert to original nilify_all behavior (problematic but original state)
    execute """
    ALTER TABLE conversations
    DROP CONSTRAINT IF EXISTS conversations_user_one_id_fkey,
    ADD CONSTRAINT conversations_user_one_id_fkey
      FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE conversations
    DROP CONSTRAINT IF EXISTS conversations_user_two_id_fkey,
    ADD CONSTRAINT conversations_user_two_id_fkey
      FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
    ADD CONSTRAINT messages_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE message_edits
    DROP CONSTRAINT IF EXISTS message_edits_edited_by_id_fkey,
    ADD CONSTRAINT message_edits_edited_by_id_fkey
      FOREIGN KEY (edited_by_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE groups
    DROP CONSTRAINT IF EXISTS groups_owner_id_fkey,
    ADD CONSTRAINT groups_owner_id_fkey
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE invites
    DROP CONSTRAINT IF EXISTS invites_created_by_id_fkey,
    ADD CONSTRAINT invites_created_by_id_fkey
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    execute """
    ALTER TABLE audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey,
    ADD CONSTRAINT audit_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    """
  end
end
