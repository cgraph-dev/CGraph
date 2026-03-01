defmodule CGraphWeb.API.V1.ForumCustomizationController do
  @moduledoc """
  Controller for forum customization engine — 55 options across 8 categories.

  Provides endpoints to list available options, get/update per-forum configuration,
  preview changes, and reset categories to defaults.
  Authorization: forum admin or owner only.
  """
  use CGraphWeb, :controller

  alias CGraph.Forums
  alias CGraph.Forums.Customizations
  alias CGraph.Forums.CustomField

  action_fallback CGraphWeb.FallbackController

  # ===========================================================================
  # LIST OPTIONS (schema — no forum required)
  # ===========================================================================

  @doc """
  GET /api/v1/forums/:forum_id/customization/options
  Lists all 55 customization options with metadata (types, defaults, labels).
  """
  @spec list_options(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_options(conn, _params) do
    options = Customizations.list_options()
    count = Customizations.option_count()

    json(conn, %{
      data: %{
        options: options,
        categories: Customizations.categories(),
        total_options: count
      }
    })
  end

  # ===========================================================================
  # SHOW (current forum customization values)
  # ===========================================================================

  @doc """
  GET /api/v1/forums/:forum_id/customization
  Returns all customization option values for this forum, merged with defaults.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"forum_id" => forum_id}) do
    with {:ok, options} <- Customizations.get_options(forum_id) do
      json(conn, %{data: options})
    end
  end

  # ===========================================================================
  # UPDATE (per-category)
  # ===========================================================================

  @doc """
  PUT /api/v1/forums/:forum_id/customization/:category
  Updates customization options in a specific category.
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"forum_id" => forum_id, "category" => category} = params) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user),
         changes = Map.drop(params, ["forum_id", "category"]),
         {:ok, _forum} <- Customizations.update_options(forum_id, category, changes) do
      {:ok, updated} = Customizations.get_options(forum_id)
      json(conn, %{data: updated})
    end
  end

  # ===========================================================================
  # RESET CATEGORY
  # ===========================================================================

  @doc """
  DELETE /api/v1/forums/:forum_id/customization/:category
  Resets a category to its defaults.
  """
  @spec reset(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def reset(conn, %{"forum_id" => forum_id, "category" => category}) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user),
         {:ok, _forum} <- Customizations.reset_category(forum_id, category) do
      {:ok, updated} = Customizations.get_options(forum_id)
      json(conn, %{data: updated})
    end
  end

  # ===========================================================================
  # PREVIEW (returns merged options without saving)
  # ===========================================================================

  @doc """
  POST /api/v1/forums/:forum_id/customization/preview
  Returns the forum with preview changes applied (not persisted).
  """
  @spec preview(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def preview(conn, %{"forum_id" => forum_id} = params) do
    with {:ok, current} <- Customizations.get_options(forum_id) do
      preview_changes = Map.drop(params, ["forum_id"])
      # Deep merge preview changes on top of current
      merged = deep_merge_preview(current, preview_changes)
      json(conn, %{data: merged, preview: true})
    end
  end

  # ===========================================================================
  # CUSTOM FIELDS CRUD
  # ===========================================================================

  @doc "GET /api/v1/forums/:forum_id/custom-fields"
  @spec list_fields(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_fields(conn, %{"forum_id" => forum_id} = params) do
    target = params["target"]
    fields = CustomField.list_fields(forum_id, target: target)
    json(conn, %{data: Enum.map(fields, &field_json/1)})
  end

  @doc "POST /api/v1/forums/:forum_id/custom-fields"
  @spec create_field(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_field(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user),
         {:ok, field} <- CustomField.create_field(forum_id, params) do
      conn
      |> put_status(:created)
      |> json(%{data: field_json(field)})
    end
  end

  @doc "PUT /api/v1/forums/:forum_id/custom-fields/:id"
  @spec update_field(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_field(conn, %{"forum_id" => forum_id, "id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user),
         %CustomField{} = field <- CustomField.get_field(id),
         {:ok, updated} <- CustomField.update_field(field, params) do
      json(conn, %{data: field_json(updated)})
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  @doc "DELETE /api/v1/forums/:forum_id/custom-fields/:id"
  @spec delete_field(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_field(conn, %{"forum_id" => forum_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_forum(forum_id),
         :ok <- authorize_admin(forum, user),
         %CustomField{} = field <- CustomField.get_field(id),
         {:ok, _} <- CustomField.delete_field(field) do
      send_resp(conn, :no_content, "")
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  # ===========================================================================
  # PRIVATE HELPERS
  # ===========================================================================

  defp get_forum(forum_id) do
    case Forums.get_forum(forum_id) do
      nil -> {:error, :not_found}
      forum -> {:ok, forum}
    end
  end

  defp authorize_admin(forum, user) do
    if forum.owner_id == user.id || Forums.is_moderator?(forum.id, user.id) do
      :ok
    else
      {:error, :forbidden}
    end
  end

  defp deep_merge_preview(current, changes) do
    Enum.reduce(changes, current, fn {category_key, category_changes}, acc ->
      cat_atom = String.to_existing_atom(category_key)

      if Map.has_key?(acc, cat_atom) do
        merged_cat = Map.merge(acc[cat_atom] || %{}, category_changes)
        Map.put(acc, cat_atom, merged_cat)
      else
        acc
      end
    end)
  rescue
    ArgumentError -> current
  end

  defp field_json(%CustomField{} = f) do
    %{
      id: f.id,
      name: f.name,
      field_type: f.field_type,
      target: f.target,
      options: f.options,
      required: f.required,
      position: f.position,
      visible_to: f.visible_to,
      description: f.description,
      placeholder: f.placeholder,
      default_value: f.default_value,
      forum_id: f.forum_id,
      inserted_at: f.inserted_at,
      updated_at: f.updated_at
    }
  end
end
