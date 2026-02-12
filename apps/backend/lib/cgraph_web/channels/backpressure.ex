defmodule CGraphWeb.Channels.Backpressure do
  @moduledoc """
  Discord-style channel backpressure to protect slow WebSocket clients.

  ## Problem

  When a channel has 10K+ subscribers and messages arrive faster than some
  clients can consume, memory grows unboundedly per connection. Discord handles
  this by dropping messages for slow readers and sending a "too_slow" event.

  ## Strategy

  1. Track pending message count per socket
  2. If pending > threshold, switch to "degraded" mode:
     - Drop non-critical events (typing, presence updates)
     - Batch multiple messages into single pushes
  3. If pending > hard limit, disconnect with reconnect hint

  ## Usage in Channels

      # In any channel module:
      def handle_in("new_msg", payload, socket) do
        case Backpressure.check(socket) do
          :ok ->
            broadcast!(socket, "new_msg", payload)
            {:noreply, socket}
          :degraded ->
            broadcast!(socket, "new_msg", payload)
            {:noreply, Backpressure.increment(socket)}
          :overloaded ->
            push(socket, "too_slow", %{reconnect_after_ms: 5000})
            {:stop, :normal, socket}
        end
      end
  """

  require Logger

  @soft_limit 500     # Messages pending → enter degraded mode
  @hard_limit 2000    # Messages pending → disconnect
  @critical_events ~w(new_msg message_edited message_deleted)

  @doc """
  Check backpressure state for a socket connection.
  Returns :ok, :degraded, or :overloaded.
  """
  @spec check(Phoenix.Socket.t()) :: :ok | :degraded | :overloaded
  def check(socket) do
    pending = Map.get(socket.assigns, :pending_count, 0)

    cond do
      pending >= @hard_limit -> :overloaded
      pending >= @soft_limit -> :degraded
      true -> :ok
    end
  end

  @doc """
  Increment the pending message counter. Call after pushing a message.
  """
  @spec increment(Phoenix.Socket.t()) :: Phoenix.Socket.t()
  def increment(socket) do
    count = Map.get(socket.assigns, :pending_count, 0)
    Phoenix.Socket.assign(socket, :pending_count, count + 1)
  end

  @doc """
  Reset the pending counter. Call when client sends an ACK.
  """
  @spec reset(Phoenix.Socket.t()) :: Phoenix.Socket.t()
  def reset(socket) do
    Phoenix.Socket.assign(socket, :pending_count, 0)
  end

  @doc """
  Determine if an event should be dropped in degraded mode.
  Critical events (messages) are never dropped; non-critical
  events (typing, presence) are dropped to save bandwidth.
  """
  @spec should_drop?(String.t(), Phoenix.Socket.t()) :: boolean()
  def should_drop?(event, socket) do
    case check(socket) do
      :degraded ->
        # In degraded mode, drop non-critical events
        event not in @critical_events

      :overloaded ->
        # In overloaded mode, drop everything except messages
        event not in @critical_events

      :ok ->
        false
    end
  end

  @doc """
  Wrap a broadcast with backpressure awareness.
  Drops non-critical events for degraded connections.

      Backpressure.safe_push(socket, "typing", payload)
  """
  @spec safe_push(Phoenix.Socket.t(), String.t(), map()) ::
    {:ok, Phoenix.Socket.t()} | {:dropped, Phoenix.Socket.t()} | {:overloaded, Phoenix.Socket.t()}
  def safe_push(socket, event, payload) do
    cond do
      check(socket) == :overloaded ->
        :telemetry.execute(
          [:cgraph, :channel, :backpressure],
          %{count: 1},
          %{action: :disconnect, event: event}
        )
        {:overloaded, socket}

      should_drop?(event, socket) ->
        :telemetry.execute(
          [:cgraph, :channel, :backpressure],
          %{count: 1},
          %{action: :drop, event: event}
        )
        {:dropped, socket}

      true ->
        Phoenix.Channel.push(socket, event, payload)
        {:ok, increment(socket)}
    end
  end
end
