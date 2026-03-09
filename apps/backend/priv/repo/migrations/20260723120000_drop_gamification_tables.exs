defmodule CGraph.Repo.Migrations.DropGamificationTables do
  @moduledoc """
  Drop defunct gamification tables removed during the v2.0 pivot.

  Systems removed: XP transactions, quests, leaderboards, marketplace,
  prestige, seasonal events, battle pass. Achievement and cosmetic
  tables are intentionally kept.
  """
  use Ecto.Migration

  def change do
    # XP system tables
    drop_if_exists table(:xp_transactions)
    drop_if_exists table(:xp_configs)
    drop_if_exists table(:daily_caps)

    # Quest system tables
    drop_if_exists table(:user_quests)
    drop_if_exists table(:quests)

    # Prestige tables
    drop_if_exists table(:prestige_rewards)
    drop_if_exists table(:user_prestige)

    # Seasonal event tables
    drop_if_exists table(:user_event_progress)
    drop_if_exists table(:battle_pass_tiers)
    drop_if_exists table(:seasonal_events)

    # Marketplace tables
    drop_if_exists table(:marketplace_items)

    # Leaderboard tables
    drop_if_exists table(:leaderboard_entries)

    # Feature gate tables
    drop_if_exists table(:feature_gate_configs)

    # Coin transaction tables (coins balance stays on users table)
    drop_if_exists table(:coin_transactions)
  end
end
