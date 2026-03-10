defmodule CGraphWeb.API.V1.UserJSON do
  @moduledoc """
  JSON rendering for user responses.
  """
  alias CGraph.Accounts.User

  @doc "Renders a list of resources as JSON."
  @spec index(map()) :: map()
  def index(%{users: users, meta: meta}) do
    %{
      data: Enum.map(users, &user_data/1),
      meta: meta
    }
  end

  @doc "Renders a single resource as JSON."
  @spec show(map()) :: map()
  def show(%{user: user, is_friend: is_friend, friend_request_sent: friend_request_sent, friend_request_received: friend_request_received}) do
    %{data: user_data(user)
      |> Map.put(:is_friend, is_friend || false)
      |> Map.put(:friend_request_sent, friend_request_sent || false)
      |> Map.put(:friend_request_received, friend_request_received || false)
    }
  end

  def show(%{user: user}) do
    %{data: user_data(user)}
  end

  @doc "Renders a user's public profile as JSON."
  @spec profile(map()) :: map()
  def profile(%{user: user}) do
    %{data: user_data(user)}
  end

  @spec private_profile(map()) :: map()
  def private_profile(%{user: user, is_friend: is_friend, friend_request_sent: friend_request_sent, friend_request_received: friend_request_received}) do
    %{data: hidden_profile(user)
      |> Map.put(:is_friend, is_friend || false)
      |> Map.put(:friend_request_sent, friend_request_sent || false)
      |> Map.put(:friend_request_received, friend_request_received || false)
    }
  end

  @doc "Renders a user's private profile as JSON."
  def private_profile(%{user: user}) do
    %{data: hidden_profile(user)}
  end

  @doc "Renders the user leaderboard as JSON."
  @spec leaderboard(map()) :: map()
  def leaderboard(%{users: users, meta: meta}) do
    %{
      data: Enum.with_index(users, 1) |> Enum.map(fn {user, rank} -> leaderboard_entry(user, rank) end),
      meta: meta
    }
  end

  @doc "Renders active user sessions as JSON."
  @spec sessions(map()) :: map()
  def sessions(%{sessions: sessions, current_token: current_token}) do
    %{
      data: Enum.map(sessions, fn session ->
        # Compare hashed token to determine if this is the current session
        is_current = case current_token do
          nil -> false
          token when is_binary(token) ->
            hashed = :crypto.hash(:sha256, token) |> Base.encode64()
            session.token_hash == hashed
          _ -> false
        end

        %{
          id: session.id,
          ip: session.ip_address,
          user_agent: session.user_agent,
          location: session.location,
          current: is_current,
          last_active_at: session.last_active_at,
          created_at: session.inserted_at
        }
      end)
    }
  end

  @doc """
  Format user data for JSON responses.
  """
  @spec user_data(User.t() | nil | Ecto.Association.NotLoaded.t()) :: map() | nil
  def user_data(%User{} = user) do
    %{
      id: user.id,
      uid: user.uid,
      user_id: user.user_id,
      user_id_display: User.format_user_id(user),
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      banner_url: user.banner_url,
      bio: user.bio,
      status: user.status,
      status_message: user.status_message,
      avatar_border_id: user.avatar_border_id,
      wallet_address: user.wallet_address,
      email_verified_at: user.email_verified_at,
      two_factor_enabled: user.totp_enabled,
      karma: user.karma || 0,
      is_verified: user.is_verified || false,
      is_premium: user.is_premium || false,
      is_profile_private: user.is_profile_private || false,
      can_change_username: User.can_change_username?(user),
      username_next_change_at: User.next_username_change_date(user),
      # Gamification fields
      xp: user.xp || 0,
      level: user.level || 1,
      streak_days: user.streak_days || 0,
      subscription_tier: user.subscription_tier || "free",
      equipped_title_id: user.equipped_title_id,
      onboarding_completed: user.onboarding_completed_at != nil,
      created_at: user.inserted_at
    }
  end

  def user_data(nil), do: nil
  def user_data(%Ecto.Association.NotLoaded{}), do: nil

  # Reserved for future public profile rendering (symmetric pair with hidden_profile/1)
  # defp public_profile(%User{} = user) do
  #   %{
  #     id: user.id,
  #     username: user.username,
  #     display_name: user.display_name,
  #     avatar_url: user.avatar_url,
  #     banner_url: user.banner_url,
  #     bio: user.bio,
  #     status: user.status,
  #     status_message: user.status_message,
  #     avatar_border_id: user.avatar_border_id,
  #     karma: user.karma || 0,
  #     is_verified: user.is_verified || false,
  #     is_premium: user.is_premium || false,
  #     is_profile_private: user.is_profile_private || false,
  #     created_at: user.inserted_at
  #   }
  # end

  defp hidden_profile(%User{} = user) do
    %{
      id: user.id,
      username: "Unknown",
      display_name: "Unknown",
      avatar_url: nil,
      banner_url: nil,
      bio: "This profile is private",
      status: "offline",
      status_message: nil,
      karma: 0,
      is_verified: false,
      is_premium: false,
      is_profile_private: true,
      created_at: nil
    }
  end

  defp leaderboard_entry(user, rank) do
    %{
      rank: rank,
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      karma: user.karma || 0,
      xp: user.xp || 0,
      level: user.level || 1,
      streak_days: user.streak_days || 0,
      avatar_border_id: user.avatar_border_id,
      is_verified: user.is_verified || false
    }
  end
end
