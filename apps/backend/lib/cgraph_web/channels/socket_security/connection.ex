defmodule CGraphWeb.Channels.SocketSecurity.Connection do
  @moduledoc """
  WebSocket connection validation, tracking, and IP banning.
  """

  require Logger

  @max_connections_per_user 5
  @max_connections_per_ip 20

  @doc """
  Validate connection and track concurrent connections.

  Call this in your socket's `connect/3` callback.
  """
  @spec validate_connection(map(), map()) :: :ok | {:error, atom()}
  def validate_connection(params, connect_info) do
    user_id = Map.get(params, "user_id")
    ip = get_ip_from_connect_info(connect_info)

    with :ok <- check_ip_not_banned(ip),
         :ok <- check_ip_connection_limit(ip),
         :ok <- check_user_connection_limit(user_id) do
      track_connection(user_id, ip)
      :ok
    end
  end

  @doc """
  Clean up connection tracking on disconnect.

  Call this in your socket's `terminate/2` callback.
  """
  @spec cleanup_connection(Phoenix.Socket.t()) :: :ok
  def cleanup_connection(socket) do
    user_id = socket.assigns[:current_user_id]
    if user_id do
      key = "socket:connections:user:#{user_id}"
      Cachex.decr(:cgraph_cache, key)
    end
    :ok
  end

  # ---------------------------------------------------------------------------
  # IP Banning
  # ---------------------------------------------------------------------------

  @doc "Ban an IP address for a specified duration."
  @spec ban_ip(String.t(), non_neg_integer(), String.t()) :: :ok
  def ban_ip(ip, duration_seconds, reason) do
    key = "socket:banned:ip:#{sanitize_ip(ip)}"
    Cachex.put(:cgraph_cache, key, %{reason: reason, banned_at: DateTime.utc_now()},
      ttl: :timer.seconds(duration_seconds))

    Logger.warning("IP banned", ip: ip, reason: reason, duration_seconds: duration_seconds)
    :ok
  end

  @doc "Unban an IP address."
  @spec unban_ip(String.t()) :: :ok
  def unban_ip(ip) do
    key = "socket:banned:ip:#{sanitize_ip(ip)}"
    Cachex.del(:cgraph_cache, key)
    :ok
  end

  @doc "Check if an IP is banned."
  @spec ip_banned?(String.t()) :: boolean()
  def ip_banned?(ip) do
    key = "socket:banned:ip:#{sanitize_ip(ip)}"
    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} -> false
      {:ok, _} -> true
      _ -> false
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp get_ip_from_connect_info(connect_info) do
    connect_info
    |> Map.get(:peer_data, %{})
    |> Map.get(:address)
    |> format_ip()
  end

  defp format_ip(nil), do: "unknown"
  defp format_ip(ip) when is_tuple(ip), do: :inet.ntoa(ip) |> to_string()
  defp format_ip(ip) when is_binary(ip), do: ip

  defp sanitize_ip(ip) do
    ip
    |> to_string()
    |> String.replace(~r/[^0-9a-fA-F.:]/, "")
    |> String.slice(0, 45)
  end

  defp check_ip_not_banned(ip) do
    if ip_banned?(ip) do
      {:error, :ip_banned}
    else
      :ok
    end
  end

  defp check_ip_connection_limit(ip) do
    key = "socket:connections:ip:#{sanitize_ip(ip)}"

    case get_counter(key) do
      count when count < @max_connections_per_ip -> :ok
      _ -> {:error, :too_many_connections}
    end
  end

  defp check_user_connection_limit(nil), do: :ok
  defp check_user_connection_limit(user_id) do
    key = "socket:connections:user:#{user_id}"

    case get_counter(key) do
      count when count < @max_connections_per_user -> :ok
      _ -> {:error, :too_many_connections}
    end
  end

  defp track_connection(user_id, ip) do
    if user_id do
      Cachex.incr(:cgraph_cache, "socket:connections:user:#{user_id}")
    end

    Cachex.incr(:cgraph_cache, "socket:connections:ip:#{sanitize_ip(ip)}")
  end

  defp get_counter(key) do
    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} -> 0
      {:ok, count} when is_integer(count) -> count
      _ -> 0
    end
  end
end
