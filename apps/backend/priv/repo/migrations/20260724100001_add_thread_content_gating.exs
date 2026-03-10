defmodule CGraph.Repo.Migrations.AddThreadContentGating do
  use Ecto.Migration

  def change do
    alter table(:threads) do
      add :is_content_gated, :boolean, default: false
      add :gate_price_nodes, :integer
      add :gate_preview_chars, :integer, default: 300
      add :weighted_resonates, :decimal, precision: 10, scale: 2, default: 0
    end
  end
end
