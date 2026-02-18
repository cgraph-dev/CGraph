defmodule CGraph.Repo.Migrations.AddSecondaryGroups do
  @moduledoc """
  Migration to add secondary groups support.

  This enables:
  - Users to belong to multiple groups in a forum
  - Primary group for display (username color, title)
  - Secondary groups for additional permissions
  - Group priority for permission resolution
  - Automatic group assignment based on criteria
  """
  use Ecto.Migration

  def change do
    # ==========================================================================
    # Member Secondary Groups - Junction table for many-to-many
    # ==========================================================================
    create table(:member_secondary_groups, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :member_id, references(:forum_members, type: :binary_id, on_delete: :delete_all), null: false
      add :user_group_id, references(:forum_user_groups, type: :binary_id, on_delete: :delete_all), null: false

      # Optional expiration (for temporary group membership)
      add :expires_at, :utc_datetime

      # Who granted this secondary group
      add :granted_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      # Reason for group assignment
      add :reason, :string

      timestamps()
    end

    create unique_index(:member_secondary_groups, [:member_id, :user_group_id])
    create index(:member_secondary_groups, [:member_id])
    create index(:member_secondary_groups, [:user_group_id])
    create index(:member_secondary_groups, [:expires_at])

    # ==========================================================================
    # Automatic Group Rules - Auto-assign groups based on criteria
    # ==========================================================================
    create table(:group_auto_rules, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_group_id, references(:forum_user_groups, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :description, :string

      # Rule type: "milestone", "custom", "subscription", "time_based"
      add :rule_type, :string, null: false

      # Whether this is enabled
      add :is_active, :boolean, default: true

      # Criteria (JSONB for flexibility)
      # Examples:
      # {"min_posts": 100}
      # {"min_reputation": 50}
      # {"min_threads": 10}
      # {"member_since_days": 365}
      # {"subscription_tier": "premium"}
      add :criteria, :map, default: %{}

      # Priority for evaluation order (lower = evaluated first)
      add :priority, :integer, default: 0

      # Whether to add as primary or secondary group
      add :assign_as, :string, default: "secondary"  # "primary" | "secondary"

      # Optional message to show user when group is assigned
      add :notification_message, :string

      timestamps()
    end

    create index(:group_auto_rules, [:user_group_id])
    create index(:group_auto_rules, [:is_active])
    create index(:group_auto_rules, [:priority])

    # ==========================================================================
    # Group display settings
    # ==========================================================================
    alter table(:forum_user_groups) do
      # Priority for permission stacking (higher = takes precedence)
      add :permission_priority, :integer, default: 0

      # Whether this group can be selected as display group
      add :can_be_display_group, :boolean, default: true

      # Badge/icon for the group
      add :badge_url, :string
      add :badge_text, :string

      # Group is hidden from public view
      add :is_hidden, :boolean, default: false

      # Maximum members in this group (null = unlimited)
      add :max_members, :integer

      # Group requirements
      add :requirements, :map, default: %{}
    end

    # Add display_group_id to forum_members (the group shown publicly)
    alter table(:forum_members) do
      add :display_group_id, references(:forum_user_groups, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:forum_members, [:display_group_id])

    # ==========================================================================
    # Permission stacking function
    # ==========================================================================
    # This function calculates effective permissions by stacking all groups
    # Higher priority groups override lower priority groups
    execute """
    CREATE OR REPLACE FUNCTION get_stacked_permission(
      p_member_id UUID,
      p_permission TEXT
    )
    RETURNS BOOLEAN AS $$
    DECLARE
      v_result BOOLEAN := FALSE;
      v_group_perm BOOLEAN;
      v_group RECORD;
    BEGIN
      -- Get all groups for this member (primary + secondary) ordered by priority
      FOR v_group IN (
        -- Primary group
        SELECT g.id, g.permission_priority
        FROM forum_members m
        JOIN forum_user_groups g ON g.id = m.user_group_id
        WHERE m.id = p_member_id

        UNION ALL

        -- Secondary groups
        SELECT g.id, g.permission_priority
        FROM member_secondary_groups msg
        JOIN forum_user_groups g ON g.id = msg.user_group_id
        WHERE msg.member_id = p_member_id
        AND (msg.expires_at IS NULL OR msg.expires_at > NOW())

        ORDER BY permission_priority DESC
      )
      LOOP
        -- Check this group's permission
        EXECUTE format('SELECT %I FROM forum_user_groups WHERE id = $1', p_permission)
        INTO v_group_perm USING v_group.id;

        -- If permission is granted by any group, result is true
        IF v_group_perm = TRUE THEN
          v_result := TRUE;
        END IF;
      END LOOP;

      RETURN v_result;
    END;
    $$ LANGUAGE plpgsql;
    """, """
    DROP FUNCTION IF EXISTS get_stacked_permission(UUID, TEXT);
    """

    # ==========================================================================
    # Trigger to clean up expired secondary groups
    # ==========================================================================
    execute """
    CREATE OR REPLACE FUNCTION cleanup_expired_secondary_groups()
    RETURNS TRIGGER AS $$
    BEGIN
      DELETE FROM member_secondary_groups
      WHERE expires_at IS NOT NULL AND expires_at < NOW();
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
    """, """
    DROP FUNCTION IF EXISTS cleanup_expired_secondary_groups();
    """
  end
end
