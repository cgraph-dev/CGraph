defmodule CGraphWeb.Plugs.Cors do
  @moduledoc """
  Custom CORS plug with runtime origin configuration.
  
  Reads CORS_ORIGINS from environment at runtime (not compile time),
  allowing dynamic configuration via Fly.io secrets.
  """
  import Plug.Conn

  @behaviour Plug

  @is_prod Mix.env() == :prod

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    origin = get_req_header(conn, "origin") |> List.first()
    
    if origin && origin_allowed?(origin) do
      conn
      |> put_resp_header("access-control-allow-origin", origin)
      |> put_resp_header("access-control-allow-credentials", "true")
      |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
      |> put_resp_header("access-control-allow-headers", "authorization, content-type, x-requested-with, idempotency-key, x-api-version")
      |> put_resp_header("access-control-max-age", "86400")
      |> handle_preflight()
    else
      conn
    end
  end

  defp handle_preflight(%{method: "OPTIONS"} = conn) do
    conn
    |> send_resp(204, "")
    |> halt()
  end

  defp handle_preflight(conn), do: conn

  defp origin_allowed?(origin) do
    allowed_origins = get_cors_origins()
    
    case allowed_origins do
      "*" -> true
      origins when is_list(origins) ->
        Enum.any?(origins, fn
          %Regex{} = regex -> Regex.match?(regex, origin)
          allowed when is_binary(allowed) -> allowed == origin
        end)
      _ -> false
    end
  end

  defp get_cors_origins do
    case {System.get_env("CORS_ORIGINS"), @is_prod} do
      {nil, true} ->
        [
          # Production domains
          "https://cgraph.org",
          "https://www.cgraph.org",
          "https://app.cgraph.org",
          # Vercel deployment domains (specific deployments)
          "https://cgraph.vercel.app",
          "https://cgraph-web.vercel.app",
          "https://c-graph.vercel.app",
          "https://cgraph-web-v2.vercel.app",
          # Vercel preview deployments (Discord-style: allow all vercel.app subdomains)
          # Pattern: cgraph-{hash}-{team}.vercel.app or cgraph-{branch}-{team}.vercel.app
          # This is safe because:
          # 1. Only allows *.vercel.app domains (Vercel-controlled)
          # 2. Requires 'cgraph' prefix to prevent other Vercel projects
          # 3. Authentication still required for sensitive operations
          ~r/^https:\/\/cgraph[a-z0-9-]*\.vercel\.app$/
        ]

      {nil, false} ->
        "*"

      {origins, _} ->
        String.split(origins, ",", trim: true)
    end
  end
end
