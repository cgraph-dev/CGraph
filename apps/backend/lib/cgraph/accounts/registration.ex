defmodule CGraph.Accounts.Registration do
  @moduledoc """
  User registration operations.

  Handles signup, email verification, and onboarding.
  """

  import Ecto.Query
  alias CGraph.Accounts.{Token, User}
  alias CGraph.Accounts.Users
  alias CGraph.Repo

  @verification_token_hours 24

  @doc """
  Registers a new user.
  """
  @spec register(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t() | term()}
  def register(attrs) do
    Repo.transaction(fn ->
      case Users.create_user(attrs) do
        {:ok, user} ->
          # Generate email verification token
          case generate_verification_token(user) do
            {:ok, token} ->
              # Send verification email (async)
              send_verification_email(user, token.token)
              user
            {:error, reason} ->
              Repo.rollback(reason)
          end

        {:error, changeset} ->
          Repo.rollback(changeset)
      end
    end)
  end

  @doc """
  Generates an email verification token.
  """
  @spec generate_verification_token(User.t()) :: {:ok, Token.t()} | {:error, Ecto.Changeset.t()}
  def generate_verification_token(user) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64()
    expires_at = DateTime.add(DateTime.utc_now(), @verification_token_hours, :hour)

    %Token{}
    |> Token.changeset(%{
      user_id: user.id,
      token: token,
      type: "email_verification",
      expires_at: expires_at
    })
    |> Repo.insert()
  end

  @doc """
  Verifies an email using a token.
  """
  @spec verify_email(String.t()) :: {:ok, User.t()} | {:error, :invalid_token}
  def verify_email(token) do
    now = DateTime.utc_now()

    case Repo.one(
      from(t in Token,
        where: t.token == ^token,
        where: t.type == "email_verification",
        where: t.expires_at > ^now,
        where: is_nil(t.used_at),
        preload: [:user]
      )
    ) do
      nil ->
        {:error, :invalid_token}

      token_record ->
        Repo.transaction(fn ->
          # Mark token as used
          token_record
          |> Token.changeset(%{used_at: now})
          |> Repo.update!()

          # Mark email as verified
          token_record.user
          |> User.changeset(%{email_verified_at: now})
          |> Repo.update!()
        end)
    end
  end

  @doc """
  Resends verification email.
  """
  @spec resend_verification_email(User.t()) :: :ok | {:error, :already_verified | term()}
  def resend_verification_email(user) do
    if is_nil(user.email_verified_at) do
      # Invalidate existing tokens
      invalidate_verification_tokens(user)

      # Generate new token
      case generate_verification_token(user) do
        {:ok, token} ->
          send_verification_email(user, token.token)
          :ok
        error ->
          error
      end
    else
      {:error, :already_verified}
    end
  end

  @doc """
  Checks if a username is available.
  """
  @spec username_available?(String.t()) :: boolean()
  def username_available?(username) do
    not Repo.exists?(
      from(u in User, where: fragment("lower(?)", u.username) == ^String.downcase(username))
    )
  end

  @doc """
  Checks if an email is available.
  """
  @spec email_available?(String.t()) :: boolean()
  def email_available?(email) do
    not Repo.exists?(
      from(u in User, where: fragment("lower(?)", u.email) == ^String.downcase(email))
    )
  end

  @doc """
  Validates registration data without creating user.
  """
  @spec validate_registration(map()) :: :ok | {:error, Ecto.Changeset.t()}
  def validate_registration(attrs) do
    changeset = User.registration_changeset(%User{}, attrs)

    if changeset.valid? do
      :ok
    else
      {:error, changeset}
    end
  end

  # Private helpers

  defp invalidate_verification_tokens(user) do
    from(t in Token,
      where: t.user_id == ^user.id,
      where: t.type == "email_verification",
      where: is_nil(t.used_at)
    )
    |> Repo.update_all(set: [used_at: DateTime.utc_now()])
  end

  defp send_verification_email(user, token) do
    # This would be handled by a background job
    # For now, just log it
    require Logger
    Logger.info("sending_verification_email_to_with_token", user_email: user.email, token: token)
    :ok
  end
end
