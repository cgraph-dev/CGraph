defmodule CGraph.Accounts.Sessions do
  @moduledoc """
  Session management operations.

  Handles session CRUD, activity tracking, and device management.
  """

  import Ecto.Query
  alias CGraph.Accounts.Session
  alias CGraph.Repo

  @session_validity_days 60

  @doc """
  Creates a new session.

  Returns `{:ok, session, raw_token}` on success so callers can issue the
  raw token to the client while only the hash is persisted.
  """
  @spec create_session(struct(), map()) :: {:ok, Session.t(), String.t()} | {:error, Ecto.Changeset.t()}
  def create_session(user, device_info \\ %{}) do
    token = generate_session_token()
    token_hash = hash_token(token)
    expires_at = DateTime.add(DateTime.utc_now(), @session_validity_days, :day)

    device_name = device_info[:device] || parse_device(device_info[:user_agent])
    device_type = parse_device_type(device_info[:user_agent])

    %Session{}
    |> Session.changeset(%{
      user_id: user.id,
      token_hash: token_hash,
      expires_at: expires_at,
      device_name: device_name,
      device_type: device_type,
      ip_address: device_info[:ip],
      user_agent: device_info[:user_agent]
    })
    |> Repo.insert()
    |> case do
      {:ok, session} -> {:ok, session, token}
      error -> error
    end
  end

  @doc """
  Gets a session by raw token.

  Hashes the token and looks up by `token_hash`.
  """
  @spec get_session(String.t()) :: Session.t() | nil
  def get_session(token) do
    token_hash = hash_token(token)
    now = DateTime.utc_now()

    Repo.one(
      from(s in Session,
        where: s.token_hash == ^token_hash,
        where: s.expires_at > ^now,
        where: is_nil(s.revoked_at),
        preload: [:user]
      )
    )
  end

  @doc """
  Gets a session by ID.
  """
  @spec get_session_by_id(String.t()) :: Session.t() | nil
  def get_session_by_id(id) do
    Repo.get(Session, id)
  end

  @doc """
  Updates session activity.
  """
  @spec touch_session(Session.t()) :: {:ok, Session.t()} | {:error, Ecto.Changeset.t()}
  def touch_session(session) do
    session
    |> Ecto.Changeset.change(last_active_at: DateTime.utc_now())
    |> Repo.update()
  end

  @doc """
  Revokes a session.
  """
  @spec revoke_session(Session.t()) :: {:ok, Session.t()} | {:error, Ecto.Changeset.t()}
  def revoke_session(session) do
    session
    |> Ecto.Changeset.change(revoked_at: DateTime.utc_now())
    |> Repo.update()
  end

  @doc """
  Revokes a session by ID.
  """
  @spec revoke_session_by_id(struct(), String.t()) :: {:ok, Session.t()} | {:error, :not_found} | {:error, Ecto.Changeset.t()}
  def revoke_session_by_id(user, session_id) do
    case Repo.one(
      from(s in Session,
        where: s.id == ^session_id,
        where: s.user_id == ^user.id
      )
    ) do
      nil ->
        {:error, :not_found}
      session ->
        revoke_session(session)
    end
  end

  @doc """
  Revokes all sessions for a user.
  """
  @spec revoke_all_sessions(struct()) :: :ok
  def revoke_all_sessions(user) do
    from(s in Session,
      where: s.user_id == ^user.id,
      where: is_nil(s.revoked_at)
    )
    |> Repo.update_all(set: [revoked_at: DateTime.utc_now()])

    :ok
  end

  @doc """
  Revokes all sessions except the current one.
  """
  @spec revoke_other_sessions(struct(), String.t()) :: :ok
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
  @spec list_sessions(struct()) :: list(Session.t())
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
  Counts active sessions for a user.
  """
  @spec count_active_sessions(struct()) :: non_neg_integer()
  def count_active_sessions(user) do
    from(s in Session,
      where: s.user_id == ^user.id,
      where: is_nil(s.revoked_at),
      where: s.expires_at > ^DateTime.utc_now()
    )
    |> Repo.aggregate(:count)
  end

  @doc """
  Cleans up expired sessions.
  """
  @spec cleanup_expired_sessions() :: {:ok, non_neg_integer()}
  def cleanup_expired_sessions do
    now = DateTime.utc_now()

    {count, _} = from(s in Session,
      where: s.expires_at < ^now or not is_nil(s.revoked_at)
    )
    |> Repo.delete_all()

    {:ok, count}
  end

  # Private helpers

  defp generate_session_token do
    :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
  end

  defp hash_token(token) do
    :crypto.hash(:sha256, token) |> Base.encode64()
  end

  defp parse_device(nil), do: "Unknown"
  defp parse_device(user_agent) do
    cond do
      String.contains?(user_agent, "iPhone") -> "iPhone"
      String.contains?(user_agent, "iPad") -> "iPad"
      String.contains?(user_agent, "Android") -> "Android"
      String.contains?(user_agent, "Windows") -> "Windows"
      String.contains?(user_agent, "Mac") -> "Mac"
      String.contains?(user_agent, "Linux") -> "Linux"
      true -> "Unknown"
    end
  end

  defp parse_device_type(nil), do: "web"
  defp parse_device_type(user_agent) do
    cond do
      String.contains?(user_agent, "iPhone") or String.contains?(user_agent, "iPad") -> "ios"
      String.contains?(user_agent, "Android") -> "android"
      String.contains?(user_agent, "Electron") or String.contains?(user_agent, "Desktop") -> "desktop"
      true -> "web"
    end
  end
end
