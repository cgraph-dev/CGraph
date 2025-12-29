defmodule Cgraph.Accounts.Friends do
  @moduledoc """
  Context module for managing friendships.

  Handles friend requests, acceptances, blocks, and friend list queries.
  """

  import Ecto.Query
  alias Cgraph.Repo
  alias Cgraph.Accounts.{User, Friendship}
  alias Cgraph.Notifications

  # =============================================================================
  # Friend Requests
  # =============================================================================

  @doc """
  Sends a friend request from one user to another.

  Returns `{:ok, friendship}` on success, or `{:error, reason}` on failure.
  """
  def send_friend_request(from_user_id, to_user_id, message \\ nil) do
    # Check if there's an existing relationship
    case get_relationship(from_user_id, to_user_id) do
      nil ->
        # No relationship exists, create pending request
        create_friendship(from_user_id, to_user_id, message)

      %Friendship{status: :pending, user_id: ^to_user_id} ->
        # They already sent us a request, auto-accept
        accept_friend_request(from_user_id, to_user_id)

      %Friendship{status: :pending} ->
        {:error, :request_already_sent}

      %Friendship{status: :accepted} ->
        {:error, :already_friends}

      %Friendship{status: :blocked, user_id: ^to_user_id} ->
        {:error, :blocked_by_user}

      %Friendship{status: :blocked} ->
        {:error, :user_blocked}
    end
  end

  defp create_friendship(from_user_id, to_user_id, _message) do
    %Friendship{}
    |> Friendship.changeset(%{
      user_id: from_user_id,
      friend_id: to_user_id,
      status: :pending
    })
    |> Repo.insert()
    |> case do
      {:ok, friendship} ->
        # Send notification
        Notifications.notify_friend_request(to_user_id, from_user_id)
        {:ok, friendship}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  Accepts a pending friend request.
  """
  def accept_friend_request(accepting_user_id, requesting_user_id) do
    # Find the pending request where they sent to us
    query =
      from f in Friendship,
        where: f.user_id == ^requesting_user_id,
        where: f.friend_id == ^accepting_user_id,
        where: f.status == :pending

    case Repo.one(query) do
      nil ->
        {:error, :request_not_found}

      friendship ->
        Repo.transaction(fn ->
          # Update the existing request to accepted
          friendship
          |> Ecto.Changeset.change(status: :accepted)
          |> Repo.update!()

          # Create the reverse relationship (for easy querying)
          %Friendship{}
          |> Friendship.changeset(%{
            user_id: accepting_user_id,
            friend_id: requesting_user_id,
            status: :accepted
          })
          |> Repo.insert!()

          # Notify the requester
          Notifications.notify_friend_accepted(requesting_user_id, accepting_user_id)

          :ok
        end)
    end
  end

  @doc """
  Declines/rejects a pending friend request.
  """
  def decline_friend_request(declining_user_id, requesting_user_id) do
    query =
      from f in Friendship,
        where: f.user_id == ^requesting_user_id,
        where: f.friend_id == ^declining_user_id,
        where: f.status == :pending

    case Repo.one(query) do
      nil ->
        {:error, :request_not_found}

      friendship ->
        Repo.delete(friendship)
    end
  end

  @doc """
  Cancels a sent friend request.
  """
  def cancel_friend_request(from_user_id, to_user_id) do
    query =
      from f in Friendship,
        where: f.user_id == ^from_user_id,
        where: f.friend_id == ^to_user_id,
        where: f.status == :pending

    case Repo.one(query) do
      nil ->
        {:error, :request_not_found}

      friendship ->
        Repo.delete(friendship)
    end
  end

  # =============================================================================
  # Friend Management
  # =============================================================================

  @doc """
  Removes a friend (unfriend).
  Removes both sides of the friendship.
  """
  def remove_friend(user_id, friend_id) do
    Repo.transaction(fn ->
      # Delete both directions
      from(f in Friendship,
        where: f.user_id == ^user_id and f.friend_id == ^friend_id,
        or_where: f.user_id == ^friend_id and f.friend_id == ^user_id
      )
      |> Repo.delete_all()

      :ok
    end)
  end

  @doc """
  Blocks a user.
  Also removes any existing friendship.
  """
  def block_user(blocker_id, blocked_id) do
    Repo.transaction(fn ->
      # Remove existing friendships
      from(f in Friendship,
        where: f.user_id == ^blocker_id and f.friend_id == ^blocked_id,
        or_where: f.user_id == ^blocked_id and f.friend_id == ^blocker_id
      )
      |> Repo.delete_all()

      # Create block record
      %Friendship{}
      |> Friendship.changeset(%{
        user_id: blocker_id,
        friend_id: blocked_id,
        status: :blocked
      })
      |> Repo.insert!()

      :ok
    end)
  end

  @doc """
  Unblocks a user.
  """
  def unblock_user(blocker_id, blocked_id) do
    query =
      from f in Friendship,
        where: f.user_id == ^blocker_id,
        where: f.friend_id == ^blocked_id,
        where: f.status == :blocked

    case Repo.one(query) do
      nil -> {:error, :not_blocked}
      friendship -> Repo.delete(friendship)
    end
  end

  # =============================================================================
  # Queries
  # =============================================================================

  @doc """
  Gets the list of friends for a user.
  """
  def list_friends(user_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)

    query =
      from f in Friendship,
        where: f.user_id == ^user_id,
        where: f.status == :accepted,
        join: u in User, on: u.id == f.friend_id,
        order_by: [asc: u.display_name],
        limit: ^limit,
        offset: ^offset,
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

    Repo.all(query)
  end

  @doc """
  Gets pending friend requests (incoming).
  """
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

  @doc """
  Checks if two users are friends.
  """
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
  def is_blocked?(blocker_id, blocked_id) do
    Repo.exists?(
      from f in Friendship,
        where: f.user_id == ^blocker_id,
        where: f.friend_id == ^blocked_id,
        where: f.status == :blocked
    )
  end

  @doc """
  Gets the relationship between two users.
  """
  def get_relationship(user_id, other_id) do
    Repo.one(
      from f in Friendship,
        where: f.user_id == ^user_id and f.friend_id == ^other_id,
        or_where: f.user_id == ^other_id and f.friend_id == ^user_id
    )
  end

  @doc """
  Gets mutual friends between two users.
  """
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

  defp get_friend_ids(user_id) do
    from(f in Friendship,
      where: f.user_id == ^user_id,
      where: f.status == :accepted,
      select: f.friend_id
    )
    |> Repo.all()
  end

  @doc """
  Gets friend suggestions based on mutual friends.
  """
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

  # =============================================================================
  # Nickname Management
  # =============================================================================

  @doc """
  Sets a custom nickname for a friend (only visible to you).
  """
  def set_friend_nickname(user_id, friend_id, nickname) do
    query =
      from f in Friendship,
        where: f.user_id == ^user_id,
        where: f.friend_id == ^friend_id,
        where: f.status == :accepted

    case Repo.one(query) do
      nil ->
        {:error, :not_friends}

      friendship ->
        friendship
        |> Ecto.Changeset.change(nickname: nickname)
        |> Repo.update()
    end
  end

  @doc """
  Removes custom nickname for a friend.
  """
  def remove_friend_nickname(user_id, friend_id) do
    set_friend_nickname(user_id, friend_id, nil)
  end

  # =============================================================================
  # Stats
  # =============================================================================

  @doc """
  Gets friend counts for a user.
  """
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
end
