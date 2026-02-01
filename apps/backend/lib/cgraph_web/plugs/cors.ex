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
    
    # Debug logging for CORS issues (use debug level in production)
    require Logger
    Logger.debug("CORS: method=#{conn.method} origin=#{inspect(origin)} allowed=#{origin && origin_allowed?(origin)}")
    
    if origin && origin_allowed?(origin) do
      conn
      |> put_resp_header("access-control-allow-origin", origin)
      |> put_resp_header("access-control-allow-credentials", "true")
      |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
      |> put_resp_header("access-control-allow-headers", "authorization, content-type, x-requested-with, idempotency-key, x-api-version")
      |> put_resp_header("access-control-max-age", "86400")
      |> handle_preflight()
    else
      # Still handle OPTIONS for non-allowed origins to prevent 404
      if conn.method == "OPTIONS" do
        Logger.warning("CORS: Rejecting preflight from origin=#{inspect(origin)}")
        conn
        |> send_resp(403, "Origin not allowed")
        |> halt()
      else
        conn
      end
    end
  end

  defp handle_preflight(%{method: "OPTIONS"} = conn) do
    conn
    |> send_resp(204, "")
    |> halt()
  end

  defp handle_preflight(conn), do: conn

  defp origin_allowed?(origin) do
    require Logger
    allowed_origins = get_cors_origins()
    
    Logger.debug("CORS: checking origin=#{inspect(origin)} against #{inspect(allowed_origins)}")
    
    case allowed_origins do
      "*" -> true
      origins when is_list(origins) ->
        result = Enum.any?(origins, fn
          %Regex{} = regex -> 
            match = Regex.match?(regex, origin)
            Logger.debug("CORS: regex match=#{match}")
            match
          allowed when is_binary(allowed) -> 
            match = allowed == origin
            if match, do: Logger.debug("CORS: exact match on #{allowed}")
            match
        end)
        Logger.debug("CORS: final result=#{result}")
        result
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
          "https://web.cgraph.org",
          # Vercel deployment domains (specific deployments)
          "https://cgraph.vercel.app",
          "https://cgraph-web.vercel.app",
          "https://c-graph.vercel.app",
          "https://c-graph-web.vercel.app",
          "https://cgraph-web-v2.vercel.app",
          "https://cgraph-landing.vercel.app",
          # Vercel preview deployments (Discord-style: allow all vercel.app subdomains)
          ~r/^https:\/\/(cgraph|c-graph)[a-z0-9-]*\.vercel\.app$/i
        ]

      {nil, false} ->
        "*"

      {origins, _} ->
        String.split(origins, ",", trim: true)
    end
  end
end
