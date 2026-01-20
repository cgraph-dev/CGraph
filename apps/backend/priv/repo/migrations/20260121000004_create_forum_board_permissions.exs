defmodule CGraph.Repo.Migrations.CreateForumBoardPermissions do
  @moduledoc """
  Migration to add granular board-level permissions.

  This enables:
  - Per-board permission overrides for user groups
  - Permission inheritance from parent boards/forums
  - Role-based access control at the board level
  - Guest permissions per board
  """
  use Ecto.Migration

  def change do
    # ==========================================================================
    # Board Permissions - Override group permissions at board level
    # ==========================================================================
    create table(:board_permissions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :board_id, references(:boards, type: :binary_id, on_delete: :delete_all), null: false
      add :user_group_id, references(:forum_user_groups, type: :binary_id, on_delete: :delete_all)
      
      # If user_group_id is null, these are guest (anonymous) permissions
      add :applies_to, :string, default: "group"  # "group", "guest", "all_members"

      # Permission values: "inherit" | "allow" | "deny"
      # "inherit" uses the group's default permission
      # "allow" overrides to grant permission
      # "deny" overrides to revoke permission

      # View permissions
      add :can_view, :string, default: "inherit"
      add :can_view_threads, :string, default: "inherit"

      # Posting permissions
      add :can_create_threads, :string, default: "inherit"
      add :can_reply, :string, default: "inherit"
      add :can_edit_own_posts, :string, default: "inherit"
      add :can_delete_own_posts, :string, default: "inherit"

      # Feature permissions
      add :can_upload_attachments, :string, default: "inherit"
      add :can_create_polls, :string, default: "inherit"
      add :can_vote_polls, :string, default: "inherit"

      # Moderation permissions
      add :can_moderate, :string, default: "inherit"
      add :can_edit_posts, :string, default: "inherit"
      add :can_delete_posts, :string, default: "inherit"
      add :can_move_threads, :string, default: "inherit"
      add :can_lock_threads, :string, default: "inherit"
      add :can_pin_threads, :string, default: "inherit"

      timestamps()
    end

    create unique_index(:board_permissions, [:board_id, :user_group_id],
      where: "user_group_id IS NOT NULL",
      name: :board_permissions_group_unique
    )
    create unique_index(:board_permissions, [:board_id, :applies_to],
      where: "user_group_id IS NULL",
      name: :board_permissions_applies_to_unique
    )
    create index(:board_permissions, [:board_id])
    create index(:board_permissions, [:user_group_id])

    # ==========================================================================
    # Forum Permissions - Override at forum level (for hierarchy)
    # ==========================================================================
    create table(:forum_permissions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :user_group_id, references(:forum_user_groups, type: :binary_id, on_delete: :delete_all)
      
      add :applies_to, :string, default: "group"  # "group", "guest", "all_members"

      # View permissions
      add :can_view, :string, default: "inherit"
      add :can_view_boards, :string, default: "inherit"

      # Posting permissions
      add :can_create_threads, :string, default: "inherit"
      add :can_reply, :string, default: "inherit"

      # Admin permissions (forum-level)
      add :can_manage_boards, :string, default: "inherit"
      add :can_manage_groups, :string, default: "inherit"
      add :can_manage_settings, :string, default: "inherit"

      timestamps()
    end

    create unique_index(:forum_permissions, [:forum_id, :user_group_id],
      where: "user_group_id IS NOT NULL",
      name: :forum_permissions_group_unique
    )
    create unique_index(:forum_permissions, [:forum_id, :applies_to],
      where: "user_group_id IS NULL",
      name: :forum_permissions_applies_to_unique
    )
    create index(:forum_permissions, [:forum_id])
    create index(:forum_permissions, [:user_group_id])

    # ==========================================================================
    # Permission Templates - Reusable permission presets
    # ==========================================================================
    create table(:permission_templates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all)  # null = global template
      add :name, :string, null: false
      add :description, :string
      add :is_system, :boolean, default: false  # System templates can't be deleted

      # Store all permissions as JSONB for flexibility
      add :permissions, :map, default: %{}

      timestamps()
    end

    create unique_index(:permission_templates, [:forum_id, :name])
    create index(:permission_templates, [:forum_id])

    # Add inherit_from_parent flag to boards
    alter table(:boards) do
      add :inherit_permissions, :boolean, default: true
    end

    # ==========================================================================
    # Permission check function for efficient lookups
    # ==========================================================================
    execute """
    CREATE OR REPLACE FUNCTION check_board_permission(
      p_user_id UUID,
      p_board_id UUID,
      p_permission TEXT
    )
    RETURNS BOOLEAN AS $$
    DECLARE
      v_forum_id UUID;
      v_user_group_id UUID;
      v_board_perm TEXT;
      v_forum_perm TEXT;
      v_group_perm BOOLEAN;
      v_result BOOLEAN;
    BEGIN
      -- Get the forum ID for this board
      SELECT forum_id INTO v_forum_id FROM boards WHERE id = p_board_id;
      IF v_forum_id IS NULL THEN
        RETURN FALSE;
      END IF;

      -- Get user's group in this forum
      SELECT user_group_id INTO v_user_group_id
      FROM forum_members
      WHERE user_id = p_user_id AND forum_id = v_forum_id;

      -- If user is not a member, check guest permissions
      IF v_user_group_id IS NULL THEN
        -- Check board-level guest permission
        EXECUTE format('SELECT %I FROM board_permissions WHERE board_id = $1 AND applies_to = ''guest''', p_permission)
        INTO v_board_perm USING p_board_id;

        IF v_board_perm = 'allow' THEN RETURN TRUE; END IF;
        IF v_board_perm = 'deny' THEN RETURN FALSE; END IF;

        -- Check forum-level guest permission
        EXECUTE format('SELECT %I FROM forum_permissions WHERE forum_id = $1 AND applies_to = ''guest''', p_permission)
        INTO v_forum_perm USING v_forum_id;

        IF v_forum_perm = 'allow' THEN RETURN TRUE; END IF;
        RETURN FALSE;  -- Default deny for guests
      END IF;

      -- Check board-level group permission
      EXECUTE format('SELECT %I FROM board_permissions WHERE board_id = $1 AND user_group_id = $2', p_permission)
      INTO v_board_perm USING p_board_id, v_user_group_id;

      IF v_board_perm = 'allow' THEN RETURN TRUE; END IF;
      IF v_board_perm = 'deny' THEN RETURN FALSE; END IF;

      -- Check forum-level group permission
      EXECUTE format('SELECT %I FROM forum_permissions WHERE forum_id = $1 AND user_group_id = $2', p_permission)
      INTO v_forum_perm USING v_forum_id, v_user_group_id;

      IF v_forum_perm = 'allow' THEN RETURN TRUE; END IF;
      IF v_forum_perm = 'deny' THEN RETURN FALSE; END IF;

      -- Fall back to user group default permission
      EXECUTE format('SELECT %I FROM forum_user_groups WHERE id = $1', p_permission)
      INTO v_group_perm USING v_user_group_id;

      RETURN COALESCE(v_group_perm, FALSE);
    END;
    $$ LANGUAGE plpgsql;
    """, """
    DROP FUNCTION IF EXISTS check_board_permission(UUID, UUID, TEXT);
    """

    # Insert default system permission templates
    execute """
    INSERT INTO permission_templates (id, name, description, is_system, permissions, inserted_at, updated_at)
    VALUES
      (gen_random_uuid(), 'Full Access', 'All permissions granted', true,
        '{"can_view": "allow", "can_create_threads": "allow", "can_reply": "allow", "can_edit_own_posts": "allow", "can_upload_attachments": "allow", "can_create_polls": "allow"}',
        NOW(), NOW()),
      (gen_random_uuid(), 'Read Only', 'View only, no posting', true,
        '{"can_view": "allow", "can_create_threads": "deny", "can_reply": "deny", "can_edit_own_posts": "deny"}',
        NOW(), NOW()),
      (gen_random_uuid(), 'No Access', 'Board is hidden', true,
        '{"can_view": "deny", "can_create_threads": "deny", "can_reply": "deny"}',
        NOW(), NOW()),
      (gen_random_uuid(), 'Reply Only', 'Can view and reply but not create threads', true,
        '{"can_view": "allow", "can_create_threads": "deny", "can_reply": "allow", "can_edit_own_posts": "allow"}',
        NOW(), NOW())
    ON CONFLICT DO NOTHING;
    """, ""
  end
end
