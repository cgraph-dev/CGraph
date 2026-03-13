defmodule CGraph.Customizations do
  @moduledoc """
  Context for managing user customizations (avatar borders, titles, themes, effects, etc.).
  """

  import Ecto.Query, warn: false
  alias CGraph.Customizations.UserCustomization
  alias CGraph.Repo

  @doc """
  Gets or creates user customizations for a given user.
  Returns default customizations if none exist.
  """
  @spec get_user_customizations(Ecto.UUID.t()) :: {:ok, UserCustomization.t()} | {:error, Ecto.Changeset.t()}
  def get_user_customizations(user_id) do
    case Repo.get_by(UserCustomization, user_id: user_id) do
      nil -> create_default_customizations(user_id)
      customization -> {:ok, customization}
    end
  end

  @doc """
  Gets the raw customization record for a user (nil if none exists).
  Used for presence broadcasts where we don't want to auto-create defaults.
  """
  @spec get_user_customization_record(Ecto.UUID.t()) :: UserCustomization.t() | nil
  def get_user_customization_record(user_id) do
    Repo.get_by(UserCustomization, user_id: user_id)
  end

  @doc """
  Batch-loads customizations for multiple users. Returns a map of user_id => customization.
  Used by presence to efficiently load customizations for all online friends.
  """
  @spec get_customizations_for_users(list(Ecto.UUID.t())) :: map()
  def get_customizations_for_users([]), do: %{}
  def get_customizations_for_users(user_ids) do
    from(c in UserCustomization, where: c.user_id in ^user_ids)
    |> Repo.all()
    |> Map.new(fn c -> {c.user_id, c} end)
  end

  @doc """
  Creates default customizations for a user.
  """
  @spec create_default_customizations(Ecto.UUID.t()) :: {:ok, UserCustomization.t()} | {:error, Ecto.Changeset.t()}
  def create_default_customizations(user_id) do
    %UserCustomization{}
    |> UserCustomization.changeset(%{user_id: user_id})
    |> Repo.insert()
  end

  @doc """
  Updates user customizations.
  """
  @spec update_user_customizations(Ecto.UUID.t(), map()) :: {:ok, UserCustomization.t()} | {:error, term()}
  def update_user_customizations(user_id, attrs) do
    case get_user_customizations(user_id) do
      {:ok, customization} ->
        merged_attrs = merge_custom_config(customization, attrs)

        customization
        |> UserCustomization.changeset(merged_attrs)
        |> Repo.update()

      {:error, _} = error ->
        error
    end
  end

  @doc """
  Updates a specific customization field.
  """
  @spec update_customization_field(Ecto.UUID.t(), atom() | String.t(), term()) :: {:ok, UserCustomization.t()} | {:error, term()}
  def update_customization_field(user_id, field, value) do
    update_user_customizations(user_id, %{field => value})
  end

  @doc """
  Deletes user customizations (resets to defaults).
  """
  @spec delete_user_customizations(Ecto.UUID.t()) :: {:ok, UserCustomization.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def delete_user_customizations(user_id) do
    case Repo.get_by(UserCustomization, user_id: user_id) do
      nil -> {:error, :not_found}
      customization -> Repo.delete(customization)
    end
  end

  # Merge custom_config maps for partial updates without overwriting other keys.
  defp merge_custom_config(customization, attrs) do
    current_config = customization.custom_config || %{}

    cond do
      Map.has_key?(attrs, "custom_config") and is_map(attrs["custom_config"]) ->
        Map.put(attrs, "custom_config", Map.merge(current_config, attrs["custom_config"]))

      Map.has_key?(attrs, :custom_config) and is_map(attrs[:custom_config]) ->
        Map.put(attrs, :custom_config, Map.merge(current_config, attrs[:custom_config]))

      true ->
        attrs
    end
  end
end
