defmodule CGraph.Repo.Migrations.CreateCollaborationDocuments do
  use Ecto.Migration

  def change do
    create table(:collaboration_documents, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string, default: "Untitled Document", null: false
      add :owner_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :collaborator_ids, {:array, :binary_id}, default: []
      add :visibility, :string, default: "private", null: false
      add :yjs_state, :binary, default: ""
      add :doc_type, :string, default: "richtext", null: false
      add :version, :integer, default: 0, null: false
      add :last_edited_by, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps()
    end

    create index(:collaboration_documents, [:owner_id])
    create index(:collaboration_documents, [:visibility])
    create index(:collaboration_documents, [:updated_at])

    # GIN index for collaborator_ids array containment queries
    execute(
      "CREATE INDEX collaboration_documents_collaborator_ids_idx ON collaboration_documents USING GIN (collaborator_ids)",
      "DROP INDEX IF EXISTS collaboration_documents_collaborator_ids_idx"
    )
  end
end
