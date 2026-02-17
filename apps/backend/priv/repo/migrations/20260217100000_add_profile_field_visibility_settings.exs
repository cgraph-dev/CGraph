defmodule CGraph.Repo.Migrations.AddProfileFieldVisibilitySettings do
  @moduledoc """
  Adds per-field profile visibility controls to user_settings.

  Matches mobile app's granular visibility controls:
  - show_last_active, show_post_count, show_join_date
  - show_bio, show_social_links, show_activity
  - show_in_member_list

  Follows Discord/Meta pattern of letting users control
  which profile fields are visible to others.
  """
  use Ecto.Migration

  def change do
    alter table(:user_settings) do
      add_if_not_exists :show_last_active, :boolean, default: true
      add_if_not_exists :show_post_count, :boolean, default: true
      add_if_not_exists :show_join_date, :boolean, default: true
      add_if_not_exists :show_bio, :boolean, default: true
      add_if_not_exists :show_social_links, :boolean, default: true
      add_if_not_exists :show_activity, :boolean, default: true
      add_if_not_exists :show_in_member_list, :boolean, default: true
    end
  end
end
