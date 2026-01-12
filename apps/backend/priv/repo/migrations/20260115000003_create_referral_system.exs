defmodule Cgraph.Repo.Migrations.CreateReferralSystem do
  @moduledoc """
  Creates tables for the Referral system.
  
  Tables created:
  - referral_codes: User referral codes
  - referrals: Referral tracking
  - referral_reward_tiers: Reward tier definitions
  - referral_rewards: Claimed rewards
  """
  use Ecto.Migration

  def change do
    # Referral Codes
    create table(:referral_codes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :code, :string, null: false
      add :is_active, :boolean, default: true
      add :uses, :integer, default: 0
      add :max_uses, :integer

      timestamps(type: :utc_datetime)
    end

    create unique_index(:referral_codes, [:code])
    create unique_index(:referral_codes, [:user_id])

    # Referrals
    create table(:referrals, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :referrer_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :referred_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :code_used, :string
      add :status, :string, default: "pending"
      add :reward_earned, :integer, default: 0
      add :confirmed_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:referrals, [:referrer_id])
    create unique_index(:referrals, [:referred_id])
    create index(:referrals, [:status])
    create index(:referrals, [:inserted_at])

    # Reward Tiers
    create table(:referral_reward_tiers, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :text
      add :required_referrals, :integer, null: false
      add :reward_type, :string, null: false
      add :reward_value, :map
      add :icon, :string
      add :order, :integer, default: 0

      timestamps(type: :utc_datetime)
    end

    create unique_index(:referral_reward_tiers, [:name])
    create index(:referral_reward_tiers, [:required_referrals])

    # Claimed Rewards
    create table(:referral_rewards, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :tier_id, references(:referral_reward_tiers, type: :binary_id, on_delete: :delete_all), null: false
      add :status, :string, default: "claimed"

      timestamps(type: :utc_datetime)
    end

    create index(:referral_rewards, [:user_id])
    create unique_index(:referral_rewards, [:user_id, :tier_id])

    # Seed default reward tiers
    execute """
    INSERT INTO referral_reward_tiers (id, name, description, required_referrals, reward_type, reward_value, icon, "order", inserted_at, updated_at)
    VALUES 
      (gen_random_uuid(), 'Bronze Recruiter', 'Referred 5 members', 5, 'badge', '{"badge_id": "bronze_recruiter"}', '🥉', 1, NOW(), NOW()),
      (gen_random_uuid(), 'Silver Recruiter', 'Referred 10 members', 10, 'badge', '{"badge_id": "silver_recruiter"}', '🥈', 2, NOW(), NOW()),
      (gen_random_uuid(), 'Gold Recruiter', 'Referred 25 members', 25, 'badge', '{"badge_id": "gold_recruiter"}', '🥇', 3, NOW(), NOW()),
      (gen_random_uuid(), 'Diamond Recruiter', 'Referred 50 members', 50, 'title', '{"title": "Community Ambassador"}', '💎', 4, NOW(), NOW()),
      (gen_random_uuid(), 'Legendary Recruiter', 'Referred 100 members', 100, 'custom', '{"reward": "special_privileges"}', '👑', 5, NOW(), NOW())
    """, ""
  end
end
