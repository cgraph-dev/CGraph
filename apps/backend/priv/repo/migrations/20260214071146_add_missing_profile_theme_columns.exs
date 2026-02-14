defmodule CGraph.Repo.Migrations.AddMissingProfileThemeColumns do
  use Ecto.Migration

  def change do
    alter table(:profile_themes) do
      add_if_not_exists :background_type, :string, default: "solid"
      add_if_not_exists :layout_type, :string, default: "detailed"
      add_if_not_exists :layout_config, :map, default: %{}
      add_if_not_exists :hover_effect, :string, default: "scale"
      add_if_not_exists :border_radius, :string, default: "md"
      add_if_not_exists :effects_config, :map, default: %{}
      add_if_not_exists :font_family, :string, default: "Inter"
      add_if_not_exists :typography_config, :map, default: %{}
    end

    # Also add missing columns to user_chat_effects and user_profile_themes
    alter table(:user_chat_effects) do
      add_if_not_exists :unlock_source, :string, default: "default"
    end

    alter table(:user_profile_themes) do
      add_if_not_exists :unlock_source, :string, default: "default"
    end

    alter table(:user_event_progress) do
      add_if_not_exists :has_battle_pass, :boolean, default: false
    end
  end
end
