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
  @doc "Returns the underlying Ecto type for the encrypted map."
  @spec type() :: atom()
  def type, do: :binary

  @doc "Casts the given value to the encrypted map type."
  @impl true
  @spec cast(term()) :: {:ok, map() | nil} | :error
  def cast(value) when is_map(value), do: {:ok, value}
  def cast(nil), do: {:ok, nil}
  def cast(_), do: :error

  @impl true
  @doc "Loads and decrypts the map from the database."
  @spec load(term()) :: {:ok, map() | nil} | :error
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
  @doc "Encrypts and dumps the map for database storage."
  @spec dump(term()) :: {:ok, binary() | nil} | :error
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

  @doc "Casts the given value to the encrypted map type."
  def dump(_), do: :error

  @impl true
  @doc "Compares two encrypted map values for equality."
  @spec equal?(term(), term()) :: boolean()
  def equal?(a, b), do: a == b
end
