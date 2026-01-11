defmodule CgraphWeb.Helpers.ParamParser do
  @moduledoc """
  Safe parameter parsing utilities for API controllers.

  Provides helper functions to safely parse user-provided parameters
  without risking ArgumentError exceptions that cause 500 errors.

  ## Usage

      import CgraphWeb.Helpers.ParamParser

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
end
