defmodule CGraph.Encryption.EncryptedMap do
  @moduledoc """
  Ecto custom type for encrypted map/JSON fields.

  ## Usage

      schema "users" do
        field :settings, CGraph.Encryption.EncryptedMap
        field :metadata, CGraph.Encryption.EncryptedMap
      end
  """

  use Ecto.Type

  @impl true
  def type, do: :binary

  @impl true
  def cast(value) when is_map(value), do: {:ok, value}
  def cast(nil), do: {:ok, nil}
  def cast(_), do: :error

  @impl true
  def load(nil), do: {:ok, nil}

  def load(data) when is_binary(data) do
    case CGraph.Encryption.decrypt(data) do
      {:ok, json} ->
        case Jason.decode(json) do
          {:ok, map} -> {:ok, map}
          _ -> :error
        end
      {:error, _} -> :error
    end
  end

  @impl true
  def dump(nil), do: {:ok, nil}

  def dump(value) when is_map(value) do
    case Jason.encode(value) do
      {:ok, json} ->
        case CGraph.Encryption.encrypt(json, format: :binary) do
          {:ok, ciphertext} -> {:ok, ciphertext}
          {:error, _} -> :error
        end
      _ -> :error
    end
  end

  def dump(_), do: :error

  @impl true
  def equal?(a, b), do: a == b
end
