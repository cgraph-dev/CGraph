defmodule CGraph.Customizations do
  @moduledoc """
  Context for managing user customizations (avatar borders, titles, themes, effects, etc.).
  """

  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Customizations.UserCustomization

  @doc """
  Gets or creates user customizations for a given user.
  Returns default customizations if none exist.
  """
  def get_user_customizations(user_id) do
    case Repo.get_by(UserCustomization, user_id: user_id) do
      nil -> create_default_customizations(user_id)
      customization -> {:ok, customization}
    end
  end

  @doc """
  Creates default customizations for a user.
  """
  def create_default_customizations(user_id) do
    %UserCustomization{}
    |> UserCustomization.changeset(%{user_id: user_id})
    |> Repo.insert()
  end

  @doc """
  Updates user customizations.
  """
  def update_user_customizations(user_id, attrs) do
    case get_user_customizations(user_id) do
      {:ok, customization} ->
        customization
        |> UserCustomization.changeset(attrs)
        |> Repo.update()

      {:error, _} = error ->
        error
    end
  end

  @doc """
  Updates a specific customization field.
  """
  def update_customization_field(user_id, field, value) do
    update_user_customizations(user_id, %{field => value})
  end

  @doc """
  Deletes user customizations (resets to defaults).
  """
  def delete_user_customizations(user_id) do
    case Repo.get_by(UserCustomization, user_id: user_id) do
      nil -> {:error, :not_found}
      customization -> Repo.delete(customization)
    end
  end
end
