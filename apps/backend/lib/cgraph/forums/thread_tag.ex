defmodule CGraph.Forums.ThreadTag do
  @moduledoc """
  Schema for tags applied to threads.

  A thread tag links a thread to a tag category with a specific tag name.
  Tracks who applied the tag and when.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @derive {Jason.Encoder,
           only: [:id, :tag_name, :applied_at, :inserted_at]}

  schema "forum_thread_tags" do
    field :tag_name, :string
    field :applied_at, :utc_datetime
    field :applied_by, :binary_id

    belongs_to :thread, CGraph.Forums.Thread
    belongs_to :tag_category, CGraph.Forums.TagCategory

    timestamps()
  end

  @required_fields ~w(tag_name thread_id tag_category_id applied_by)a
  @optional_fields ~w(applied_at)a

  @doc "Changeset for creating or updating a thread tag."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(tag, attrs) do
    now = DateTime.truncate(DateTime.utc_now(), :second)

    tag
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:tag_name, min: 1, max: 100)
    |> put_default(:applied_at, now)
    |> unique_constraint([:thread_id, :tag_name])
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:tag_category_id)
  end

  defp put_default(changeset, field, value) do
    if get_field(changeset, field) do
      changeset
    else
      put_change(changeset, field, value)
    end
  end
end
