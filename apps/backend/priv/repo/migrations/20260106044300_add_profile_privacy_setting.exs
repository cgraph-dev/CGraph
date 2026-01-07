defmodule Cgraph.Repo.Migrations.AddProfilePrivacySetting do
  use Ecto.Migration

  def change do
    alter table(:users) do
      # When true, non-friends see limited profile info ("Unknown")
      # Friends can always see full profile
      add :is_profile_private, :boolean, default: false, null: false
    end
  end
end
