defmodule CGraph.Redis.Helpers do
  @moduledoc """
  Shared encoding/decoding helpers for Redis submodules.
  """

  @doc """
  Encode a value for Redis storage.

  Handles binaries, integers, floats, and atoms natively.
  Complex terms are serialized via `:erlang.term_to_binary/1` and Base64-encoded.
  """
  def encode_value(value) when is_binary(value), do: value
  def encode_value(value) when is_integer(value), do: Integer.to_string(value)
  def encode_value(value) when is_float(value), do: Float.to_string(value)
  def encode_value(value) when is_atom(value), do: Atom.to_string(value)
  def encode_value(value), do: :erlang.term_to_binary(value) |> Base.encode64()
end
