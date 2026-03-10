defmodule CGraphWeb.API.V1.AuthJSON do
  @moduledoc """
  JSON rendering for authentication responses.

  Provides consistent JSON output format for all auth-related endpoints.
  """

  alias CGraph.Accounts.User

  @doc """
  Renders successful authentication response with user and tokens.
  """
  @spec auth_response(map()) :: map()
  def auth_response(%{user: user, tokens: tokens}) do
    %{
      user: user_data(user),
      tokens: tokens
    }
  end

  @doc """
  Renders user registration success response.
  """
  @spec registration_success(map()) :: map()
  def registration_success(%{user: user, tokens: tokens}) do
    %{
      message: "Registration successful",
      user: user_data(user),
      tokens: tokens
    }
  end

  @doc """
  Renders user data for API responses.
  """
  @spec user(map()) :: map()
  def user(%{user: user}) do
    %{user: user_data(user)}
  end

  @doc """
  Renders token refresh response.
  """
  @spec tokens(map()) :: map()
  def tokens(%{tokens: tokens}) do
    %{tokens: tokens}
  end

  @doc """
  Renders wallet challenge for authentication.
  """
  @spec wallet_challenge(map()) :: map()
  def wallet_challenge(%{challenge: challenge, wallet_address: address}) do
    %{
      challenge: challenge,
      wallet_address: address,
      message: "Sign this message to authenticate"
    }
  end

  @doc """
  Renders logout success response.
  """
  @spec logout_success(map()) :: map()
  def logout_success(_assigns) do
    %{message: "Logged out successfully"}
  end

  @doc """
  Renders password reset request success.
  """
  @spec password_reset_requested(map()) :: map()
  def password_reset_requested(_assigns) do
    %{message: "If the email exists, a password reset link has been sent"}
  end

  @doc """
  Renders password reset success.
  """
  @spec password_reset_success(map()) :: map()
  def password_reset_success(_assigns) do
    %{message: "Password has been reset successfully"}
  end

  @doc """
  Public helper to format a single user for JSON output.
  Use this when you need to render a user outside of the standard render pipeline.
  """
  @spec user_json(User.t()) :: map()
  def user_json(%User{} = user), do: user_data(user)

  # Private helper to format user data consistently
  defp user_data(%User{} = user) do
    %{
      id: user.id,
      uid: user.uid,
      user_id: user.user_id,
      user_id_display: User.format_user_id(user),
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
      status: user.status,
      custom_status: user.custom_status,
      is_verified: user.is_verified,
      is_premium: user.is_premium,
      is_admin: user.is_admin,
      wallet_address: user.wallet_address,
      crypto_alias: user.crypto_alias,
      auth_type: user.auth_type,
      totp_enabled: user.totp_enabled,
      karma: user.karma || 0,
      # Gamification fields
      xp: user.xp || 0,
      level: user.level || 1,
      streak_days: user.streak_days || 0,
      subscription_tier: user.subscription_tier || "free",
      equipped_title_id: user.equipped_title_id,
      can_change_username: User.can_change_username?(user),
      username_next_change_at: User.next_username_change_date(user),
      last_seen_at: user.last_seen_at,
      email_verified_at: user.email_verified_at,
      inserted_at: user.inserted_at
    }
  end
end
