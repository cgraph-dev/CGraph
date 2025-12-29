defmodule CgraphWeb.API.Response do
  @moduledoc """
  Standardized API response formatting for consistent client experience.
  
  ## Design Philosophy
  
  All API responses follow a predictable structure that enables:
  
  1. **Client consistency**: Frontend code can use a single response parser
  2. **Error handling**: Structured errors with codes, messages, and context
  3. **Pagination**: Standard cursor and offset pagination patterns
  4. **Metadata**: Response includes timing, version, and request ID
  
  ## Response Envelope
  
  ### Success Response
  
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": {
      "request_id": "req_abc123",
      "timestamp": "2024-01-15T12:00:00Z",
      "version": "v1"
    }
  }
  ```
  
  ### Paginated Response
  
  ```json
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "total": 100,
      "page": 1,
      "per_page": 20,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false,
      "next_cursor": "eyJpZCI6MTAwfQ=="
    },
    "meta": { ... }
  }
  ```
  
  ### Error Response
  
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "The request contains invalid data",
      "details": {
        "field": "email",
        "reason": "has invalid format"
      },
      "help_url": "https://docs.cgraph.io/errors/VALIDATION_ERROR"
    },
    "meta": { ... }
  }
  ```
  
  ## Error Codes
  
  | Code | HTTP Status | Description |
  |------|-------------|-------------|
  | `VALIDATION_ERROR` | 400 | Request validation failed |
  | `INVALID_REQUEST` | 400 | Malformed request |
  | `UNAUTHORIZED` | 401 | Authentication required |
  | `FORBIDDEN` | 403 | Insufficient permissions |
  | `NOT_FOUND` | 404 | Resource not found |
  | `CONFLICT` | 409 | Resource conflict |
  | `RATE_LIMITED` | 429 | Too many requests |
  | `INTERNAL_ERROR` | 500 | Server error |
  
  ## Usage in Controllers
  
  ```elixir
  def show(conn, %{"id" => id}) do
    case Users.get_user(id) do
      {:ok, user} ->
        conn |> success(user)
        
      {:error, :not_found} ->
        conn |> not_found("User not found")
    end
  end
  
  def index(conn, params) do
    {users, pagination} = Users.list_users(params)
    conn |> paginated(users, pagination)
  end
  ```
  """
  
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]
  
  @type error_code :: 
    :validation_error | :invalid_request | :unauthorized | 
    :forbidden | :not_found | :conflict | :rate_limited | 
    :internal_error | :service_unavailable
  
  @error_status_map %{
    validation_error: 400,
    invalid_request: 400,
    unauthorized: 401,
    forbidden: 403,
    not_found: 404,
    conflict: 409,
    gone: 410,
    unprocessable_entity: 422,
    rate_limited: 429,
    internal_error: 500,
    service_unavailable: 503
  }

  # ---------------------------------------------------------------------------
  # Success Responses
  # ---------------------------------------------------------------------------
  
  @doc """
  Send a successful response with data.
  
  ## Examples
  
      conn |> success(%{id: 1, name: "John"})
      conn |> success(users, status: 201)
  """
  def success(conn, data, opts \\ []) do
    status = Keyword.get(opts, :status, 200)
    
    response = %{
      success: true,
      data: data,
      meta: build_meta(conn)
    }
    
    conn
    |> put_status(status)
    |> json(response)
  end
  
  @doc """
  Send a successful response for resource creation (201 Created).
  """
  def created(conn, data, opts \\ []) do
    location = Keyword.get(opts, :location)
    
    conn = if location do
      put_resp_header(conn, "location", location)
    else
      conn
    end
    
    success(conn, data, status: 201)
  end
  
  @doc """
  Send a successful response with no content (204 No Content).
  """
  def no_content(conn) do
    conn
    |> put_status(204)
    |> send_resp(204, "")
  end
  
  @doc """
  Send a successful response for accepted async operations (202 Accepted).
  """
  def accepted(conn, data \\ nil) do
    response = %{
      success: true,
      data: data,
      meta: build_meta(conn) |> Map.put(:status, "accepted")
    }
    
    conn
    |> put_status(202)
    |> json(response)
  end

  # ---------------------------------------------------------------------------
  # Paginated Responses
  # ---------------------------------------------------------------------------
  
  @doc """
  Send a paginated response with data and pagination metadata.
  
  ## Pagination Metadata
  
  Accepts pagination info as a map with:
  - `:total` - Total number of items
  - `:page` - Current page number
  - `:per_page` - Items per page
  - `:next_cursor` - Cursor for next page (cursor-based pagination)
  - `:prev_cursor` - Cursor for previous page
  
  ## Examples
  
      {users, meta} = Users.list_users(page: 1, per_page: 20)
      conn |> paginated(users, meta)
  """
  def paginated(conn, data, pagination_info) do
    pagination = build_pagination(pagination_info)
    
    response = %{
      success: true,
      data: data,
      pagination: pagination,
      meta: build_meta(conn)
    }
    
    conn
    |> put_status(200)
    |> json(response)
  end
  
  defp build_pagination(info) when is_map(info) do
    total = Map.get(info, :total, 0)
    page = Map.get(info, :page, 1)
    per_page = Map.get(info, :per_page, 20)
    total_pages = if per_page > 0, do: ceil(total / per_page), else: 0
    
    base = %{
      total: total,
      page: page,
      per_page: per_page,
      total_pages: total_pages,
      has_next: page < total_pages,
      has_prev: page > 1
    }
    
    # Add cursor fields if present
    base
    |> maybe_add(:next_cursor, Map.get(info, :next_cursor))
    |> maybe_add(:prev_cursor, Map.get(info, :prev_cursor))
    |> maybe_add(:end_cursor, Map.get(info, :end_cursor))
  end
  
  defp maybe_add(map, _key, nil), do: map
  defp maybe_add(map, key, value), do: Map.put(map, key, value)

  # ---------------------------------------------------------------------------
  # Error Responses
  # ---------------------------------------------------------------------------
  
  @doc """
  Send an error response with structured error information.
  
  ## Parameters
  
  - `conn` - The connection
  - `code` - Error code atom (e.g., `:validation_error`, `:not_found`)
  - `message` - Human-readable error message
  - `opts` - Additional options:
    - `:details` - Additional error context
    - `:field` - Field that caused the error (for validation)
    - `:status` - Override HTTP status code
  
  ## Examples
  
      conn |> error(:validation_error, "Invalid email format", field: "email")
      conn |> error(:not_found, "User not found")
      conn |> error(:forbidden, "You cannot access this resource")
  """
  def error(conn, code, message, opts \\ []) do
    status = Keyword.get(opts, :status) || Map.get(@error_status_map, code, 500)
    details = Keyword.get(opts, :details)
    field = Keyword.get(opts, :field)
    
    error_body = %{
      code: format_error_code(code),
      message: message
    }
    
    error_body = if details, do: Map.put(error_body, :details, details), else: error_body
    error_body = if field, do: Map.put(error_body, :field, field), else: error_body
    error_body = Map.put(error_body, :help_url, help_url_for(code))
    
    response = %{
      success: false,
      error: error_body,
      meta: build_meta(conn)
    }
    
    conn
    |> put_status(status)
    |> json(response)
  end
  
  @doc """
  Send a validation error response from an Ecto changeset.
  
  Automatically extracts and formats all validation errors.
  """
  def validation_error(conn, %Ecto.Changeset{} = changeset) do
    errors = format_changeset_errors(changeset)
    
    error(conn, :validation_error, "Validation failed", details: errors)
  end
  
  @doc """
  Shorthand for not found errors.
  """
  def not_found(conn, message \\ "Resource not found") do
    error(conn, :not_found, message)
  end
  
  @doc """
  Shorthand for unauthorized errors.
  """
  def unauthorized(conn, message \\ "Authentication required") do
    error(conn, :unauthorized, message)
  end
  
  @doc """
  Shorthand for forbidden errors.
  """
  def forbidden(conn, message \\ "You don't have permission to access this resource") do
    error(conn, :forbidden, message)
  end
  
  @doc """
  Shorthand for conflict errors (e.g., duplicate resource).
  """
  def conflict(conn, message \\ "Resource already exists") do
    error(conn, :conflict, message)
  end
  
  @doc """
  Shorthand for internal server errors.
  
  Logs the error details but returns a generic message to clients.
  """
  def internal_error(conn, reason \\ nil) do
    if reason do
      require Logger
      Logger.error("Internal server error: #{inspect(reason)}")
    end
    
    error(conn, :internal_error, "An unexpected error occurred. Please try again later.")
  end

  # ---------------------------------------------------------------------------
  # Helper Functions
  # ---------------------------------------------------------------------------
  
  defp build_meta(conn) do
    request_id = get_request_id(conn)
    
    %{
      request_id: request_id,
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      version: "v1"
    }
  end
  
  defp get_request_id(conn) do
    case get_resp_header(conn, "x-request-id") do
      [id | _] -> id
      [] -> 
        case get_req_header(conn, "x-request-id") do
          [id | _] -> id
          [] -> generate_request_id()
        end
    end
  end
  
  defp generate_request_id do
    "req_" <> Base.encode32(:crypto.strong_rand_bytes(10), case: :lower, padding: false)
  end
  
  defp format_error_code(code) when is_atom(code) do
    code
    |> Atom.to_string()
    |> String.upcase()
  end
  
  defp help_url_for(code) do
    base_url = Application.get_env(:cgraph, :docs_base_url, "https://docs.cgraph.io")
    "#{base_url}/errors/#{format_error_code(code)}"
  end
  
  @doc """
  Format Ecto changeset errors into a structured map.
  
  Handles nested changesets and arrays.
  """
  def format_changeset_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts
        |> Keyword.get(String.to_existing_atom(key), key)
        |> to_string()
      end)
    end)
  end
end
