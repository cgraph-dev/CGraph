defmodule CGraph.Forums.CustomField do
  @moduledoc """
  Custom field schema for forum threads, posts, and profiles.

  Forum admins can define custom fields that appear on threads, posts,
  or user profiles within their forum. Supports text, number, select,
  checkbox, date, and url field types.
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Repo

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @type t :: %__MODULE__{}

  @field_types ~w(text number select checkbox date url)
  @targets ~w(thread post profile)
  @visibility_levels ~w(all members mods admins)

  schema "forum_custom_fields" do
    field :name, :string
    field :field_type, :string, default: "text"
    field :target, :string, default: "thread"
    field :options, {:array, :string}, default: []
    field :required, :boolean, default: false
    field :position, :integer, default: 0
    field :visible_to, :string, default: "all"
    field :description, :string
    field :placeholder, :string
    field :default_value, :string

    belongs_to :forum, CGraph.Forums.Forum

    timestamps()
  end

  @doc "Builds a changeset for creating/updating a custom field."
  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(field, attrs) do
    field
    |> cast(attrs, [
      :name, :field_type, :target, :options, :required,
      :position, :visible_to, :description, :placeholder,
      :default_value, :forum_id
    ])
    |> validate_required([:name, :field_type, :target, :forum_id])
    |> validate_inclusion(:field_type, @field_types)
    |> validate_inclusion(:target, @targets)
    |> validate_inclusion(:visible_to, @visibility_levels)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:description, max: 500)
    |> validate_select_options()
    |> unique_constraint([:forum_id, :name, :target])
    |> foreign_key_constraint(:forum_id)
  end

  # Validates that select fields have at least one option
  defp validate_select_options(changeset) do
    field_type = get_field(changeset, :field_type)
    options = get_field(changeset, :options)

    if field_type == "select" && (is_nil(options) || options == []) do
      add_error(changeset, :options, "must have at least one option for select fields")
    else
      changeset
    end
  end

  # ===========================================================================
  # CONTEXT FUNCTIONS
  # ===========================================================================

  @doc "Creates a custom field for a forum."
  @spec create_field(Ecto.UUID.t(), map()) :: {:ok, t()} | {:error, Ecto.Changeset.t()}
  def create_field(forum_id, attrs) do
    %__MODULE__{}
    |> changeset(Map.put(attrs, "forum_id", forum_id))
    |> Repo.insert()
  end

  @doc "Updates an existing custom field."
  @spec update_field(t(), map()) :: {:ok, t()} | {:error, Ecto.Changeset.t()}
  def update_field(%__MODULE__{} = field, attrs) do
    field
    |> changeset(attrs)
    |> Repo.update()
  end

  @doc "Deletes a custom field."
  @spec delete_field(t()) :: {:ok, t()} | {:error, Ecto.Changeset.t()}
  def delete_field(%__MODULE__{} = field) do
    Repo.delete(field)
  end

  @doc "Lists all custom fields for a forum, optionally filtered by target."
  @spec list_fields(Ecto.UUID.t(), keyword()) :: [t()]
  def list_fields(forum_id, opts \\ []) do
    target = Keyword.get(opts, :target)

    __MODULE__
    |> where(forum_id: ^forum_id)
    |> then(fn query ->
      if target, do: where(query, target: ^target), else: query
    end)
    |> order_by(asc: :position, asc: :inserted_at)
    |> Repo.all()
  end

  @doc "Gets a single custom field by ID."
  @spec get_field(Ecto.UUID.t()) :: t() | nil
  def get_field(id) do
    Repo.get(__MODULE__, id)
  end
end
