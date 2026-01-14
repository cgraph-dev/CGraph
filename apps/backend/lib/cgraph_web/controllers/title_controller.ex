defmodule CGraphWeb.TitleController do
  @moduledoc """
  Controller for title management.
  """
  use CGraphWeb, :controller

  alias CGraph.Gamification
  alias CGraph.Repo

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/titles
  List all available titles.
  """
  def index(conn, _params) do
    titles = Gamification.list_titles()
    user = conn.assigns.current_user
    user_titles = Gamification.list_user_titles(user.id)

    owned_title_ids =
      user_titles
      |> Enum.map(fn ut -> ut.title_id end)
      |> MapSet.new()

    titles_with_ownership = Enum.map(titles, fn title ->
      %{
        title: title,
        owned: MapSet.member?(owned_title_ids, title.id),
        equipped: user.equipped_title_id == title.id
      }
    end)

    conn
    |> put_status(:ok)
    |> render(:index, titles: titles_with_ownership)
  end

  @doc """
  GET /api/v1/titles/owned
  Get user's owned titles.
  """
  def owned(conn, _params) do
    user = conn.assigns.current_user
    user_titles = Gamification.list_user_titles(user.id)

    conn
    |> put_status(:ok)
    |> render(:owned, user_titles: user_titles, equipped_id: user.equipped_title_id)
  end

  @doc """
  POST /api/v1/titles/:id/equip
  Equip a title.
  """
  def equip(conn, %{"id" => title_id}) do
    user = conn.assigns.current_user

    case Gamification.equip_title(user.id, title_id) do
      {:ok, _updated_user} ->
        title = Repo.get!(Gamification.Title, title_id)

        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          equipped_title: %{
            id: title.id,
            name: title.name,
            color: title.color
          }
        })

      {:error, :not_owned} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "not_owned", message: "You don't own this title"})
    end
  end

  @doc """
  POST /api/v1/titles/:id/unequip
  Unequip the current title.
  """
  def unequip(conn, _params) do
    user = conn.assigns.current_user

    {:ok, _} =
      user
      |> Ecto.Changeset.change(%{equipped_title_id: nil})
      |> Repo.update()

    conn
    |> put_status(:ok)
    |> json(%{success: true})
  end

  @doc """
  POST /api/v1/titles/:id/purchase
  Purchase a purchasable title.
  """
  def purchase(conn, %{"id" => title_id}) do
    user = conn.assigns.current_user

    case Gamification.purchase_title(user, title_id) do
      {:ok, updated_user} ->
        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          coins: updated_user.coins,
          message: "Title purchased successfully"
        })

      {:error, :not_purchasable} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "not_purchasable", message: "This title cannot be purchased"})

      {:error, :insufficient_funds} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "insufficient_funds", message: "You don't have enough coins"})

      {:error, :already_owned} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "already_owned", message: "You already own this title"})
    end
  end
end
