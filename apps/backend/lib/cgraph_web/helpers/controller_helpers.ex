defmodule CgraphWeb.ControllerHelpers do
  @moduledoc """
  Shared helper functions for controllers.
  
  Provides utilities for:
  - Safe parameter parsing
  - Pagination parameter extraction
  - Input validation
  """

  @doc """
  Safely parses a string to integer with a default value.
  Returns the default if parsing fails or the value is non-positive.
  
  ## Examples
  
      iex> safe_to_integer("5", 1)
      5
      
      iex> safe_to_integer("abc", 1)
      1
      
      iex> safe_to_integer("-3", 1)
      1
      
      iex> safe_to_integer(nil, 10)
      10
  """
  @spec safe_to_integer(String.t() | nil, integer()) :: integer()
  def safe_to_integer(nil, default), do: default
  def safe_to_integer(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} when int > 0 -> int
      _ -> default
    end
  end
  def safe_to_integer(value, _default) when is_integer(value) and value > 0, do: value
  def safe_to_integer(_, default), do: default

  @doc """
  Extracts pagination parameters from params map.
  Returns a keyword list with :page and :per_page.
  
  ## Options
  
  - `:max_per_page` - Maximum allowed per_page value (default: 100)
  - `:default_per_page` - Default per_page value (default: 20)
  
  ## Examples
  
      iex> extract_pagination_params(%{"page" => "2", "per_page" => "50"})
      [page: 2, per_page: 50]
      
      iex> extract_pagination_params(%{"page" => "invalid"})
      [page: 1, per_page: 20]
  """
  @spec extract_pagination_params(map(), keyword()) :: keyword()
  def extract_pagination_params(params, opts \\ []) do
    max_per_page = Keyword.get(opts, :max_per_page, 100)
    default_per_page = Keyword.get(opts, :default_per_page, 20)
    
    page = safe_to_integer(Map.get(params, "page"), 1)
    per_page = safe_to_integer(Map.get(params, "per_page"), default_per_page)
    
    # Enforce maximum per_page
    per_page = min(per_page, max_per_page)
    
    [page: page, per_page: per_page]
  end

  @doc """
  Sanitizes a search query string.
  - Limits length to max_length (default 200)
  - Trims whitespace
  - Returns nil for empty strings
  
  ## Examples
  
      iex> sanitize_search_query("  hello world  ")
      "hello world"
      
      iex> sanitize_search_query("   ")
      nil
      
      iex> sanitize_search_query(nil)
      nil
  """
  @spec sanitize_search_query(String.t() | nil, keyword()) :: String.t() | nil
  def sanitize_search_query(query, opts \\ [])
  def sanitize_search_query(nil, _opts), do: nil
  def sanitize_search_query(query, opts) when is_binary(query) do
    max_length = Keyword.get(opts, :max_length, 200)
    
    sanitized = query
      |> String.trim()
      |> String.slice(0, max_length)
    
    case sanitized do
      "" -> nil
      _ -> sanitized
    end
  end

  @doc """
  Escapes special characters in LIKE/ILIKE patterns.
  Prevents wildcard injection attacks.
  
  ## Examples
  
      iex> escape_like_pattern("hello%world")
      "hello\\%world"
      
      iex> escape_like_pattern("user_name")
      "user\\_name"
  """
  @spec escape_like_pattern(String.t()) :: String.t()
  def escape_like_pattern(pattern) when is_binary(pattern) do
    pattern
    |> String.replace("\\", "\\\\")
    |> String.replace("%", "\\%")
    |> String.replace("_", "\\_")
  end

  @doc """
  Creates a safe search pattern for ILIKE queries.
  Escapes special characters and wraps with wildcards.
  
  ## Examples
  
      iex> build_search_pattern("hello")
      "%hello%"
      
      iex> build_search_pattern("user%name")
      "%user\\%name%"
  """
  @spec build_search_pattern(String.t()) :: String.t()
  def build_search_pattern(query) when is_binary(query) do
    escaped = escape_like_pattern(query)
    "%#{escaped}%"
  end
end
