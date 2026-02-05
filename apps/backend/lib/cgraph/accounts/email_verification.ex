defmodule CGraph.Accounts.EmailVerification do
  @moduledoc """
  Email verification functionality for user accounts.

  Handles generating verification tokens, sending emails, and verifying email addresses.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.Repo
  alias CGraph.Workers.{Orchestrator, SendEmailNotification}

  @doc """
  Generate and send an email verification token.

  The token is stored in cache with a 24-hour expiry.
  """
  def send_verification_email(user) do
    token = generate_email_verification_token(user)

    # Queue email sending via Oban worker
    Orchestrator.enqueue(
      SendEmailNotification,
      %{
        user_id: user.id,
        notification_id: nil,
        email_type: "verification",
        verification_token: token
      }
    )

    {:ok, token}
  end

  @doc """
  Verify an email using the verification token.
  """
  def verify_email(token) do
    with {:ok, user_id} <- verify_email_token(token),
         {:ok, user} <- CGraph.Accounts.get_user(user_id),
         {:ok, user} <- mark_email_verified(user) do
      invalidate_email_token(token)
      {:ok, user}
    end
  end

  @doc """
  Mark a user's email as verified.
  """
  def mark_email_verified(user) do
    user
    |> Ecto.Changeset.change(email_verified_at: DateTime.utc_now())
    |> Repo.update()
  end

  @doc """
  Check if a user's email is verified.
  """
  def email_verified?(%User{email_verified_at: nil}), do: false
  def email_verified?(%User{email_verified_at: _}), do: true

  @doc """
  Resend verification email if not verified.
  Rate limited to once per 5 minutes.
  """
  def resend_verification_email(user) do
    cache_key = "email_verification_sent:#{user.id}"

    case Cachex.get(:cgraph_cache, cache_key) do
      {:ok, nil} ->
        result = send_verification_email(user)
        # Rate limit: 5 minutes
        Cachex.put(:cgraph_cache, cache_key, true, ttl: :timer.minutes(5))
        result

      {:ok, true} ->
        {:error, :rate_limited}

      _ ->
        send_verification_email(user)
    end
  end

  @doc """
  Generate an email verification token.
  """
  def generate_email_verification_token(user) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    expires_at = DateTime.utc_now() |> DateTime.add(86_400, :second)  # 24 hours

    Cachex.put(:cgraph_cache, "email_verification:#{token}", %{
      user_id: user.id,
      expires_at: expires_at
    }, ttl: :timer.hours(24))

    token
  end

  @doc """
  Verify an email verification token.
  """
  def verify_email_token(token) do
    case Cachex.get(:cgraph_cache, "email_verification:#{token}") do
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
  Invalidate an email verification token.
  """
  def invalidate_email_token(token) do
    Cachex.del(:cgraph_cache, "email_verification:#{token}")
  end
end
