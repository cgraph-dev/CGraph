defmodule CGraphWeb.API.V1.ForumMonetizationController do
  @moduledoc """
  Controller for forum monetization settings and tier management.

  All actions require forum owner or admin role.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Forums.ForumMonetization
  alias CGraph.Forums.Forum
  alias CGraph.Repo

  action_fallback CGraphWeb.FallbackController

  @doc "GET /api/v1/forums/:forum_id/monetization — Get monetization settings."
  def show(conn, %{"forum_id" => forum_id}) do
    user = conn.assigns.current_user

    with {:ok, _forum} <- authorize_forum_owner(forum_id, user) do
      settings = ForumMonetization.get_settings(forum_id)
      render_data(conn, %{monetization: settings})
    end
  end

  @doc "PUT /api/v1/forums/:forum_id/monetization — Set monetization mode."
  def update(conn, %{"forum_id" => forum_id, "type" => type}) do
    user = conn.assigns.current_user

    with {:ok, _forum} <- authorize_forum_owner(forum_id, user) do
      case ForumMonetization.set_mode(forum_id, type) do
        {:ok, forum} ->
          render_data(conn, %{forum: %{id: forum.id, monetization_type: forum.monetization_type}})

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc "POST /api/v1/forums/:forum_id/monetization/tiers — Create a tier."
  def create_tier(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user

    with {:ok, _forum} <- authorize_forum_owner(forum_id, user) do
      attrs = Map.drop(params, ["forum_id"])

      case ForumMonetization.create_tier(forum_id, attrs) do
        {:ok, tier} ->
          conn
          |> put_status(:created)
          |> render_data(%{tier: tier})

        {:error, :max_tiers_reached} ->
          render_error(conn, :unprocessable_entity, "Maximum of 3 tiers allowed per forum")

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc "PUT /api/v1/forums/:forum_id/monetization/tiers/:id — Update a tier."
  def update_tier(conn, %{"forum_id" => forum_id, "id" => tier_id} = params) do
    user = conn.assigns.current_user

    with {:ok, _forum} <- authorize_forum_owner(forum_id, user) do
      attrs = Map.drop(params, ["forum_id", "id"])

      case ForumMonetization.update_tier(tier_id, attrs) do
        {:ok, tier} ->
          render_data(conn, %{tier: tier})

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc "DELETE /api/v1/forums/:forum_id/monetization/tiers/:id — Delete a tier."
  def delete_tier(conn, %{"forum_id" => forum_id, "id" => tier_id}) do
    user = conn.assigns.current_user

    with {:ok, _forum} <- authorize_forum_owner(forum_id, user) do
      case ForumMonetization.delete_tier(tier_id) do
        {:ok, _tier} ->
          render_data(conn, %{deleted: true})

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  # ── Helpers ──────────────────────────────────────────────────────

  defp authorize_forum_owner(forum_id, user) do
    case Repo.get(Forum, forum_id) do
      nil ->
        {:error, :not_found}

      %Forum{owner_id: owner_id} = forum when owner_id == user.id ->
        {:ok, forum}

      %Forum{} ->
        if user.role in ~w(admin superadmin) do
          {:ok, Repo.get!(Forum, forum_id)}
        else
          {:error, :forbidden}
        end
    end
  end
end
