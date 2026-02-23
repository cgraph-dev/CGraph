defmodule CGraphWeb.Validation.ForumParams do
  @moduledoc """
  Validation helpers for forum create/update payloads.
  """

  use Ecto.Schema
  import Ecto.Changeset

  embedded_schema do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :title, :string
    field :is_public, :boolean, default: true
    field :is_nsfw, :boolean, default: false
  end

  @doc "Validates forum creation parameters."
  @spec validate_create(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_create(params) do
    %__MODULE__{}
    |> cast(params, [:name, :slug, :description, :title, :is_public, :is_nsfw], empty_values: [""])
    |> validate_required([:name])
    |> validate_length(:name, min: 1, max: 120)
    |> validate_optional_slug()
    |> put_default_if_nil(:is_public, true)
    |> put_default_if_nil(:is_nsfw, false)
    |> result_from_changeset()
  end

  @doc "Validates forum update parameters."
  @spec validate_update(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_update(params) do
    %__MODULE__{}
    |> cast(params, [:name, :slug, :description, :title, :is_public, :is_nsfw], empty_values: [""])
    |> validate_optional_slug()
    |> require_at_least_one([:name, :slug, :description, :title, :is_public, :is_nsfw])
    |> result_from_changeset()
  end

  defp validate_optional_slug(changeset) do
    case get_change(changeset, :slug) do
      nil -> changeset
      slug -> validate_change(changeset, :slug, fn _, _ -> slug_errors(slug) end)
    end
  end

  defp slug_errors(slug) do
    errors = []
    errors = if String.length(slug) > 120, do: [{:slug, "should be at most 120 characters"} | errors], else: errors
    errors = if String.match?(slug, ~r/^[a-zA-Z0-9-_]+$/), do: errors, else: [{:slug, "may only contain letters, numbers, hyphens, and underscores"} | errors]
    errors
  end

  defp put_default_if_nil(changeset, field, default) do
    case fetch_field(changeset, field) do
      {_data?, nil} -> put_change(changeset, field, default)
      _ -> changeset
    end
  end

  defp require_at_least_one(changeset, fields) do
    if Enum.any?(fields, &Map.has_key?(changeset.changes, &1)) do
      changeset
    else
      add_error(changeset, :base, "At least one field must be provided")
    end
  end

  defp result_from_changeset(%Ecto.Changeset{} = changeset) do
    case apply_action(changeset, :validate) do
      {:ok, struct} -> {:ok, to_map(struct)}
      {:error, cs} -> {:error, cs}
    end
  end

  defp to_map(%__MODULE__{} = struct) do
    struct
    |> Map.from_struct()
    |> Map.delete(:__meta__)
  end
end
