defmodule CGraph.Accounts.Authentication do
  @moduledoc """
  Authentication operations.

  Handles login, logout, password verification, and 2FA.
  """

  import Ecto.Query
  alias CGraph.Accounts.{Session, Token, User}
  alias CGraph.Accounts.Users
  alias CGraph.Repo

  @session_validity_days 60
  @token_validity_hours 24

  @doc """
  Authenticates a user with email/username and password.
  """
  @spec authenticate(String.t(), String.t()) :: {:ok, User.t()} | {:error, :invalid_credentials | :account_banned | :account_deleted}
  def authenticate(identifier, password) do
    user = Users.get_user_by_email_or_username(identifier)

    cond do
      is_nil(user) ->
        # Prevent timing attacks
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      not User.valid_password?(user, password) ->
        {:error, :invalid_credentials}

      user.is_banned ->
        {:error, :account_banned}

      not is_nil(user.deleted_at) ->
        {:error, :account_deleted}

      true ->
        {:ok, user}
    end
  end

  @doc """
  Creates a session for a user.
  """
  @spec create_session(User.t(), map()) :: {:ok, Session.t()} | {:error, Ecto.Changeset.t()}
  def create_session(user, device_info \\ %{}) do
    token = generate_token()
    expires_at = DateTime.add(DateTime.utc_now(), @session_validity_days, :day)

    %Session{}
    |> Session.changeset(%{
      user_id: user.id,
      token: token,
      expires_at: expires_at,
      device: device_info[:device] || "unknown",
      ip_address: device_info[:ip],
      user_agent: device_info[:user_agent]
    })
    |> Repo.insert()
  end

  @doc """
  Gets a session by token.
  """
  @spec get_session_by_token(String.t()) :: Session.t() | nil
  def get_session_by_token(token) do
    now = DateTime.utc_now()

    Repo.one(
      from(s in Session,
        where: s.token == ^token,
        where: s.expires_at > ^now,
        where: is_nil(s.revoked_at),
        preload: [:user]
      )
    )
  end

  @doc """
  Revokes a session.
  """
  @spec revoke_session(Session.t()) :: {:ok, Session.t()} | {:error, Ecto.Changeset.t()}
  def revoke_session(session) do
    session
    |> Session.changeset(%{revoked_at: DateTime.utc_now()})
    |> Repo.update()
  end

  @doc """
  Revokes all sessions for a user except the current one.
  """
  @spec revoke_other_sessions(User.t(), String.t()) :: :ok
  def revoke_other_sessions(user, current_session_id) do
    from(s in Session,
      where: s.user_id == ^user.id,
      where: s.id != ^current_session_id,
      where: is_nil(s.revoked_at)
    )
    |> Repo.update_all(set: [revoked_at: DateTime.utc_now()])

    :ok
  end

  @doc """
  Lists active sessions for a user.
  """
  @spec list_sessions(User.t()) :: list(Session.t())
  def list_sessions(user) do
    from(s in Session,
      where: s.user_id == ^user.id,
      where: is_nil(s.revoked_at),
      where: s.expires_at > ^DateTime.utc_now(),
      order_by: [desc: s.last_active_at]
    )
    |> Repo.all()
  end

  @doc """
  Generates a password reset token.
  """
  @spec generate_password_reset_token(User.t()) :: {:ok, Token.t()} | {:error, Ecto.Changeset.t()}
  def generate_password_reset_token(user) do
    token = generate_token()
    expires_at = DateTime.add(DateTime.utc_now(), @token_validity_hours, :hour)

    %Token{}
    |> Token.changeset(%{
      user_id: user.id,
      token: token,
      type: "password_reset",
      expires_at: expires_at
    })
    |> Repo.insert()
  end

  @doc """
  Verifies and consumes a password reset token.
  """
  @spec verify_password_reset_token(String.t()) :: {:ok, User.t()} | {:error, :invalid_token}
  def verify_password_reset_token(token) do
    now = DateTime.utc_now()

    case Repo.one(
      from(t in Token,
        where: t.token == ^token,
        where: t.type == "password_reset",
        where: t.expires_at > ^now,
        where: is_nil(t.used_at),
        preload: [:user]
      )
    ) do
      nil ->
        {:error, :invalid_token}

      token_record ->
        # Mark as used
        token_record
        |> Token.changeset(%{used_at: now})
        |> Repo.update()

        {:ok, token_record.user}
    end
  end

  @doc """
  Enables two-factor authentication.
  """
  @spec enable_2fa(User.t(), String.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def enable_2fa(user, secret) do
    user
    |> User.changeset(%{
      totp_secret: secret,
      two_factor_enabled: true
    })
    |> Repo.update()
  end

  @doc """
  Disables two-factor authentication.
  """
  @spec disable_2fa(User.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def disable_2fa(user) do
    user
    |> User.changeset(%{
      totp_secret: nil,
      two_factor_enabled: false
    })
    |> Repo.update()
  end

  @doc """
  Verifies a TOTP code.
  """
  @spec verify_totp(User.t(), String.t()) :: :ok | {:error, :invalid_code}
  def verify_totp(user, code) do
    if user.two_factor_enabled do
      # Use NimbleTOTP or similar for verification
      case NimbleTOTP.valid?(user.totp_secret, code) do
        true -> :ok
        false -> {:error, :invalid_code}
      end
    else
      :ok
    end
  end

  # Private helpers

  defp generate_token do
    :crypto.strong_rand_bytes(32) |> Base.url_encode64()
  end
end
