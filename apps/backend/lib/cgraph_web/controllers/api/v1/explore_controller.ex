defmodule CGraphWeb.API.V1.ExploreController do
  @moduledoc """
  Handles community discovery / explore endpoints.

  Provides a unified view of discoverable groups and public forums
  for the community explore page.

  ## Endpoints

  - `GET /api/v1/explore` — list communities with optional filters

  ## Query Parameters

  - `category` — filter by category (gaming, technology, etc.)
  - `sort` — sort order: popular (default), newest, alphabetical
  - `q` — search query for community name
  - `limit` — max results (default 20, max 50)
  - `offset` — pagination offset (default 0)
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_data: 3]

  alias CGraph.Explore

  @doc """
  Returns a combined feed of discoverable groups and public forums.

  GET /api/v1/explore
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    opts = [
      category: params["category"],
      sort: parse_sort(params["sort"]),
      query: params["q"],
      limit: parse_int(params["limit"], 20),
      offset: parse_int(params["offset"], 0)
    ]

    %{communities: communities, categories: categories, total: total} =
      Explore.discover(opts)

    render_data(conn, %{
      communities: Enum.map(communities, &serialize_community/1),
      categories: categories,
      total: total
    })
  end

  # ── Serialization ──────────────────────────────────────────────────

  defp serialize_community(community) do
    %{
      id: community.id,
      type: to_string(community.type),
      name: community.name,
      description: community.description,
      member_count: community.member_count,
      avatar_url: community.avatar_url,
      category: community.category,
      created_at: format_datetime(community.created_at),
      is_verified: community.is_verified
    }
  end

  defp format_datetime(nil), do: nil
  defp format_datetime(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp format_datetime(%NaiveDateTime{} = ndt), do: NaiveDateTime.to_iso8601(ndt)
  defp format_datetime(other), do: to_string(other)

  # ── Parameter Parsing ──────────────────────────────────────────────

  defp parse_sort("newest"), do: :newest
  defp parse_sort("alphabetical"), do: :alphabetical
  defp parse_sort(_), do: :popular

  defp parse_int(nil, default), do: default

  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {n, _} when n > 0 -> min(n, 50)
      _ -> default
    end
  end

  defp parse_int(val, _default) when is_integer(val), do: min(max(val, 1), 50)
  defp parse_int(_, default), do: default
end
