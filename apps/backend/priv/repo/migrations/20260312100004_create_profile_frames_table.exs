defmodule CGraph.Repo.Migrations.CreateProfileFramesTable do
  @moduledoc """
  Creates the profile_frames table for the cosmetics unlock engine.

  Profile frames are decorative borders for profile cards. The manifest
  includes 55 frame designs across all 7 rarity tiers.
  """
  use Ecto.Migration

  def change do
    create_if_not_exists table(:profile_frames, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, size: 100, null: false
      add :name, :string, size: 200, null: false
      add :frame_url, :string, size: 500
      add :animated, :boolean, default: false, null: false
      add :rarity, :string, size: 20, null: false
      add :unlock_type, :string, size: 30, null: false
      add :unlock_condition, :map, default: %{}
      add :sort_order, :integer, default: 0, null: false
      add :is_active, :boolean, default: true, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create_if_not_exists unique_index(:profile_frames, [:slug])
    create_if_not_exists index(:profile_frames, [:rarity])
  end
end
