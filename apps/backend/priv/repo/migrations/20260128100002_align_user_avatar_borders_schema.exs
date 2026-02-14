defmodule CGraph.Repo.Migrations.AlignUserAvatarBordersSchema do
  @moduledoc """
  Adds missing columns to user_avatar_borders to match the Ecto schema.
  The schema has: unlock_source, unlock_data, custom_colors, custom_animation_speed, avatar_border_id
  The table has: border_id, acquisition_type, acquisition_source, custom_primary_color, etc.
  """
  use Ecto.Migration

  def change do
    alter table(:user_avatar_borders) do
      add_if_not_exists :unlock_source, :string
      add_if_not_exists :unlock_data, :map, default: %{}
      add_if_not_exists :custom_colors, {:array, :string}, default: []
      add_if_not_exists :custom_animation_speed, :float
      add_if_not_exists :avatar_border_id, references(:avatar_borders, type: :binary_id, on_delete: :nilify_all)
    end
  end
end
