defmodule CGraphWeb.Plugs.GeoRouter do
  @moduledoc """
  Geo-routing plug for multi-region deployment.

  ## Overview

  Routes write requests to the primary region and serves read requests
  from the nearest region. Uses Fly.io's `fly-replay` header for
  automatic request proxying between regions.

  ## Architecture

  ```
  ┌───────────────┐                    ┌───────────────┐
  │  US User      │───▶ iad region     │  EU User      │───▶ fra region
  │               │     ┌──────────┐   │               │     ┌──────────┐
  │               │     │ Read ✓   │   │               │     │ Read ✓   │
  │               │     │ Write: ──┼──▶│   Primary     │     │ Write ✓  │
  │               │     │ replay   │   │   Region      │     │          │
  │               │     └──────────┘   │               │     └──────────┘
  └───────────────┘                    └───────────────┘
  ```

  ## Configuration

  Set these environment variables:
  - `CGRAPH_REGION` — Current region identifier (e.g., "iad", "fra")
  - `CGRAPH_PRIMARY_REGION` — Primary (write) region (e.g., "fra")

  ## Usage

  Add to your router pipeline:

      pipeline :api do
        plug CGraphWeb.Plugs.GeoRouter
      end
  """

  @behaviour Plug

  import Plug.Conn
  require Logger

  @write_methods ~w(POST PUT PATCH DELETE)

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    current_region = System.get_env("CGRAPH_REGION")
    primary_region = System.get_env("CGRAPH_PRIMARY_REGION")

    # If not in multi-region mode, pass through
    if is_nil(current_region) or is_nil(primary_region) do
      conn
    else
      maybe_replay(conn, current_region, primary_region)
    end
  end

  defp maybe_replay(conn, region, primary) when region == primary do
    # We ARE the primary region — handle all requests
    conn
    |> put_resp_header("x-cgraph-region", region)
  end

  defp maybe_replay(conn, region, primary) do
    conn = put_resp_header(conn, "x-cgraph-region", region)

    if write_request?(conn) and not replay_exempt?(conn) do
      # Forward writes to primary region via Fly.io replay
      Logger.debug("replay_write_to_primary",
        primary_region: primary,
        path: conn.request_path,
        method: conn.method,
        from_region: region,
        to_region: primary
      )

      conn
      |> put_resp_header("fly-replay", "region=#{primary}")
      |> send_resp(307, "")
      |> halt()
    else
      # Serve reads from local region
      conn
    end
  end

  defp write_request?(conn) do
    conn.method in @write_methods
  end

  # Some write endpoints should be handled locally
  defp replay_exempt?(conn) do
    exempted_paths = [
      "/health",
      "/ready",
      "/metrics",
      # WebSocket upgrade requests should connect to nearest region
      "/socket"
    ]

    Enum.any?(exempted_paths, &String.starts_with?(conn.request_path, &1))
  end
end
