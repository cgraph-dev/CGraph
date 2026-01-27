defmodule CGraph.Repo.Migrations.AddStripeCustomerId do
  @moduledoc """
  Adds stripe_customer_id field to users table for Stripe integration.
  """
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :stripe_customer_id, :string
    end

    # Index for fast lookup by Stripe customer ID
    create index(:users, [:stripe_customer_id])
  end
end
