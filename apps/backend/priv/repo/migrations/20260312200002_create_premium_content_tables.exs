defmodule CGraph.Repo.Migrations.CreatePremiumContentTables do
  use Ecto.Migration

  def change do
    create table(:premium_threads, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :price_nodes, :integer, null: false
      add :subscriber_only, :boolean, default: false, null: false
      add :preview_length, :integer, default: 200, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:premium_threads, [:thread_id])
    create index(:premium_threads, [:creator_id])

    create table(:subscription_tiers, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :creator_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :price_monthly_nodes, :integer, null: false
      add :benefits, :map
      add :max_subscribers, :integer
      add :active, :boolean, default: true, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:subscription_tiers, [:creator_id])
    create index(:subscription_tiers, [:forum_id])

    create table(:revenue_splits, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_share, :decimal, null: false
      add :platform_share, :decimal, null: false
      add :referral_share, :decimal, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:revenue_splits, [:thread_id])
  end
end
