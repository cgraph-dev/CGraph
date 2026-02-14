defmodule CGraph.Repo.Migrations.AddMissingColumnsRound2 do
  use Ecto.Migration

  def change do
    # Create battle_pass_tiers table if not exists
    create_if_not_exists table(:battle_pass_tiers, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :tier_number, :integer
      add :xp_required, :integer, default: 0
      add :free_reward_type, :string
      add :free_reward_id, :binary_id
      add :free_reward_amount, :integer, default: 0
      add :premium_reward_type, :string
      add :premium_reward_id, :binary_id
      add :premium_reward_amount, :integer, default: 0
      add :seasonal_event_id, references(:seasonal_events, type: :binary_id, on_delete: :delete_all)
      timestamps(type: :utc_datetime)
    end

    # Create prestige_rewards table if not exists
    create_if_not_exists table(:prestige_rewards, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :prestige_level, :integer
      add :reward_type, :string
      add :reward_id, :binary_id
      add :reward_amount, :integer, default: 0
      add :reward_name, :string
      add :reward_description, :string
      timestamps(type: :utc_datetime)
    end

    # unlock_data missing from user_profile_themes
    alter table(:user_profile_themes) do
      add_if_not_exists :unlock_data, :map, default: %{}
    end

    # unlock_data missing from user_chat_effects
    alter table(:user_chat_effects) do
      add_if_not_exists :unlock_data, :map, default: %{}
    end

    # claimed_free_rewards and claimed_premium_rewards missing from user_event_progress
    alter table(:user_event_progress) do
      add_if_not_exists :claimed_free_rewards, {:array, :integer}, default: []
      add_if_not_exists :claimed_premium_rewards, {:array, :integer}, default: []
    end

    # xp_multiplier missing from user_prestiges
    alter table(:user_prestiges) do
      add_if_not_exists :xp_multiplier, :float, default: 1.0
    end

    # signature missing from users
    alter table(:users) do
      add_if_not_exists :signature, :text
      add_if_not_exists :views, :integer, default: 0
    end

    # thread_id missing from forum_subscriptions
    alter table(:forum_subscriptions) do
      add_if_not_exists :thread_id, :binary_id
      add_if_not_exists :board_id, :binary_id
    end

    # status field alias for marketplace_items (some code uses :status instead of :listing_status)
    # Not adding - will fix in schema with virtual field

    # event_id alias for user_event_progress (some tests use event_id instead of seasonal_event_id)
    # Not adding - will fix in schema
  end
end
