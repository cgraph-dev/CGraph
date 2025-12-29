defmodule CgraphWeb.API.V1.AuthJSON do
  @moduledoc """
  JSON rendering for authentication responses.
  
  Provides consistent JSON output format for all auth-related endpoints.
  """

  alias Cgraph.Accounts.User

  @doc """
  Renders successful authentication response with user and tokens.
  """
  def auth_response(%{user: user, tokens: tokens}) do
    %{
      user: user_data(user),
      tokens: tokens
    }
  end

  @doc """
  Renders user registration success response.
  """
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
  def user(%{user: user}) do
    %{user: user_data(user)}
  end

  @doc """
  Renders token refresh response.
  """
  def tokens(%{tokens: tokens}) do
    %{tokens: tokens}
  end

  @doc """
  Renders wallet challenge for authentication.
  """
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
  def logout_success(_assigns) do
    %{message: "Logged out successfully"}
  end

  @doc """
  Renders password reset request success.
  """
  def password_reset_requested(_assigns) do
    %{message: "If the email exists, a password reset link has been sent"}
  end

  @doc """
  Renders password reset success.
  """
  def password_reset_success(_assigns) do
    %{message: "Password has been reset successfully"}
  end

  # Private helper to format user data consistently
  defp user_data(%User{} = user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
      status: user.status,
      custom_status: user.custom_status,
      is_verified: user.is_verified,
      is_premium: user.is_premium,
      wallet_address: user.wallet_address,
      crypto_alias: user.crypto_alias,
      auth_type: user.auth_type,
      totp_enabled: user.totp_enabled,
      last_seen_at: user.last_seen_at,
      email_verified_at: user.email_verified_at,
      inserted_at: user.inserted_at
    }
  end
end
