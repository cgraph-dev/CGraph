defmodule CGraphWeb.Presence do
  @moduledoc """
  Phoenix Presence for CGraphWeb.

  Delegates to CGraph.Presence for the core functionality
  but provides the Phoenix.Presence behaviour for channels.

  `use Phoenix.Presence` generates track/3, update/3, list/1
  automatically — no manual overrides needed.
  """

  use Phoenix.Presence,
    otp_app: :cgraph,
    pubsub_server: CGraph.PubSub
end
