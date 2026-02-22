defmodule CGraph.Groups.Sync do
  @moduledoc """
  WatermelonDB-compatible sync queries for Groups.

  Provides delta-sync functions that return records updated or deleted
  since a given millisecond Unix timestamp, enabling efficient
  client-server synchronisation for offline-first mobile clients.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.{Channel, Group, Member}
  alias CGraph.Repo

  @doc """
  List groups the user is a member of, updated since the given timestamp.

  `since` is a millisecond Unix timestamp or nil for full sync.
  """
  @spec list_user_groups_since(struct(), integer() | nil) :: [struct()]
  def list_user_groups_since(user, since) do
    user_id = user.id

    query =
      from g in Group,
        join: m in Member, on: m.group_id == g.id,
        where: m.user_id == ^user_id and is_nil(g.deleted_at) and m.is_banned == false,
        select: g

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from g in query, where: g.updated_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  List IDs of groups the user has left or been removed from since the given timestamp.

  Uses group `deleted_at` and membership timestamps.
  """
  @spec list_left_group_ids_since(struct(), integer() | nil) :: [binary()]
  def list_left_group_ids_since(user, since) do
    user_id = user.id

    deleted_query =
      from g in Group,
        join: m in Member, on: m.group_id == g.id,
        where: m.user_id == ^user_id and not is_nil(g.deleted_at),
        select: g.id

    deleted_query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from g in deleted_query, where: g.deleted_at > ^dt
      else
        deleted_query
      end

    Repo.all(deleted_query)
  end

  @doc """
  List channels in user's groups, updated since the given timestamp.
  """
  @spec list_user_channels_since(struct(), integer() | nil) :: [struct()]
  def list_user_channels_since(user, since) do
    user_id = user.id

    query =
      from ch in Channel,
        join: m in Member, on: m.group_id == ch.group_id,
        where: m.user_id == ^user_id and is_nil(ch.deleted_at) and m.is_banned == false,
        select: ch

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from ch in query, where: ch.updated_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  List IDs of channels that were deleted since the given timestamp.
  """
  @spec list_deleted_channel_ids_since(struct(), integer() | nil) :: [binary()]
  def list_deleted_channel_ids_since(user, since) do
    user_id = user.id

    query =
      from ch in Channel,
        join: m in Member, on: m.group_id == ch.group_id,
        where: m.user_id == ^user_id and not is_nil(ch.deleted_at),
        select: ch.id

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from ch in query, where: ch.deleted_at > ^dt
      else
        query
      end

    Repo.all(query)
  end
end
