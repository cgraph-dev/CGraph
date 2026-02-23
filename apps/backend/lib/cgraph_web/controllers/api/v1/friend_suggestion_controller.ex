defmodule CGraphWeb.API.V1.FriendSuggestionController do
  @moduledoc """
  Controller for friend suggestions based on mutual friends and shared groups.
  """
  use CGraphWeb, :controller

  alias CGraph.Accounts

  action_fallback CGraphWeb.FallbackController

  @doc """
  Get friend suggestions for the current user.
  Algorithm scores by: mutual_friends * 3 + shared_groups * 2
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user
    limit = Map.get(params, "limit", "10") |> String.to_integer() |> min(50)

    suggestions = Accounts.get_friend_suggestions(user, limit: limit)

    conn
    |> put_status(:ok)
    |> json(%{
      data: Enum.map(suggestions, fn s ->
        %{
          id: s.user.id,
          username: s.user.username,
          display_name: s.user.display_name,
          avatar_url: s.user.avatar_url,
          mutual_friends: s.mutual_friends,
          shared_groups: s.shared_groups,
          score: s.score
        }
      end)
    })
  end

  @doc """
  Dismiss a friend suggestion.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => suggested_user_id}) do
    user = conn.assigns.current_user

    Accounts.dismiss_friend_suggestion(user, suggested_user_id)
    send_resp(conn, :no_content, "")
  end
end
