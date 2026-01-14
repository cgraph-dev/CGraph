defmodule CGraphWeb.Helpers.ParamParser do
  @moduledoc """
  Safe parameter parsing utilities for API controllers.

  Provides helper functions to safely parse user-provided parameters
  without risking ArgumentError exceptions that cause 500 errors.

  ## Usage

      import CGraphWeb.Helpers.ParamParser

      def index(conn, params) do
        limit = parse_int(params["limit"], 50, min: 1, max: 100)
        offset = parse_int(params["offset"], 0, min: 0)
        category = parse_atom(params["category"], [:xp, :level, :coins], :xp)
        ...
      end

  ## Security Notes

  - Never use String.to_integer/1 or String.to_atom/1 directly on user input
  - Use parse_atom/3 with an explicit whitelist to prevent atom table exhaustion
  - Always provide sensible defaults for optional parameters
  """

  @doc """
  Safely parse an integer from a string parameter.

  ## Options

  - `:min` - Minimum allowed value (clamps result)
  - `:max` - Maximum allowed value (clamps result)

  ## Examples

      parse_int("50", 10)
      #=> 50

      parse_int("abc", 10)
      #=> 10

      parse_int(nil, 10)
      #=> 10

      parse_int("1000", 50, max: 100)
      #=> 100
  """
  @spec parse_int(term(), integer(), keyword()) :: integer()
  def parse_int(value, default, opts \\ [])

  def parse_int(nil, default, _opts), do: default

  def parse_int(value, default, opts) when is_binary(value) do
    case Integer.parse(value) do
      {int, _} -> clamp_value(int, opts)
      :error -> default
    end
  end

  def parse_int(value, _default, opts) when is_integer(value) do
    clamp_value(value, opts)
  end

  def parse_int(_value, default, _opts), do: default

  @doc """
  Safely parse an atom from a string parameter using a whitelist.

  NEVER converts arbitrary strings to atoms to prevent atom table exhaustion.

  ## Examples

      parse_atom("xp", [:xp, :level, :coins], :xp)
      #=> :xp

      parse_atom("invalid", [:xp, :level, :coins], :xp)
      #=> :xp

      parse_atom(nil, [:xp, :level, :coins], :xp)
      #=> :xp
  """
  @spec parse_atom(term(), [atom()], atom()) :: atom()
  def parse_atom(value, allowed, default)

  def parse_atom(nil, _allowed, default), do: default

  def parse_atom(value, allowed, default) when is_binary(value) do
    atom = try do
      String.to_existing_atom(value)
    rescue
      ArgumentError -> nil
    end

    if atom in allowed, do: atom, else: default
  end

  def parse_atom(value, allowed, default) when is_atom(value) do
    if value in allowed, do: value, else: default
  end

  def parse_atom(_value, _allowed, default), do: default

  @doc """
  Parse a boolean from string parameter.

  ## Examples

      parse_bool("true", false)
      #=> true

      parse_bool("1", false)
      #=> true

      parse_bool("false", true)
      #=> false
  """
  @spec parse_bool(term(), boolean()) :: boolean()
  def parse_bool(value, default)

  def parse_bool(nil, default), do: default

  def parse_bool(value, _default) when value in ["true", "1", "yes"], do: true
  def parse_bool(value, _default) when value in ["false", "0", "no"], do: false
  def parse_bool(value, _default) when is_boolean(value), do: value
  def parse_bool(_value, default), do: default

  @doc """
  Parse a UUID from string parameter, returning nil if invalid.
  """
  @spec parse_uuid(term()) :: String.t() | nil
  def parse_uuid(nil), do: nil
  def parse_uuid(value) when is_binary(value) do
    case Ecto.UUID.cast(value) do
      {:ok, uuid} -> uuid
      :error -> nil
    end
  end
  def parse_uuid(_), do: nil

  @doc """
  Parse a date from string parameter (ISO 8601 format).
  """
  @spec parse_date(term(), Date.t() | nil) :: Date.t() | nil
  def parse_date(nil, default), do: default
  def parse_date(value, default) when is_binary(value) do
    case Date.from_iso8601(value) do
      {:ok, date} -> date
      {:error, _} -> default
    end
  end
  def parse_date(_value, default), do: default

  @doc """
  Parse a datetime from string parameter (ISO 8601 format).
  """
  @spec parse_datetime(term(), DateTime.t() | nil) :: DateTime.t() | nil
  def parse_datetime(nil, default), do: default
  def parse_datetime(value, default) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> datetime
      {:error, _} -> default
    end
  end
  def parse_datetime(_value, default), do: default

  @doc """
  Parse and sanitize a string, with optional max length.
  Returns nil for empty strings.
  """
  @spec parse_string(term(), keyword()) :: String.t() | nil
  def parse_string(value, opts \\ [])
  def parse_string(nil, _opts), do: nil
  def parse_string(value, opts) when is_binary(value) do
    max_length = Keyword.get(opts, :max_length)
    trimmed = String.trim(value)

    cond do
      trimmed == "" -> nil
      max_length && String.length(trimmed) > max_length -> String.slice(trimmed, 0, max_length)
      true -> trimmed
    end
  end
  def parse_string(_value, _opts), do: nil

  # Private helpers

  defp clamp_value(value, opts) do
    min_val = Keyword.get(opts, :min)
    max_val = Keyword.get(opts, :max)

    value
    |> then(fn v -> if min_val, do: max(v, min_val), else: v end)
    |> then(fn v -> if max_val, do: min(v, max_val), else: v end)
  end

  # ---------------------------------------------------------------------------
  # Advanced Validation Helpers
  # ---------------------------------------------------------------------------

  @doc """
  Validate and sanitize a referral code.
  Referral codes must be 8-12 alphanumeric characters.
  """
  @spec parse_referral_code(term()) :: {:ok, String.t()} | {:error, :invalid_format}
  def parse_referral_code(nil), do: {:error, :invalid_format}
  def parse_referral_code(value) when is_binary(value) do
    cleaned = value |> String.trim() |> String.upcase()

    if Regex.match?(~r/^[A-Z0-9]{6,12}$/, cleaned) do
      {:ok, cleaned}
    else
      {:error, :invalid_format}
    end
  end
  def parse_referral_code(_), do: {:error, :invalid_format}

  @doc """
  Validate an event title with length and content restrictions.
  """
  @spec validate_event_title(term()) :: {:ok, String.t()} | {:error, atom()}
  def validate_event_title(nil), do: {:error, :title_required}
  def validate_event_title(value) when is_binary(value) do
    trimmed = String.trim(value)
    length = String.length(trimmed)

    cond do
      length < 3 -> {:error, :title_too_short}
      length > 200 -> {:error, :title_too_long}
      contains_prohibited_content?(trimmed) -> {:error, :prohibited_content}
      true -> {:ok, trimmed}
    end
  end
  def validate_event_title(_), do: {:error, :invalid_title}

  @doc """
  Validate event dates ensuring start is before end.
  """
  @spec validate_event_dates(term(), term()) :: {:ok, DateTime.t(), DateTime.t() | nil} | {:error, atom()}
  def validate_event_dates(start_date, end_date) do
    start_dt = parse_datetime(start_date, nil)
    end_dt = parse_datetime(end_date, nil)

    cond do
      is_nil(start_dt) -> {:error, :start_date_required}
      not is_nil(end_dt) and DateTime.compare(end_dt, start_dt) == :lt ->
        {:error, :end_date_before_start}
      DateTime.compare(start_dt, DateTime.utc_now() |> DateTime.add(-3600, :second)) == :lt ->
        {:error, :start_date_in_past}
      true -> {:ok, start_dt, end_dt}
    end
  end

  @doc """
  Validate visibility setting against allowed values.
  """
  @spec validate_visibility(term()) :: {:ok, String.t()} | {:error, :invalid_visibility}
  def validate_visibility(value) when value in ["public", "members_only", "invite_only", "private"] do
    {:ok, value}
  end
  def validate_visibility(nil), do: {:ok, "public"}
  def validate_visibility(_), do: {:error, :invalid_visibility}

  @doc """
  Validate pagination parameters with sensible bounds.
  Returns {page, per_page} tuple with validated values.
  """
  @spec validate_pagination(map(), keyword()) :: {pos_integer(), pos_integer()}
  def validate_pagination(params, opts \\ []) do
    max_per_page = Keyword.get(opts, :max_per_page, 100)
    default_per_page = Keyword.get(opts, :default_per_page, 25)

    page = parse_int(params["page"], 1, min: 1, max: 10_000)
    per_page = parse_int(params["per_page"], default_per_page, min: 1, max: max_per_page)

    {page, per_page}
  end

  @doc """
  Sanitize HTML content, stripping dangerous tags while preserving safe formatting.
  """
  @spec sanitize_html(term(), keyword()) :: String.t() | nil
  def sanitize_html(value, opts \\ [])
  def sanitize_html(nil, _opts), do: nil
  def sanitize_html(value, opts) when is_binary(value) do
    max_length = Keyword.get(opts, :max_length, 50_000)

    value
    |> String.slice(0, max_length)
    |> strip_dangerous_html()
    |> String.trim()
    |> then(fn s -> if s == "", do: nil, else: s end)
  end

  # Strip script tags, event handlers, and other XSS vectors
  defp strip_dangerous_html(html) do
    html
    |> String.replace(~r/<script\b[^>]*>.*?<\/script>/is, "")
    |> String.replace(~r/\bon\w+\s*=\s*["'][^"']*["']/i, "")
    |> String.replace(~r/javascript:/i, "")
    |> String.replace(~r/data:/i, "")
    |> String.replace(~r/<iframe\b[^>]*>.*?<\/iframe>/is, "")
    |> String.replace(~r/<object\b[^>]*>.*?<\/object>/is, "")
    |> String.replace(~r/<embed\b[^>]*>/i, "")
  end

  # Check for prohibited words/patterns (basic implementation)
  defp contains_prohibited_content?(text) do
    # This would typically integrate with a more sophisticated content moderation system
    prohibited_patterns = [
      ~r/\b(spam|scam)\b/i
    ]

    Enum.any?(prohibited_patterns, fn pattern ->
      Regex.match?(pattern, text)
    end)
  end
end
