defmodule CGraphWeb.Channels.SocketSecurity do
  @moduledoc """
  WebSocket security and rate limiting module.

  Delegates to focused submodules:

  - `CGraphWeb.Channels.SocketSecurity.Connection` — connection validation, IP banning
  - `CGraphWeb.Channels.SocketSecurity.RateLimiting` — message rate limiting, abuse detection
  - `CGraphWeb.Channels.SocketSecurity.Validation` — event payload validation

  ## Overview

  Provides comprehensive security for real-time WebSocket connections including:

  - **Message rate limiting**: Prevent spam/DoS via excessive messages
  - **Connection limiting**: Limit concurrent connections per user/IP
  - **Event validation**: Validate incoming event payloads
  - **Abuse detection**: Track suspicious patterns and auto-ban

  ## Rate Limit Tiers

  | Tier      | Messages/sec | Use Case              |
  |-----------|-------------|------------------------|
  | Standard  | 5           | Regular users          |
  | Premium   | 20          | Premium subscribers    |
  | Bot       | 50          | Verified bots          |

  ## Usage

  In your socket module:

      defmodule CGraphWeb.UserSocket do
        use Phoenix.Socket
        use CGraphWeb.Channels.SocketSecurity

        # ...
      end

  In channels:

      def handle_in("new_message", payload, socket) do
        case SocketSecurity.rate_limit_message(socket) do
          :ok ->
            # Process message
          {:error, :rate_limited} ->
            {:reply, {:error, %{reason: "slow_down"}}, socket}
        end
      end
  """

  alias CGraphWeb.Channels.SocketSecurity.{Connection, RateLimiting, Validation}

  @type tier :: :standard | :premium | :bot
  @type socket :: Phoenix.Socket.t()

  # ---------------------------------------------------------------------------
  # Macro for Socket Integration
  # ---------------------------------------------------------------------------

  @doc """
  Use this macro to add security features to your socket module.

  Adds:
  - `c:security_connect/2` callback for connection validation
  - `c:security_rate_limit/2` callback for message rate limiting
  """
  defmacro __using__(_opts) do
    quote do
      import CGraphWeb.Channels.SocketSecurity
    end
  end

  # ---------------------------------------------------------------------------
  # Connection Security
  # ---------------------------------------------------------------------------

  defdelegate validate_connection(params, connect_info), to: Connection
  defdelegate cleanup_connection(socket), to: Connection
  defdelegate unban_ip(ip), to: Connection
  defdelegate ip_banned?(ip), to: Connection

  @doc "Ban an IP address for a specified duration."
  @spec ban_ip(String.t(), non_neg_integer(), String.t()) :: :ok
  def ban_ip(ip, duration_seconds \\ 3600, reason \\ "abuse"),
    do: Connection.ban_ip(ip, duration_seconds, reason)

  # ---------------------------------------------------------------------------
  # Message Rate Limiting & Abuse Detection
  # ---------------------------------------------------------------------------

  @doc "Check if a message can be sent based on rate limits."
  @spec rate_limit_message(socket(), atom()) :: :ok | {:error, :rate_limited}
  def rate_limit_message(socket, event_type \\ :message),
    do: RateLimiting.rate_limit_message(socket, event_type)

  @doc "Apply a cooldown after certain actions."
  @spec apply_action_cooldown(socket(), atom(), non_neg_integer()) :: :ok | {:error, :cooldown_active}
  def apply_action_cooldown(socket, action, cooldown_seconds \\ 30),
    do: RateLimiting.apply_action_cooldown(socket, action, cooldown_seconds)

  defdelegate check_abuse(socket), to: RateLimiting
  defdelegate track_content(socket, content), to: RateLimiting

  # ---------------------------------------------------------------------------
  # Event Validation
  # ---------------------------------------------------------------------------

  defdelegate validate_event(payload, schema), to: Validation
end
