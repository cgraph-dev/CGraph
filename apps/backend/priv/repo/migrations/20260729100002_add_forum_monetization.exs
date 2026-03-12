defmodule CGraph.Repo.Migrations.AddForumMonetization do
  use Ecto.Migration

  def change do
    # =========================================================================
    # Migrate monetization_enabled boolean → monetization_type enum string
    # =========================================================================
    alter table(:forums) do
      add :monetization_type, :string, default: "free"
    end

    flush()

    execute(
      "UPDATE forums SET monetization_type = 'gated' WHERE monetization_enabled = true",
      "UPDATE forums SET monetization_enabled = true WHERE monetization_type = 'gated'"
    )

    execute(
      "UPDATE forums SET monetization_type = 'free' WHERE monetization_enabled = false OR monetization_enabled IS NULL",
      "UPDATE forums SET monetization_enabled = false WHERE monetization_type = 'free'"
    )

    alter table(:forums) do
      remove :monetization_enabled, :boolean, default: false
    end

    # =========================================================================
    # Forum monetization tiers
    # =========================================================================
    create table(:forum_monetization_tiers, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all),
        null: false

      add :name, :string, null: false
      add :monthly_price_nodes, :integer, null: false
      add :yearly_price_nodes, :integer
      add :features, :map, default: %{}
      add :sort_order, :integer, default: 0

      timestamps(type: :utc_datetime)
    end

    create index(:forum_monetization_tiers, [:forum_id, :sort_order])
    create unique_index(:forum_monetization_tiers, [:forum_id, :name])
  end
end
