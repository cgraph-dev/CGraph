defmodule Cgraph.Repo.Migrations.AddMissingUserFields do
  @moduledoc """
  Add missing user profile fields that exist in schema but not in database.
  """
  use Ecto.Migration

  def change do
    alter table(:users) do
      # Status message for custom user status display
      add_if_not_exists :status_message, :string, size: 255
    end
  end
end
