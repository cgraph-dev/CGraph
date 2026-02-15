defmodule CGraph.Accounts.SessionManagement do
  @moduledoc """
  Session token management — generate, resolve, list, revoke.

  Extracted from `CGraph.Accounts` to keep the facade under 500 lines.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.{Session, Token, User}
  alias CGraph.Repo

  @session_token_validity_days 60

  @doc "Generate a session token for a user."
  @spec generate_session_token(User.t()) :: String.t()
  def generate_session_token(user) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    hashed = :crypto.hash(:sha256, token)

    %Token{}
    |> Token.changeset(%{
      token: hashed,
      context: "session",
      user_id: user.id
    })
    |> Repo.insert!()

    token
  end

  @doc "Get a user by session token."
  @spec get_user_by_session_token(String.t()) :: User.t() | nil
  def get_user_by_session_token(token) when is_binary(token) do
    hashed = :crypto.hash(:sha256, token)

    query = from t in Token,
      where: t.token == ^hashed and t.context == "session",
      where: t.inserted_at > ago(@session_token_validity_days, "day"),
      join: u in User, on: u.id == t.user_id,
      select: u

    Repo.one(query)
  end

  @doc "Delete a session token."
  @spec delete_session_token(String.t()) :: :ok
  def delete_session_token(token) when is_binary(token) do
    hashed = :crypto.hash(:sha256, token)

    from(t in Token,
      where: t.token == ^hashed and t.context == "session"
    )
    |> Repo.delete_all()

    :ok
  end

  @doc "List active sessions for a user."
  @spec list_sessions(User.t()) :: [Session.t()]
  def list_sessions(user) do
    from(s in Session,
      where: s.user_id == ^user.id,
      where: is_nil(s.revoked_at),
      order_by: [desc: :last_active_at]
    )
    |> Repo.all()
  end

  @doc "Alias for list_sessions."
  @spec list_user_sessions(User.t()) :: [Session.t()]
  def list_user_sessions(user), do: list_sessions(user)

  @doc "Revoke a session."
  @spec revoke_session(Session.t()) :: {:ok, Session.t()} | {:error, Ecto.Changeset.t()}
  def revoke_session(%Session{} = session) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    session
    |> Ecto.Changeset.change(revoked_at: now)
    |> Repo.update()
  end

  @doc "Revoke a session by user + session_id."
  @spec revoke_session(User.t(), String.t()) :: {:ok, Session.t()} | {:error, :not_found}
  def revoke_session(user, session_id) do
    case Repo.get_by(Session, id: session_id, user_id: user.id) do
      nil -> {:error, :not_found}
      session -> revoke_session(session)
    end
  end
end
