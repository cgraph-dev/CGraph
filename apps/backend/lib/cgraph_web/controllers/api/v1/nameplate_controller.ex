defmodule CGraphWeb.API.V1.NameplateController do
  @moduledoc """
  Controller for nameplate cosmetic endpoints.

  Provides listing, detail, per-user nameplate retrieval, and
  settings management under `/api/v1/`.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Cosmetics

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/nameplates
  Lists all active nameplates, optionally filtered by rarity.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    opts = if params["rarity"], do: [rarity: params["rarity"]], else: []
    nameplates = Cosmetics.list_nameplates(opts)

    render_data(conn, %{
      nameplates: Enum.map(nameplates, &serialize_nameplate/1),
      total: length(nameplates)
    })
  end

  @doc """
  GET /api/v1/nameplates/:id
  Returns a single nameplate by ID.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => id}) do
    case Cosmetics.get_nameplate(id) do
      nil -> render_error(conn, :not_found, "Nameplate not found")
      nameplate -> render_data(conn, serialize_nameplate(nameplate))
    end
  end

  @doc """
  GET /api/v1/users/:id/nameplates
  Returns nameplates owned by a specific user.
  """
  @spec user_nameplates(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def user_nameplates(conn, %{"id" => user_id}) do
    nameplates = Cosmetics.list_user_nameplates(user_id)

    render_data(conn, %{
      nameplates: Enum.map(nameplates, &serialize_user_nameplate/1),
      total: length(nameplates)
    })
  end

  @doc """
  PUT /api/v1/nameplates/settings
  Updates the current user's nameplate display settings.
  """
  @spec update_settings(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_settings(conn, params) do
    user = conn.assigns.current_user

    settings_params =
      params
      |> Map.take(["nameplate_id", "custom_text_color", "custom_border_color", "layout"])

    case Cosmetics.update_nameplate_settings(user.id, settings_params) do
      {:ok, settings} ->
        render_data(conn, serialize_settings(settings))

      {:error, changeset} ->
        render_error(conn, :unprocessable_entity, format_changeset_error(changeset))
    end
  end

  # ==================== PRIVATE ====================

  defp serialize_nameplate(nameplate) do
    %{
      id: nameplate.id,
      slug: nameplate.slug,
      name: nameplate.name,
      backgroundUrl: nameplate.background_url,
      textColor: nameplate.text_color,
      borderStyle: nameplate.border_style,
      rarity: nameplate.rarity,
      unlockType: nameplate.unlock_type,
      animated: nameplate.animated,
      sortOrder: nameplate.sort_order
    }
  end

  defp serialize_user_nameplate(%{nameplate: nameplate} = entry) do
    %{
      inventoryId: entry.inventory_id,
      nameplate: serialize_nameplate(nameplate),
      equippedAt: entry.equipped_at,
      obtainedAt: entry.obtained_at,
      obtainedVia: entry.obtained_via
    }
  end

  defp serialize_settings(settings) do
    %{
      id: settings.id,
      nameplateId: settings.nameplate_id,
      customTextColor: settings.custom_text_color,
      customBorderColor: settings.custom_border_color,
      layout: settings.layout
    }
  end

  defp format_changeset_error(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
    |> Enum.map_join(", ", fn {field, errors} -> "#{field}: #{Enum.join(errors, ", ")}" end)
  end
end
