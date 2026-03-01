defmodule CGraph.Repo.Migrations.AddForumCustomFields do
  @moduledoc """
  Adds forum_custom_fields table and customization_options JSONB column to forums.
  """
  use Ecto.Migration

  def change do
    # Add customization_options JSONB column to forums
    alter table(:forums) do
      add :customization_options, :map, default: %{}, null: false
    end

    # Create custom fields table
    create table(:forum_custom_fields, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :field_type, :string, null: false, default: "text"
      add :target, :string, null: false, default: "thread"
      add :options, {:array, :string}, default: []
      add :required, :boolean, default: false
      add :position, :integer, default: 0
      add :visible_to, :string, default: "all"
      add :description, :string
      add :placeholder, :string
      add :default_value, :string

      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime_usec)
    end

    create index(:forum_custom_fields, [:forum_id])
    create index(:forum_custom_fields, [:forum_id, :target])
    create unique_index(:forum_custom_fields, [:forum_id, :name, :target])
  end
end
