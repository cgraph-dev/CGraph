defmodule CgraphWeb.API.V1.UserJSON do
  @moduledoc """
  JSON rendering for user responses.
  """
  alias Cgraph.Accounts.User

  def index(%{users: users, meta: meta}) do
    %{
      data: Enum.map(users, &user_data/1),
      meta: meta
    }
  end

  def show(%{user: user}) do
    %{data: user_data(user)}
  end

  def profile(%{user: user}) do
    %{data: public_profile(user)}
  end

  def private_profile(%{user: user}) do
    %{data: hidden_profile(user)}
  end

  def leaderboard(%{users: users, meta: meta}) do
    %{
      data: Enum.with_index(users, 1) |> Enum.map(fn {user, rank} -> leaderboard_entry(user, rank) end),
      meta: meta
    }
  end

  def sessions(%{sessions: sessions, current_token: current_token}) do
    %{
      data: Enum.map(sessions, fn session ->
        %{
          id: session.id,
          ip: session.ip_address,
          user_agent: session.user_agent,
          location: session.location,
          current: session.token == current_token,
          last_active_at: session.last_active_at,
          created_at: session.inserted_at
        }
      end)
    }
  end

  @doc """
  Format user data for JSON responses.
  """
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
      coins: user.coins || 0,
      streak_days: user.streak_days || 0,
      subscription_tier: user.subscription_tier || "free",
      equipped_title_id: user.equipped_title_id,
      created_at: user.inserted_at
    }
  end

  def user_data(nil), do: nil
  def user_data(%Ecto.Association.NotLoaded{}), do: nil

  defp public_profile(%User{} = user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      banner_url: user.banner_url,
      bio: user.bio,
      status: user.status,
      status_message: user.status_message,
      karma: user.karma || 0,
      is_verified: user.is_verified || false,
      is_premium: user.is_premium || false,
      is_profile_private: user.is_profile_private || false,
      created_at: user.inserted_at
    }
  end

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
      is_verified: user.is_verified || false
    }
  end
end
