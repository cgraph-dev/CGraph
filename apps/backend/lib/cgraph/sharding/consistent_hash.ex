defmodule CGraph.Sharding.ConsistentHash do
  @moduledoc """
  Consistent hashing ring for shard distribution.

  Uses virtual nodes (vnodes) to distribute keys evenly across shards.
  Each physical shard gets `@vnodes_per_shard` virtual nodes placed on
  a ring via `:erlang.phash2/2`. Adding or removing a shard only
  remaps ~1/N of keys.

  ## Example

      ring = ConsistentHash.new(256)
      ring = ring |> add_node(:shard_0) |> add_node(:shard_1)
      {:ok, :shard_0} = ConsistentHash.get_node(ring, "conversation:abc-123")

  """

  @type node_id :: atom() | String.t()
  @type t :: %__MODULE__{
          vnodes_per_shard: pos_integer(),
          ring: term(),
          nodes: %{optional(node_id()) => true}
        }

  defstruct vnodes_per_shard: 256,
            ring: :gb_trees.empty(),
            nodes: %{}

  @ring_size 4_294_967_296  # 2^32

  @doc """
  Create a new consistent hash ring.

  ## Options
    - `vnodes_per_shard` — number of virtual nodes per physical shard (default 256)
  """
  @spec new(pos_integer()) :: t()
  def new(vnodes_per_shard \\ 256) do
    %__MODULE__{vnodes_per_shard: vnodes_per_shard}
  end

  @doc """
  Add a node (shard) to the ring.

  Places `vnodes_per_shard` virtual nodes around the ring. If the node
  already exists, returns the ring unchanged.
  """
  @spec add_node(t(), node_id()) :: t()
  def add_node(%__MODULE__{nodes: nodes} = ring, node_id) do
    if is_map_key(nodes, node_id) do
      ring
    else
      new_ring =
        Enum.reduce(0..(ring.vnodes_per_shard - 1), ring.ring, fn vnode_idx, acc ->
          hash = hash_key("#{node_id}:vnode:#{vnode_idx}")
          :gb_trees.enter(hash, node_id, acc)
        end)

      %{ring | ring: new_ring, nodes: Map.put(nodes, node_id, true)}
    end
  end

  @doc """
  Remove a node (shard) from the ring.

  Removes all virtual nodes belonging to `node_id`. If the node
  doesn't exist, returns the ring unchanged.
  """
  @spec remove_node(t(), node_id()) :: t()
  def remove_node(%__MODULE__{nodes: nodes} = ring, node_id) do
    if is_map_key(nodes, node_id) do
      new_ring =
        Enum.reduce(0..(ring.vnodes_per_shard - 1), ring.ring, fn vnode_idx, acc ->
          hash = hash_key("#{node_id}:vnode:#{vnode_idx}")

          case :gb_trees.lookup(hash, acc) do
            {:value, ^node_id} -> :gb_trees.delete(hash, acc)
            _ -> acc
          end
        end)

      %{ring | ring: new_ring, nodes: Map.delete(nodes, node_id)}
    else
      ring
    end
  end

  @doc """
  Look up the node responsible for `key`.

  Hashes the key and walks clockwise around the ring to find the
  first virtual node whose position is >= the hash. Wraps around
  if needed.
  """
  @spec get_node(t(), String.t()) :: {:ok, node_id()} | {:error, :empty_ring}
  def get_node(%__MODULE__{} = ch_ring, key) do
    if :gb_trees.is_empty(ch_ring.ring) do
      {:error, :empty_ring}
    else
      ring = ch_ring.ring
      hash = hash_key(key)
      # Find the first node with hash >= key hash (walk clockwise)
      iter = :gb_trees.iterator_from(hash, ring)

      case :gb_trees.next(iter) do
        {_pos, node_id, _iter2} ->
          {:ok, node_id}

        :none ->
          # Wrap around — take the smallest key in the ring
          {_pos, node_id} = :gb_trees.smallest(ring)
          {:ok, node_id}
      end
    end
  end

  @doc """
  Return the N closest nodes for `key` (for replication).

  Returns up to `n` distinct physical nodes in clockwise order.
  """
  @spec get_nodes(t(), String.t(), pos_integer()) :: [node_id()]
  def get_nodes(%__MODULE__{} = ch_ring, key, n) do
    if :gb_trees.is_empty(ch_ring.ring) do
      []
    else
      ring = ch_ring.ring
      total_nodes = map_size(ch_ring.nodes)
      n = min(n, total_nodes)

      hash = hash_key(key)
      iter = :gb_trees.iterator_from(hash, ring)
      collect_unique_nodes(iter, ring, n, %{}, [])
    end
  end

  @doc """
  List all nodes currently in the ring.
  """
  @spec nodes(t()) :: [node_id()]
  def nodes(%__MODULE__{nodes: nodes}), do: Map.keys(nodes)

  @doc """
  Return the number of nodes in the ring.
  """
  @spec size(t()) :: non_neg_integer()
  def size(%__MODULE__{nodes: nodes}), do: map_size(nodes)

  # --- Private ---

  defp hash_key(key) do
    :erlang.phash2(key, @ring_size)
  end

  defp collect_unique_nodes(_iter, _ring, 0, _seen, acc), do: Enum.reverse(acc)

  defp collect_unique_nodes(iter, ring, remaining, seen, acc) do
    case :gb_trees.next(iter) do
      {_pos, node_id, next_iter} ->
        if is_map_key(seen, node_id) do
          collect_unique_nodes(next_iter, ring, remaining, seen, acc)
        else
          collect_unique_nodes(
            next_iter,
            ring,
            remaining - 1,
            Map.put(seen, node_id, true),
            [node_id | acc]
          )
        end

      :none ->
        # Wrap around from the beginning of the ring
        wrap_iter = :gb_trees.iterator(ring)
        collect_unique_nodes_nowrap(wrap_iter, remaining, seen, acc)
    end
  end

  defp collect_unique_nodes_nowrap(_iter, 0, _seen, acc), do: Enum.reverse(acc)

  defp collect_unique_nodes_nowrap(iter, remaining, seen, acc) do
    case :gb_trees.next(iter) do
      {_pos, node_id, next_iter} ->
        if is_map_key(seen, node_id) do
          collect_unique_nodes_nowrap(next_iter, remaining, seen, acc)
        else
          collect_unique_nodes_nowrap(
            next_iter,
            remaining - 1,
            Map.put(seen, node_id, true),
            [node_id | acc]
          )
        end

      :none ->
        # Exhausted the ring
        Enum.reverse(acc)
    end
  end
end
