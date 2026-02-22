defmodule CGraph.Encryption.EncryptedField do
  @moduledoc """
  Ecto custom type for encrypted fields.

  ## Usage

      schema "users" do
        field :ssn, CGraph.Encryption.EncryptedField
        field :credit_card, CGraph.Encryption.EncryptedField
      end

  Data is automatically encrypted on insert/update and decrypted on load.
  """

  use Ecto.Type

  @impl true
  def type, do: :binary

  @impl true
  def cast(value) when is_binary(value) do
    {:ok, value}
  end

  def cast(nil), do: {:ok, nil}
  def cast(_), do: :error

  @impl true
  def load(nil), do: {:ok, nil}

  def load(data) when is_binary(data) do
    case CGraph.Encryption.decrypt(data) do
      {:ok, plaintext} -> {:ok, plaintext}
      {:error, _} -> :error
    end
  end

  @impl true
  def dump(nil), do: {:ok, nil}

  def dump(value) when is_binary(value) do
    case CGraph.Encryption.encrypt(value, format: :binary) do
      {:ok, ciphertext} -> {:ok, ciphertext}
      {:error, _} -> :error
    end
  end

  def dump(_), do: :error

  @impl true
  def equal?(a, b), do: a == b
end
