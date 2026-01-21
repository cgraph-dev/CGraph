defmodule CGraph.Repo.Migrations.CreateUserCustomizations do
  use Ecto.Migration

  def change do
    create table(:user_customizations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      # Identity customizations
      add :avatar_border_id, :string, size: 50
      add :title_id, :string, size: 50
      add :equipped_badges, :jsonb, default: fragment("'[]'::jsonb")
      add :profile_layout, :string, size: 50, default: "classic"

      # Theme customizations
      add :profile_theme, :string, size: 50, default: "classic-purple"
      add :chat_theme, :string, size: 50, default: "default"
      add :forum_theme, :string, size: 50
      add :app_theme, :string, size: 50, default: "dark"

      # Chat styling customizations
      add :bubble_style, :string, size: 50, default: "default"
      add :message_effect, :string, size: 50, default: "none"
      add :reaction_style, :string, size: 50, default: "bounce"

      # Effects customizations
      add :particle_effect, :string, size: 50, default: "none"
      add :background_effect, :string, size: 50, default: "solid"
      add :animation_speed, :string, size: 50, default: "normal"

      timestamps(type: :utc_datetime)
    end

    create unique_index(:user_customizations, [:user_id])
  end
end
