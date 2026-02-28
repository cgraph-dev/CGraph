defmodule CGraph.Accounts.Friends.Queries do
  @moduledoc """
  Friend list queries, relationship checks, suggestions, and statistics.
  """

  import Ecto.Query

  alias CGraph.Accounts.{Friendship, User}
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Friend Lists
  # ---------------------------------------------------------------------------

  @doc """
  Gets the list of friends for a user.
  """
  @spec list_friends(String.t(), keyword()) :: [map()]
  def list_friends(user_id, opts \\ []) do
    query =
      from f in Friendship,
        where: f.user_id == ^user_id,
        where: f.status == :accepted,
        join: u in User, on: u.id == f.friend_id,
        select: %{
          id: f.id,
          friend_id: f.friend_id,
          nickname: f.nickname,
          user: %{
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            status: u.status,
            last_seen_at: u.last_seen_at
          }
        }

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :id,
      sort_direction: :desc,
      default_limit: 50
    )

    {friends, _page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    friends
  end

  @doc """
  Gets list of accepted friend IDs for a user.

  Used for real-time notifications and presence tracking.
  Returns only the IDs for efficient batch operations like
  broadcasting E2EE key revocations to all contacts.
  """
  @spec get_accepted_friend_ids(String.t()) :: [String.t()]
  def get_accepted_friend_ids(user_id) do
    from(f in Friendship,
      where: f.user_id == ^user_id,
      where: f.status == :accepted,
      select: f.friend_id
    )
    |> Repo.all()
  end

  @doc """
  Gets pending friend requests (incoming).
  """
  @spec list_incoming_requests(String.t()) :: [map()]
  def list_incoming_requests(user_id) do
    from(f in Friendship,
      where: f.friend_id == ^user_id,
      where: f.status == :pending,
      join: u in User, on: u.id == f.user_id,
      order_by: [desc: f.inserted_at],
      select: %{
        id: f.id,
        from_user_id: f.user_id,
        sent_at: f.inserted_at,
        user: %{
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url
        }
      }
    )
    |> Repo.all()
  end

  @doc """
  Gets pending friend requests (outgoing).
  """
  @spec list_outgoing_requests(String.t()) :: [map()]
  def list_outgoing_requests(user_id) do
    from(f in Friendship,
      where: f.user_id == ^user_id,
      where: f.status == :pending,
      join: u in User, on: u.id == f.friend_id,
      order_by: [desc: f.inserted_at],
      select: %{
        id: f.id,
        to_user_id: f.friend_id,
        sent_at: f.inserted_at,
        user: %{
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url
        }
      }
    )
    |> Repo.all()
  end

  @doc """
  Gets list of blocked users.
  """
  @spec list_blocked_users(String.t()) :: [map()]
  def list_blocked_users(user_id) do
    from(f in Friendship,
      where: f.user_id == ^user_id,
      where: f.status == :blocked,
      join: u in User, on: u.id == f.friend_id,
      select: %{
        id: f.id,
        blocked_id: f.friend_id,
        blocked_at: f.inserted_at,
        user: %{
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url
        }
      }
    )
    |> Repo.all()
  end

  # ---------------------------------------------------------------------------
  # Relationship Checks
  # ---------------------------------------------------------------------------

  @doc """
  Checks if two users are friends.
  """
  @spec are_friends?(String.t(), String.t()) :: boolean()
  def are_friends?(user_id, other_id) do
    Repo.exists?(
      from f in Friendship,
        where: f.user_id == ^user_id,
        where: f.friend_id == ^other_id,
        where: f.status == :accepted
    )
  end

  @doc """
  Checks if a user has blocked another user.
  """
  @spec blocked?(String.t(), String.t()) :: boolean()
  def blocked?(blocker_id, blocked_id) do
    Repo.exists?(
      from f in Friendship,
        where: f.user_id == ^blocker_id,
        where: f.friend_id == ^blocked_id,
        where: f.status == :blocked
    )
  end

  @doc """
  Check if either user has blocked the other (bidirectional).
  Returns true if A blocked B OR B blocked A.
  """
  @spec mutually_blocked?(String.t(), String.t()) :: boolean()
  def mutually_blocked?(user_a_id, user_b_id) do
    blocked?(user_a_id, user_b_id) || blocked?(user_b_id, user_a_id)
  end

  @doc """
  Get all user IDs that are blocked by OR have blocked the given user.
  Returns a flat list of user IDs involved in any block relationship with the given user.
  """
  @spec get_blocked_user_ids(String.t()) :: [String.t()]
  def get_blocked_user_ids(user_id) do
    from(f in Friendship,
      where: (f.user_id == ^user_id or f.friend_id == ^user_id) and f.status == :blocked,
      select:
        fragment(
          "CASE WHEN ? = ? THEN ? ELSE ? END",
          f.user_id,
          type(^user_id, Ecto.UUID),
          f.friend_id,
          f.user_id
        )
    )
    |> Repo.all()
  end

  @doc """
  Gets the relationship between two users.
  """
  @spec get_relationship(String.t(), String.t()) :: Friendship.t() | nil
  def get_relationship(user_id, other_id) do
    Repo.one(
      from f in Friendship,
        where: f.user_id == ^user_id and f.friend_id == ^other_id,
        or_where: f.user_id == ^other_id and f.friend_id == ^user_id
    )
  end

  # ---------------------------------------------------------------------------
  # Mutual Friends & Suggestions
  # ---------------------------------------------------------------------------

  @doc """
  Gets mutual friends between two users.
  """
  @spec get_mutual_friends(String.t(), String.t()) :: [map()]
  def get_mutual_friends(user_id, other_id) do
    user_friends = get_friend_ids(user_id)
    other_friends = get_friend_ids(other_id)

    mutual_ids = MapSet.intersection(
      MapSet.new(user_friends),
      MapSet.new(other_friends)
    )

    from(u in User,
      where: u.id in ^MapSet.to_list(mutual_ids),
      select: %{
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url
      }
    )
    |> Repo.all()
  end

  @doc """
  Gets friend suggestions based on mutual friends.
  """
  @spec get_friend_suggestions(String.t(), pos_integer()) :: [map()]
  def get_friend_suggestions(user_id, limit \\ 10) do
    # Get user's current friends
    friend_ids = get_friend_ids(user_id)

    # Get friends of friends, excluding already-friends and self
    friends_of_friends =
      from(f in Friendship,
        where: f.user_id in ^friend_ids,
        where: f.status == :accepted,
        where: f.friend_id != ^user_id,
        where: f.friend_id not in ^friend_ids,
        group_by: f.friend_id,
        select: %{
          user_id: f.friend_id,
          mutual_count: count(f.id)
        },
        order_by: [desc: count(f.id)],
        limit: ^limit
      )
      |> Repo.all()

    # Get user details
    suggestion_ids = Enum.map(friends_of_friends, & &1.user_id)
    mutual_counts = Map.new(friends_of_friends, &{&1.user_id, &1.mutual_count})

    from(u in User,
      where: u.id in ^suggestion_ids,
      select: %{
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url
      }
    )
    |> Repo.all()
    |> Enum.map(fn user ->
      Map.put(user, :mutual_friends_count, Map.get(mutual_counts, user.id, 0))
    end)
    |> Enum.sort_by(& &1.mutual_friends_count, :desc)
  end

  # ---------------------------------------------------------------------------
  # Statistics
  # ---------------------------------------------------------------------------

  @doc """
  Gets friend counts for a user.
  """
  @spec get_friend_stats(String.t()) :: map()
  def get_friend_stats(user_id) do
    friends_count =
      Repo.one(
        from f in Friendship,
          where: f.user_id == ^user_id and f.status == :accepted,
          select: count(f.id)
      )

    incoming_requests =
      Repo.one(
        from f in Friendship,
          where: f.friend_id == ^user_id and f.status == :pending,
          select: count(f.id)
      )

    outgoing_requests =
      Repo.one(
        from f in Friendship,
          where: f.user_id == ^user_id and f.status == :pending,
          select: count(f.id)
      )

    blocked_count =
      Repo.one(
        from f in Friendship,
          where: f.user_id == ^user_id and f.status == :blocked,
          select: count(f.id)
      )

    %{
      friends: friends_count,
      incoming_requests: incoming_requests,
      outgoing_requests: outgoing_requests,
      blocked: blocked_count
    }
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp get_friend_ids(user_id) do
    from(f in Friendship,
      where: f.user_id == ^user_id,
      where: f.status == :accepted,
      select: f.friend_id
    )
    |> Repo.all()
  end
end
