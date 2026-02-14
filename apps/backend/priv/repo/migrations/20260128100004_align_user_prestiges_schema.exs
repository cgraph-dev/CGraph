defmodule CGraph.Repo.Migrations.AlignUserPrestigesSchema do
  use Ecto.Migration

  def change do
    alter table(:user_prestiges) do
      # Schema expects prestige_xp but migration created current_xp
      add_if_not_exists :prestige_xp, :integer, default: 0
      add_if_not_exists :xp_to_next_prestige, :integer, default: 100_000

      # Schema expects float fields but migration created decimal *_percent
      add_if_not_exists :xp_bonus, :float, default: 0.0
      add_if_not_exists :coin_bonus, :float, default: 0.0
      add_if_not_exists :karma_bonus, :float, default: 0.0
      add_if_not_exists :drop_rate_bonus, :float, default: 0.0

      # Schema expects these array fields
      add_if_not_exists :prestige_history, {:array, :map}, default: []
      add_if_not_exists :total_resets, :integer, default: 0
      add_if_not_exists :exclusive_titles, {:array, :binary_id}, default: []
      add_if_not_exists :exclusive_borders, {:array, :binary_id}, default: []
      add_if_not_exists :exclusive_effects, {:array, :binary_id}, default: []

      # Lifetime stats
      add_if_not_exists :lifetime_xp, :integer, default: 0
      add_if_not_exists :lifetime_karma, :integer, default: 0
      add_if_not_exists :lifetime_coins_earned, :integer, default: 0
      add_if_not_exists :lifetime_messages, :integer, default: 0
    end
  end
end
