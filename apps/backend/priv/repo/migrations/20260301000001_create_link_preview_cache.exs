defmodule CGraph.Repo.Migrations.CreateLinkPreviewCache do
  use Ecto.Migration

  def change do
    create table(:link_preview_cache, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :url_hash, :string, null: false
      add :url, :text, null: false
      add :title, :string
      add :description, :text
      add :image_url, :text
      add :favicon_url, :text
      add :site_name, :string
      add :og_type, :string
      add :fetched_at, :utc_datetime, null: false
      add :expires_at, :utc_datetime, null: false

      timestamps()
    end

    create unique_index(:link_preview_cache, [:url_hash])
    create index(:link_preview_cache, [:expires_at])
  end
end
