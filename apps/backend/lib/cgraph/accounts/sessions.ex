defmodule CGraph.Accounts.Sessions do
  @moduledoc """
  Session management operations.
  
  Handles session CRUD, activity tracking, and device management.
  """
  
  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.Accounts.Session
  
  @doc """
  Creates a new session.
  """
  def create_session(user, device_info \\ %{}) do
    token = generate_session_token()
    expires_at = DateTime.add(DateTime.utc_now(), 60, :day)
    
    %Session{}
    |> Session.changeset(%{
      user_id: user.id,
      token: token,
      expires_at: expires_at,
      device: device_info[:device] || parse_device(device_info[:user_agent]),
      ip_address: device_info[:ip],
      user_agent: device_info[:user_agent],
      last_active_at: DateTime.utc_now()
    })
    |> Repo.insert()
  end
  
  @doc """
  Gets a session by token.
  """
  def get_session(token) do
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
  Gets a session by ID.
  """
  def get_session_by_id(id) do
    Repo.get(Session, id)
  end
  
  @doc """
  Updates session activity.
  """
  def touch_session(session) do
    session
    |> Session.changeset(%{last_active_at: DateTime.utc_now()})
    |> Repo.update()
  end
  
  @doc """
  Revokes a session.
  """
  def revoke_session(session) do
    session
    |> Session.changeset(%{revoked_at: DateTime.utc_now()})
    |> Repo.update()
  end
  
  @doc """
  Revokes a session by ID.
  """
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
    :crypto.strong_rand_bytes(32) |> Base.url_encode64()
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
end
