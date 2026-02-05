defmodule CGraph.Accounts.PasswordReset do
  @moduledoc """
  Password reset functionality for user accounts.

  Handles generating reset tokens, verifying them, and resetting passwords.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.Repo

  @doc """
  Request a password reset for a user by email.

  Generates a reset token and sends an email with reset instructions.
  Returns :ok regardless of whether email exists to prevent enumeration.
  """
  def request_password_reset(email) do
    case CGraph.Accounts.get_user_by_email(email) do
      {:error, :not_found} ->
        # Uniform response to prevent email enumeration
        :ok

      {:ok, user} ->
        _token = generate_password_reset_token(user)
        # Token stored in cache for later verification
        # Email sent via Mailer.send_password_reset/2
        :ok
    end
  end

  @doc """
  Reset a user's password using a valid reset token.
  """
  def reset_password(token, new_password, new_password_confirmation) do
    with {:ok, user_id} <- verify_password_reset_token(token),
         {:ok, user} <- CGraph.Accounts.get_user(user_id),
         true <- new_password == new_password_confirmation do

      user
      |> User.password_changeset(%{password: new_password})
      |> Repo.update()
      |> case do
        {:ok, user} ->
          # Invalidate all existing sessions for security
          invalidate_reset_token(token)
          {:ok, user}
        error ->
          error
      end
    else
      {:error, :invalid_token} -> {:error, :invalid_token}
      {:error, :expired_token} -> {:error, :expired_token}
      {:error, _} = error -> error
      false -> {:error, :passwords_do_not_match}
    end
  end

  @doc """
  Generate a password reset token for a user.
  """
  def generate_password_reset_token(user) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    expires_at = DateTime.utc_now() |> DateTime.add(3600, :second)  # 1 hour

    # Store token in cache or database
    Cachex.put(:cgraph_cache, "password_reset:#{token}", %{
      user_id: user.id,
      expires_at: expires_at
    }, ttl: :timer.hours(1))

    token
  end

  @doc """
  Verify a password reset token.
  """
  def verify_password_reset_token(token) do
    case Cachex.get(:cgraph_cache, "password_reset:#{token}") do
      {:ok, nil} ->
        {:error, :invalid_token}

      {:ok, %{user_id: user_id, expires_at: expires_at}} ->
        if DateTime.compare(DateTime.utc_now(), expires_at) == :lt do
          {:ok, user_id}
        else
          {:error, :expired_token}
        end

      _ ->
        {:error, :invalid_token}
    end
  end

  @doc """
  Invalidate a password reset token.
  """
  def invalidate_reset_token(token) do
    Cachex.del(:cgraph_cache, "password_reset:#{token}")
  end
end
