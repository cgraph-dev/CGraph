defmodule CGraph.Repo.Migrations.AddOnboardingCompletedAtToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :onboarding_completed_at, :utc_datetime, null: true
    end
  end
end
