defmodule CGraph.Collaboration.Document do
  @moduledoc """
  Ecto schema for collaborative documents.

  Stores the Yjs binary state and metadata.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "collaboration_documents" do
    field :title, :string, default: "Untitled Document"
    field :owner_id, :binary_id
    field :collaborator_ids, {:array, :binary_id}, default: []
    field :visibility, Ecto.Enum, values: [:private, :shared, :public], default: :private

    # Yjs document state (binary)
    field :yjs_state, :binary, default: <<>>

    # Document type — supports different Yjs doc schemas
    field :doc_type, Ecto.Enum,
      values: [:richtext, :code, :whiteboard, :notes],
      default: :richtext

    # Version tracking
    field :version, :integer, default: 0
    field :last_edited_by, :binary_id

    timestamps()
  end

  def changeset(document, attrs) do
    document
    |> cast(attrs, [
      :title, :owner_id, :collaborator_ids, :visibility,
      :yjs_state, :doc_type, :version, :last_edited_by
    ])
    |> validate_required([:owner_id])
    |> validate_length(:title, max: 500)
  end
end
