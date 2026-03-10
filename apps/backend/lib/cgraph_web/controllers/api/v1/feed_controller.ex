defmodule CGraphWeb.API.V1.FeedController do
  @moduledoc "API controller for Discovery feed endpoints."
  use CGraphWeb, :controller

  alias CGraph.Discovery

  action_fallback CGraphWeb.FallbackController

  @valid_modes ~w(pulse fresh rising deep_cut frequency_surf)

  @doc "GET /api/v1/feed?mode=pulse&cursor=X&community_id=Y"
  def index(conn, params) do
    mode = Map.get(params, "mode", "pulse")

    if mode in @valid_modes do
      mode_atom = String.to_existing_atom(mode)
      user_id = conn.assigns.current_user.id

      opts = [
        user_id: user_id,
        cursor: Map.get(params, "cursor"),
        per_page: parse_per_page(params),
        community_id: Map.get(params, "community_id")
      ]

      {threads, meta} = Discovery.list_feed(mode_atom, opts)

      conn
      |> put_status(200)
      |> render(:index, threads: threads, meta: meta)
    else
      conn
      |> put_status(400)
      |> json(%{error: "Invalid mode. Valid: #{Enum.join(@valid_modes, ", ")}"})
    end
  end

  defp parse_per_page(params) do
    case Map.get(params, "per_page") do
      nil -> 25
      val when is_binary(val) -> min(100, max(1, String.to_integer(val)))
      val when is_integer(val) -> min(100, max(1, val))
    end
  rescue
    _ -> 25
  end
end
