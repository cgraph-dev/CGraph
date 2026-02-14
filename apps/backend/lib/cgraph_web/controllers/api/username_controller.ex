defmodule CGraphWeb.API.UsernameController do
  @moduledoc """
  API controller for username management.
  """

  use CGraphWeb, :controller

  alias CGraph.Accounts.UsernameService

  action_fallback CGraphWeb.FallbackController

  @doc """
  Check if a username is available.
  GET /api/users/check-username?username=xxx
  """
  def check_availability(conn, %{"username" => username}) do
    # Validate format first
    if valid_username_format?(username) do
      # Check if taken
      if UsernameService.username_taken?(username) do
        json(conn, %{available: false, reason: "Username is already taken"})
      # Check if recently released
      else if UsernameService.username_recently_released?(username) do
        json(conn, %{available: false, reason: "Username was recently released and is reserved"})
      else
        json(conn, %{available: true})
      end
      end
    else
      json(conn, %{
        available: false,
        reason: "Invalid format. Use 3-32 characters: letters, numbers, _ and - only"
      })
    end
  end

  @doc """
  Change the current user's username.
  POST /api/users/me/change-username
  """
  def change_username(conn, %{"username" => new_username}) do
    user = conn.assigns.current_user
    is_premium = user.subscription_tier not in [nil, "free"]

    case UsernameService.change_username(user.id, new_username, premium: is_premium) do
      {:ok, updated_user} ->
        json(conn, %{
          success: true,
          user: %{
            id: updated_user.id,
            username: updated_user.username,
            last_username_change_at: updated_user.last_username_change_at
          }
        })

      {:error, {:cooldown, days}} ->
        conn
        |> put_status(:too_many_requests)
        |> json(%{
          success: false,
          error: "cooldown",
          message: "You can change your username in #{days} days",
          days_remaining: days
        })

      {:error, :username_taken} ->
        conn
        |> put_status(:conflict)
        |> json(%{
          success: false,
          error: "taken",
          message: "Username is already taken"
        })

      {:error, :username_recently_released} ->
        conn
        |> put_status(:conflict)
        |> json(%{
          success: false,
          error: "reserved",
          message: "Username was recently released and is reserved for 30 days"
        })

      {:error, changeset} when is_struct(changeset, Ecto.Changeset) ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          success: false,
          error: "validation",
          message: "Invalid username format"
        })
    end
  end

  @doc """
  Get username change history for the current user.
  GET /api/users/me/username-history
  """
  def history(conn, _params) do
    user = conn.assigns.current_user

    history =
      UsernameService.get_history(user.id)
      |> Enum.map(fn change ->
        %{
          id: change.id,
          oldUsername: change.old_username,
          newUsername: change.new_username,
          changedAt: change.inserted_at,
          changedByAdmin: change.changed_by_admin
        }
      end)

    json(conn, %{history: history})
  end

  @doc """
  Get cooldown status for the current user.
  GET /api/users/me/username-cooldown
  """
  def cooldown_status(conn, _params) do
    user = conn.assigns.current_user
    is_premium = user.subscription_tier not in [nil, "free"]

    case UsernameService.can_change_username?(user.id, is_premium) do
      {:ok, _} ->
        json(conn, %{
          can_change: true,
          days_remaining: 0,
          cooldown_days: if(is_premium, do: 7, else: 30)
        })

      {:error, {:cooldown, days}} ->
        json(conn, %{
          can_change: false,
          days_remaining: days,
          cooldown_days: if(is_premium, do: 7, else: 30)
        })
    end
  end

  defp valid_username_format?(username) do
    Regex.match?(~r/^[a-zA-Z0-9_-]{3,32}$/, username)
  end
end
