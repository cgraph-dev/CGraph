defmodule CGraph.Forums.ThreadTemplate do
  @moduledoc """
  Schema for thread templates within a forum.

  Templates define structured formats for new threads, specifying
  required title patterns, content sections, and field requirements.

  ## Structure format (JSONB)

      %{
        "title" => "Bug Report: [component]",
        "sections" => [
          %{"name" => "Description", "required" => true, "placeholder" => "Describe the bug..."},
          %{"name" => "Steps to Reproduce", "required" => true, "placeholder" => "1. ..."},
          %{"name" => "Expected Behavior", "required" => false, "placeholder" => "What should happen"}
        ],
        "required" => ["title", "description"]
      }
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @derive {Jason.Encoder,
           only: [:id, :name, :structure, :is_default, :inserted_at, :updated_at]}

  schema "forum_thread_templates" do
    field :name, :string
    field :structure, :map, default: %{}
    field :is_default, :boolean, default: false

    belongs_to :forum, CGraph.Forums.Forum

    timestamps()
  end

  @required_fields ~w(name forum_id)a
  @optional_fields ~w(structure is_default)a

  @doc "Changeset for creating or updating a thread template."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(template, attrs) do
    template
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:name, min: 1, max: 200)
    |> validate_structure()
    |> unique_constraint([:forum_id, :name])
    |> foreign_key_constraint(:forum_id)
  end

  defp validate_structure(changeset) do
    case get_field(changeset, :structure) do
      nil -> changeset
      %{} -> changeset
      _ -> add_error(changeset, :structure, "must be a map")
    end
  end
end
