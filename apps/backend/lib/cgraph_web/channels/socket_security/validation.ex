defmodule CGraphWeb.Channels.SocketSecurity.Validation do
  @moduledoc """
  Event payload validation for WebSocket messages.

  Validates incoming event payloads against expected schemas defined as maps
  with field specifications.

  ## Schema Format

      %{
        content: {:string, required: true, max_length: 2000},
        reply_to_id: {:string, required: false},
        attachments: {:list, required: false, max_items: 10}
      }
  """

  @doc """
  Validate an incoming event payload against expected schema.

  Returns `:ok` if valid, `{:error, %{validation_errors: map()}}` otherwise.
  """
  @spec validate_event(map(), map()) :: :ok | {:error, map()}
  def validate_event(payload, schema) when is_map(payload) and is_map(schema) do
    errors = Enum.reduce(schema, [], fn {field, spec}, acc ->
      value = Map.get(payload, to_string(field))

      case validate_field(value, spec) do
        :ok -> acc
        {:error, reason} -> [{field, reason} | acc]
      end
    end)

    if errors == [] do
      :ok
    else
      {:error, %{validation_errors: Enum.into(errors, %{})}}
    end
  end

  defp validate_field(value, {type, opts}) do
    required = Keyword.get(opts, :required, false)

    cond do
      is_nil(value) and required -> {:error, "is required"}
      is_nil(value) -> :ok
      true -> validate_type(value, type, opts)
    end
  end

  defp validate_type(value, :string, opts) do
    max_length = Keyword.get(opts, :max_length)
    min_length = Keyword.get(opts, :min_length, 0)

    cond do
      not is_binary(value) -> {:error, "must be a string"}
      max_length && String.length(value) > max_length -> {:error, "is too long"}
      String.length(value) < min_length -> {:error, "is too short"}
      true -> :ok
    end
  end

  defp validate_type(value, :integer, opts) do
    min = Keyword.get(opts, :min)
    max = Keyword.get(opts, :max)

    cond do
      not is_integer(value) -> {:error, "must be an integer"}
      min && value < min -> {:error, "is too small"}
      max && value > max -> {:error, "is too large"}
      true -> :ok
    end
  end

  defp validate_type(value, :boolean, _opts) do
    if is_boolean(value), do: :ok, else: {:error, "must be a boolean"}
  end

  defp validate_type(value, :list, opts) do
    max_items = Keyword.get(opts, :max_items)

    cond do
      not is_list(value) -> {:error, "must be a list"}
      max_items && length(value) > max_items -> {:error, "has too many items"}
      true -> :ok
    end
  end

  defp validate_type(value, :uuid, _opts) do
    case Ecto.UUID.cast(value) do
      {:ok, _} -> :ok
      :error -> {:error, "must be a valid UUID"}
    end
  end
end
