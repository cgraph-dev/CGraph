defmodule CGraph.Repo.Migrations.MakeEventIdNullableInUserEventProgress do
  use Ecto.Migration

  def change do
    alter table(:user_event_progress) do
      modify :event_id, :binary_id, null: true, from: {:binary_id, null: false}
    end
  end
end
