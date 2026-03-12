defmodule CGraph.Repo.Migrations.AddRequiredFieldsToThreadTemplates do
  use Ecto.Migration

  def change do
    alter table(:forum_thread_templates) do
      add :required_fields, {:array, :string}, default: [], null: false
    end
  end
end
