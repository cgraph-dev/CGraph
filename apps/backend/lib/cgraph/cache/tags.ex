defmodule CGraph.Cache.Tags do
  @moduledoc """
  Tag-based cache invalidation.

  Associates cache keys with one or more tags so that entire
  groups of keys can be invalidated at once (e.g. all entries
  belonging to a specific user).

  Tag→key mappings are stored in the L2 (Cachex) tier with
  infinite TTL.
  """

  alias CGraph.Cache.L2

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Associate `key` with each of the given `tags`.
  """
  @spec store(term(), [term()]) :: :ok
  def store(key, tags) do
    Enum.each(tags, fn tag ->
      tag_key = storage_key(tag)

      case L2.get(tag_key) do
        {:ok, keys} -> L2.set(tag_key, [key | keys], :infinity)
        _ -> L2.set(tag_key, [key], :infinity)
      end
    end)
  end

  @doc """
  Return all cache keys associated with `tag`.
  """
  @spec get_keys(term()) :: {:ok, [term()]}
  def get_keys(tag) do
    tag_key = storage_key(tag)

    case L2.get(tag_key) do
      {:ok, keys} -> {:ok, keys}
      _ -> {:ok, []}
    end
  end

  @doc """
  Remove the tag→key mapping for `tag`.
  """
  @spec delete(term()) :: :ok
  def delete(tag) do
    tag_key = storage_key(tag)
    L2.delete(tag_key)
  end

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

  defp storage_key(tag) when is_atom(tag), do: "__tag:#{tag}"
  defp storage_key({type, id}), do: "__tag:#{type}:#{id}"
  defp storage_key(tag), do: "__tag:#{inspect(tag)}"
end
