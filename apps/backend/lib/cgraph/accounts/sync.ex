defmodule CGraph.Accounts.Sync do
  @moduledoc """
  WatermelonDB sync query functions for the Accounts context.

  Provides incremental-sync queries that return records updated since a given
  millisecond Unix timestamp, supporting the WatermelonDB pull protocol.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.{DeletedFriendship, Friendship, User}
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Contacts Sync
  # ---------------------------------------------------------------------------

  @doc """
  List contacts (users) the current user has interacted with, updated since timestamp.
  Returns users who are in accepted friendships with the given user.
  `since` is a millisecond Unix timestamp or nil for full sync.
  """
  @spec list_contacts_since(struct(), integer() | nil) :: [struct()]
  def list_contacts_since(user, since) do
    user_id = user.id

    query =
      from u in User,
        join: f in Friendship,
          on:
            (f.user_id == ^user_id and f.friend_id == u.id) or
              (f.friend_id == ^user_id and f.user_id == u.id),
        where: f.status == :accepted,
        select: u

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from u in query, where: u.updated_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  # ---------------------------------------------------------------------------
  # Friendships Sync
  # ---------------------------------------------------------------------------

  @doc """
  List friendships for the user, updated since the given timestamp.
  """
  @spec list_friendships_since(struct(), integer() | nil) :: [struct()]
  def list_friendships_since(user, since) do
    user_id = user.id

    query =
      from f in Friendship,
        where: (f.user_id == ^user_id or f.friend_id == ^user_id) and f.status == :accepted,
        select: f

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from f in query, where: f.updated_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  # ---------------------------------------------------------------------------
  # Removed Friendships Sync
  # ---------------------------------------------------------------------------

  @doc """
  List IDs of friendships that were removed (blocked/unfriended) since the given timestamp.
  Combines blocked friendships with the deleted_friendships audit table.
  """
  @spec list_removed_friendship_ids_since(struct(), integer() | nil) :: [binary()]
  def list_removed_friendship_ids_since(user, since) do
    user_id = user.id

    # Blocked friendships (still in the friendships table with status :blocked)
    blocked_query =
      from f in Friendship,
        where: (f.user_id == ^user_id or f.friend_id == ^user_id) and f.status == :blocked,
        select: f.id

    blocked_query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from f in blocked_query, where: f.updated_at > ^dt
      else
        blocked_query
      end

    # Unfriended records (hard-deleted from friendships, audited in deleted_friendships)
    deleted_query =
      from df in DeletedFriendship,
        where: df.user_id == ^user_id or df.friend_id == ^user_id,
        select: df.id

    deleted_query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from df in deleted_query, where: df.deleted_at > ^dt
      else
        deleted_query
      end

    blocked_ids = Repo.all(blocked_query)
    deleted_ids = Repo.all(deleted_query)

    Enum.uniq(blocked_ids ++ deleted_ids)
  end
end
