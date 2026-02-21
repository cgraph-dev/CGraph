defmodule CGraphWeb.API.InputValidation.TypeCoercion do
  @moduledoc """
  Type coercion for input validation.

  Converts raw input values to their expected Elixir types, supporting
  string, integer, float, boolean, atom, map, datetime, date, and array types.
  """

  @doc """
  Coerce a value to the specified type.

  Returns `{:ok, coerced_value}` on success or `{:error, [message]}` on failure.
  """
  @spec coerce(any(), atom() | {:array, atom()} | nil) :: {:ok, any()} | {:error, [String.t()]}
  def coerce(value, nil), do: {:ok, value}

  def coerce(value, :string) when is_binary(value), do: {:ok, value}
  def coerce(value, :string) when is_number(value), do: {:ok, to_string(value)}
  def coerce(value, :string) when is_atom(value), do: {:ok, Atom.to_string(value)}
  def coerce(_, :string), do: {:error, ["must be a string"]}

  def coerce(value, :integer) when is_integer(value), do: {:ok, value}
  def coerce(value, :integer) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} -> {:ok, int}
      _ -> {:error, ["must be an integer"]}
    end
  end
  def coerce(value, :integer) when is_float(value), do: {:ok, trunc(value)}
  def coerce(_, :integer), do: {:error, ["must be an integer"]}

  def coerce(value, :float) when is_float(value), do: {:ok, value}
  def coerce(value, :float) when is_integer(value), do: {:ok, value / 1}
  def coerce(value, :float) when is_binary(value) do
    case Float.parse(value) do
      {float, ""} -> {:ok, float}
      _ -> {:error, ["must be a number"]}
    end
  end
  def coerce(_, :float), do: {:error, ["must be a number"]}

  def coerce(value, :boolean) when is_boolean(value), do: {:ok, value}
  def coerce("true", :boolean), do: {:ok, true}
  def coerce("false", :boolean), do: {:ok, false}
  def coerce("1", :boolean), do: {:ok, true}
  def coerce("0", :boolean), do: {:ok, false}
  def coerce(1, :boolean), do: {:ok, true}
  def coerce(0, :boolean), do: {:ok, false}
  def coerce(_, :boolean), do: {:error, ["must be a boolean"]}

  def coerce(value, :atom) when is_atom(value), do: {:ok, value}
  def coerce(value, :atom) when is_binary(value) do
    {:ok, String.to_existing_atom(value)}
  rescue
    ArgumentError -> {:error, ["is not a valid value"]}
  end

  def coerce(value, :map) when is_map(value), do: {:ok, value}
  def coerce(value, :map) when is_binary(value) do
    case Jason.decode(value) do
      {:ok, map} when is_map(map) -> {:ok, map}
      _ -> {:error, ["must be a map/object"]}
    end
  end
  def coerce(_, :map), do: {:error, ["must be a map/object"]}

  def coerce(value, :datetime) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, dt, _} -> {:ok, dt}
      _ -> {:error, ["must be a valid ISO8601 datetime"]}
    end
  end
  def coerce(%DateTime{} = value, :datetime), do: {:ok, value}
  def coerce(_, :datetime), do: {:error, ["must be a datetime"]}

  def coerce(value, :date) when is_binary(value) do
    case Date.from_iso8601(value) do
      {:ok, date} -> {:ok, date}
      _ -> {:error, ["must be a valid ISO8601 date"]}
    end
  end
  def coerce(%Date{} = value, :date), do: {:ok, value}
  def coerce(_, :date), do: {:error, ["must be a date"]}

  def coerce(value, {:array, item_type}) when is_list(value) do
    results = Enum.map(value, &coerce(&1, item_type))

    errors =
      results
      |> Enum.with_index()
      |> Enum.filter(fn {{result, _}, _} -> result == :error end)
      |> Enum.map(fn {{:error, errs}, idx} -> "item #{idx}: #{Enum.join(errs, ", ")}" end)

    if errors == [] do
      {:ok, Enum.map(results, fn {:ok, v} -> v end)}
    else
      {:error, errors}
    end
  end
  def coerce(value, {:array, item_type}) when is_binary(value) do
    case Jason.decode(value) do
      {:ok, list} when is_list(list) -> coerce(list, {:array, item_type})
      _ -> {:error, ["must be an array"]}
    end
  end
  def coerce(_, {:array, _}), do: {:error, ["must be an array"]}
end
