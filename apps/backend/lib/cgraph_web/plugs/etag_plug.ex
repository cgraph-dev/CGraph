defmodule CGraphWeb.Plugs.ETagPlug do
  @moduledoc """
  HTTP caching via ETag/If-None-Match headers.

  Reduces bandwidth for read-heavy endpoints by returning 304 Not Modified
  when content hasn't changed. Supports both strong and weak ETags.

  ## Usage

  Add to router pipeline for read endpoints:

      plug CGraphWeb.Plugs.ETagPlug

  Or use the helper in controllers for fine-grained control:

      def show(conn, %{"id" => id}) do
        with {:ok, resource} <- get_resource(id) do
          conn
          |> ETagPlug.put_etag(resource)
          |> render(:show, resource: resource)
        end
      end

  ## ETag Generation

  ETags are generated from:
  - `updated_at` timestamp (if present on struct)
  - Content hash (MD5 of JSON-encoded response)
  - Custom etag field (if struct has `etag` field)

  ## Cache Control

  By default, sets `Cache-Control: private, max-age=60` for authenticated
  responses and `public, max-age=300` for public endpoints.
  """

  import Plug.Conn

  @behaviour Plug

  @type etag_source :: struct() | map() | binary() | [struct() | map()]

  # Default cache durations in seconds
  @private_max_age 60
  @public_max_age 300

  @impl Plug
  def init(opts) do
    %{
      # Whether to compute ETag from response body (slower but more accurate)
      compute_from_body: Keyword.get(opts, :compute_from_body, false),
      # Whether responses can be cached publicly
      public: Keyword.get(opts, :public, false),
      # Custom max-age override
      max_age: Keyword.get(opts, :max_age, nil)
    }
  end

  @impl Plug
  def call(conn, opts) do
    conn
    |> register_before_send(&handle_etag(&1, opts))
    |> put_cache_control(opts, conn.assigns[:current_user])
  end

  @doc """
  Manually set an ETag for the response.

  ## Examples

      conn |> ETagPlug.put_etag(resource)
      conn |> ETagPlug.put_etag([resource1, resource2])
      conn |> ETagPlug.put_etag("custom-etag-value")
  """
  @spec put_etag(Plug.Conn.t(), etag_source()) :: Plug.Conn.t()
  def put_etag(conn, source) do
    etag = generate_etag(source)
    assign(conn, :computed_etag, etag)
  end

  @doc """
  Check if request has matching ETag and should return 304.

  Use this for early exit in controllers when data fetch is expensive:

      def show(conn, %{"id" => id}) do
        case check_etag(conn, cached_etag_for(id)) do
          {:not_modified, conn} -> conn
          {:ok, conn} ->
            # Proceed with expensive data fetch
            ...
        end
      end
  """
  @spec check_etag(Plug.Conn.t(), binary()) :: {:not_modified, Plug.Conn.t()} | {:ok, Plug.Conn.t()}
  def check_etag(conn, etag) do
    quoted_etag = quote_etag(etag)

    if etag_matches?(conn, quoted_etag) do
      conn =
        conn
        |> put_resp_header("etag", quoted_etag)
        |> send_resp(304, "")
        |> halt()

      {:not_modified, conn}
    else
      {:ok, assign(conn, :computed_etag, etag)}
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp handle_etag(conn, opts) do
    # Only process successful GET/HEAD responses
    if conn.method in ["GET", "HEAD"] and conn.status in 200..299 do
      process_etag(conn, opts)
    else
      conn
    end
  end

  defp process_etag(conn, opts) do
    etag = get_or_compute_etag(conn, opts)

    if etag do
      quoted_etag = quote_etag(etag)

      if etag_matches?(conn, quoted_etag) do
        # Return 304 Not Modified
        conn
        |> put_resp_header("etag", quoted_etag)
        |> put_resp_content_type_if_missing()
        |> resp(304, "")
      else
        put_resp_header(conn, "etag", quoted_etag)
      end
    else
      conn
    end
  end

  defp get_or_compute_etag(conn, opts) do
    cond do
      # Use pre-computed ETag from controller
      etag = conn.assigns[:computed_etag] ->
        etag

      # Compute from response body if enabled
      opts.compute_from_body and conn.resp_body ->
        compute_body_etag(conn.resp_body)

      true ->
        nil
    end
  end

  defp compute_body_etag(body) when is_binary(body) do
    :crypto.hash(:md5, body)
    |> Base.encode16(case: :lower)
    |> then(&"W/\"#{&1}\"")
  end

  defp compute_body_etag(body) when is_list(body) do
    body
    |> IO.iodata_to_binary()
    |> compute_body_etag()
  end

  @doc false
  def generate_etag(source)

  # Generate from struct with updated_at
  def generate_etag(%{updated_at: %DateTime{} = updated_at, id: id}) do
    hash_input = "#{id}:#{DateTime.to_unix(updated_at, :microsecond)}"
    hash_etag(hash_input)
  end

  def generate_etag(%{updated_at: %NaiveDateTime{} = updated_at, id: id}) do
    unix = updated_at |> DateTime.from_naive!("Etc/UTC") |> DateTime.to_unix(:microsecond)
    hash_input = "#{id}:#{unix}"
    hash_etag(hash_input)
  end

  # Generate from struct with custom etag field
  def generate_etag(%{etag: etag}) when is_binary(etag), do: etag

  # Generate from list of resources (collection ETag)
  def generate_etag(resources) when is_list(resources) do
    resources
    |> Enum.map_join(":", &extract_etag_component/1)
    |> hash_etag()
  end

  # Generate from arbitrary map (hash the content)
  def generate_etag(%{} = map) do
    map
    |> :erlang.term_to_binary()
    |> hash_etag()
  end

  # Use string directly as ETag
  def generate_etag(etag) when is_binary(etag), do: etag

  # Fallback
  def generate_etag(_), do: nil

  defp extract_etag_component(%{updated_at: updated_at, id: id}) do
    timestamp = case updated_at do
      %DateTime{} = dt -> DateTime.to_unix(dt, :microsecond)
      %NaiveDateTime{} = ndt ->
        ndt |> DateTime.from_naive!("Etc/UTC") |> DateTime.to_unix(:microsecond)
      _ -> 0
    end
    "#{id}:#{timestamp}"
  end

  defp extract_etag_component(%{id: id}), do: "#{id}:0"
  defp extract_etag_component(other), do: :erlang.phash2(other)

  defp hash_etag(input) when is_binary(input) do
    :crypto.hash(:md5, input)
    |> Base.encode16(case: :lower)
    |> binary_part(0, 16)  # Use first 16 chars for shorter ETag
  end

  defp quote_etag(etag) do
    cond do
      # Already quoted (weak or strong)
      String.starts_with?(etag, "\"") or String.starts_with?(etag, "W/\"") ->
        etag

      # Weak ETag indicator
      String.starts_with?(etag, "W/") ->
        "W/\"#{String.trim_leading(etag, "W/")}\""

      # Quote as strong ETag
      true ->
        "\"#{etag}\""
    end
  end

  defp etag_matches?(conn, quoted_etag) do
    case get_req_header(conn, "if-none-match") do
      [] -> false
      [client_etag | _] -> compare_etags(client_etag, quoted_etag)
    end
  end

  defp compare_etags(client_etag, server_etag) do
    # Handle wildcard
    if String.trim(client_etag) == "*" do
      true
    else
      # Compare ETags (weak comparison per RFC 7232)
      normalize_etag(client_etag) == normalize_etag(server_etag)
    end
  end

  defp normalize_etag(etag) do
    etag
    |> String.trim()
    |> String.trim_leading("W/")
    |> String.trim("\"")
  end

  defp put_cache_control(conn, opts, current_user) do
    max_age = opts.max_age || if(current_user, do: @private_max_age, else: @public_max_age)
    visibility = if(opts.public and is_nil(current_user), do: "public", else: "private")

    put_resp_header(conn, "cache-control", "#{visibility}, max-age=#{max_age}")
  end

  defp put_resp_content_type_if_missing(conn) do
    case get_resp_header(conn, "content-type") do
      [] -> put_resp_content_type(conn, "application/json")
      _ -> conn
    end
  end
end
