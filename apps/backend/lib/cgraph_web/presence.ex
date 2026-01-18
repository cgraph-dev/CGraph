defmodule CGraphWeb.Presence do
  @moduledoc """
  Phoenix Presence for CGraphWeb.
  
  Delegates to CGraph.Presence for the core functionality
  but provides the Phoenix.Presence behaviour for channels.
  """

  use Phoenix.Presence,
    otp_app: :cgraph,
    pubsub_server: CGraph.PubSub

  @doc """
  Track a user's presence in a channel.
  """
  def track(socket, key, meta) do
    Phoenix.Presence.track(socket, key, meta)
  end

  @doc """
  Update presence metadata.
  """
  def update(socket, key, meta) do
    Phoenix.Presence.update(socket, key, meta)
  end

  @doc """
  List presences for a topic.
  """
  def list(topic) do
    Phoenix.Presence.list(__MODULE__, topic)
  end
end
