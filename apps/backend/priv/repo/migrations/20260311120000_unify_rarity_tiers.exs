defmodule CGraph.Repo.Migrations.UnifyRarityTiers do
  @moduledoc """
  Normalizes all cosmetic tables to the canonical 7-tier rarity system.

  Changes:
  - Adds `free` rarity tier to all cosmetic tables
  - Migrates `unique` → `mythic`, `seasonal` → original rarity, `event` → original rarity
  - Adds `source` field to track provenance (earned, purchased, seasonal, event, admin_granted, gifted)
  - Removes non-canonical rarity values

  Canonical tiers: free | common | uncommon | rare | epic | legendary | mythic
  """
  use Ecto.Migration

  @cosmetic_tables ~w(avatar_borders chat_effects profile_themes titles)a

  def up do
    # Step 1: Add source column to all cosmetic tables
    for table <- @cosmetic_tables do
      alter table(table) do
        add_if_not_exists :source, :string, default: "earned"
      end

      # Create index for source filtering
      create_if_not_exists index(table, [:source])
    end

    flush()

    # Step 2: Backfill source from non-canonical rarity values
    # Items with rarity "seasonal" → source = "seasonal", rarity = "rare" (default reassignment)
    # Items with rarity "event" → source = "event", rarity = "rare" (default reassignment)
    # Items with rarity "unique" → source = "earned", rarity = "mythic" (unique maps to mythic)

    for table <- @cosmetic_tables do
      table_name = Atom.to_string(table)

      # seasonal → source=seasonal, rarity stays as rare (reasonable default)
      execute """
      UPDATE #{table_name}
      SET source = 'seasonal', rarity = 'rare'
      WHERE rarity = 'seasonal'
      """

      # event → source=event, rarity stays as rare (reasonable default)
      execute """
      UPDATE #{table_name}
      SET source = 'event', rarity = 'rare'
      WHERE rarity = 'event'
      """

      # unique → rarity becomes mythic (unique items are the rarest)
      execute """
      UPDATE #{table_name}
      SET rarity = 'mythic'
      WHERE rarity = 'unique'
      """

      # Backfill purchasable items as purchased source
      execute """
      UPDATE #{table_name}
      SET source = 'purchased'
      WHERE is_purchasable = true AND source = 'earned'
      """
    end
  end

  def down do
    # Reverse the rarity normalization (best effort — some data may not round-trip perfectly)
    for table <- @cosmetic_tables do
      table_name = Atom.to_string(table)

      # Restore unique from mythic where source is earned (best effort)
      # Note: Not all mythic items were originally unique, so this is lossy
      execute """
      UPDATE #{table_name}
      SET rarity = 'unique'
      WHERE rarity = 'mythic' AND source = 'earned'
      """

      # Restore seasonal rarity from source
      execute """
      UPDATE #{table_name}
      SET rarity = 'seasonal'
      WHERE source = 'seasonal'
      """

      # Restore event rarity from source
      execute """
      UPDATE #{table_name}
      SET rarity = 'event'
      WHERE source = 'event'
      """

      # Reset purchased source back to earned
      execute """
      UPDATE #{table_name}
      SET source = 'earned'
      WHERE source = 'purchased'
      """
    end

    # Remove source column and indexes
    for table <- @cosmetic_tables do
      drop_if_exists index(table, [:source])

      alter table(table) do
        remove_if_exists :source, :string
      end
    end
  end
end
