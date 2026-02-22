defmodule CGraph.Accounts.FriendSystem do
  @moduledoc """
  Friend requests, friendships, blocking, online status, and suggestions.
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.{DeletedFriendship, Friendship, User}
  alias CGraph.Repo

  @doc "List friends with pagination."
  @spec list_friends(User.t(), keyword()) :: {[Friendship.t()], map()}
  def list_friends(user, opts \\ []) do
    status = Keyword.get(opts, :status, "accepted")

    query = from f in Friendship,
      where: (f.user_id == ^user.id or f.friend_id == ^user.id),
      where: f.status == ^status,
      preload: [:user, :friend]

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at, sort_direction: :desc, default_limit: 50
    )

    {friendships, page_info} = CGraph.Pagination.paginate(query, pagination_opts)

    friendships = Enum.map(friendships, fn f ->
      if f.user_id == user.id, do: %{f | friend: f.friend}, else: %{f | friend: f.user}
    end)

    {friendships, page_info}
  end

  @doc "List incoming friend requests."
  @spec list_friend_requests(User.t(), keyword()) :: {[Friendship.t()], map()}
  def list_friend_requests(user, opts \\ []) do
    query = from f in Friendship,
      where: f.friend_id == ^user.id, where: f.status == :pending, preload: [:user]

    CGraph.Pagination.paginate(query,
      CGraph.Pagination.parse_params(Enum.into(opts, %{}),
        sort_field: :inserted_at, sort_direction: :desc, default_limit: 20))
  end

  @doc "List sent friend requests."
  @spec list_sent_friend_requests(User.t(), keyword()) :: {[Friendship.t()], map()}
  def list_sent_friend_requests(user, opts \\ []) do
    query = from f in Friendship,
      where: f.user_id == ^user.id, where: f.status == :pending, preload: [:friend]

    CGraph.Pagination.paginate(query,
      CGraph.Pagination.parse_params(Enum.into(opts, %{}),
        sort_field: :inserted_at, sort_direction: :desc, default_limit: 20))
  end

  @doc "Send a friend request."
  @spec send_friend_request(User.t(), User.t()) :: {:ok, Friendship.t()} | {:error, Ecto.Changeset.t()}
  def send_friend_request(from_user, to_user) do
    %Friendship{}
    |> Friendship.changeset(%{user_id: from_user.id, friend_id: to_user.id, status: "pending"})
    |> Repo.insert()
  end

  @doc "Accept a friend request (by struct or by users)."
  @spec accept_friend_request(Friendship.t()) :: {:ok, Friendship.t()} | {:error, Ecto.Changeset.t()}
  def accept_friend_request(%Friendship{} = friendship) do
    friendship
    |> Ecto.Changeset.change(status: :accepted, accepted_at: DateTime.truncate(DateTime.utc_now(), :second))
    |> Repo.update()
  end

  @spec accept_friend_request(User.t(), User.t()) :: {:ok, Friendship.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def accept_friend_request(addressee, requester) do
    case Repo.one(from f in Friendship,
      where: f.friend_id == ^addressee.id and f.user_id == ^requester.id and f.status == :pending) do
      nil -> {:error, :not_found}
      friendship -> accept_friend_request(friendship)
    end
  end

  @doc "Decline a friend request (by struct or by users)."
  @spec decline_friend_request(Friendship.t()) :: {:ok, Friendship.t()} | {:error, Ecto.Changeset.t()}
  def decline_friend_request(%Friendship{} = friendship), do: Repo.delete(friendship)

  @spec decline_friend_request(User.t(), User.t()) :: {:ok, Friendship.t()} | {:error, :not_found}
  def decline_friend_request(addressee, requester) do
    case Repo.one(from f in Friendship,
      where: f.friend_id == ^addressee.id and f.user_id == ^requester.id and f.status == :pending) do
      nil -> {:error, :not_found}
      friendship -> Repo.delete(friendship)
    end
  end

  @doc "Get a friend request by ID."
  @spec get_friend_request(User.t(), String.t()) :: {:ok, Friendship.t()} | {:error, :not_found}
  def get_friend_request(user, friendship_id) do
    case Repo.one(from f in Friendship,
      where: f.id == ^friendship_id and f.friend_id == ^user.id and f.status == :pending) do
      nil -> {:error, :not_found}
      friendship -> {:ok, friendship}
    end
  end

  @doc "Get a friendship by ID."
  @spec get_friendship(User.t(), String.t()) :: {:ok, Friendship.t()} | {:error, :not_found}
  def get_friendship(user, friendship_id) do
    case Repo.one(from f in Friendship,
      where: f.id == ^friendship_id,
      where: f.user_id == ^user.id or f.friend_id == ^user.id) do
      nil -> {:error, :not_found}
      friendship -> {:ok, friendship}
    end
  end

  @doc "Remove a friendship."
  @spec remove_friendship(User.t(), Friendship.t()) :: {:ok, Friendship.t()} | {:error, Ecto.Changeset.t()}
  def remove_friendship(_user, friendship), do: Repo.delete(friendship)

  @doc "Unfriend a user."
  @spec unfriend(User.t(), User.t()) :: {:ok, Friendship.t()} | {:error, :not_friends}
  def unfriend(user, target_user) do
    case Repo.one(from f in Friendship,
      where: (f.user_id == ^user.id and f.friend_id == ^target_user.id) or
             (f.user_id == ^target_user.id and f.friend_id == ^user.id),
      where: f.status == :accepted) do
      nil -> {:error, :not_friends}
      friendship ->
        # Record the deletion for sync clients before hard-deleting
        now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
        Repo.insert_all(DeletedFriendship, [
          %{id: Ecto.UUID.generate(), user_id: user.id, friend_id: target_user.id,
            deleted_at: now, inserted_at: now, updated_at: now},
          %{id: Ecto.UUID.generate(), user_id: target_user.id, friend_id: user.id,
            deleted_at: now, inserted_at: now, updated_at: now}
        ])
        Repo.delete(friendship)
    end
  end

  @doc "Get friendship status between two users."
  @spec get_friendship_status(User.t(), User.t()) :: :none | :pending | :incoming | :friends
  def get_friendship_status(user, target_user) do
    case Repo.one(from f in Friendship,
      where: (f.user_id == ^user.id and f.friend_id == ^target_user.id) or
             (f.user_id == ^target_user.id and f.friend_id == ^user.id)) do
      nil -> :none
      %{status: :pending, user_id: uid} when uid == user.id -> :pending
      %{status: :pending} -> :incoming
      %{status: :accepted} -> :friends
      _ -> :none
    end
  end

  @doc "Check if a user has blocked another."
  @spec blocked?(User.t(), User.t()) :: boolean()
  def blocked?(blocker, blocked) do
    Repo.exists?(from f in Friendship,
      where: f.user_id == ^blocker.id and f.friend_id == ^blocked.id and f.status == :blocked)
  end

  @doc "Block a user (removes existing friendship first)."
  @spec block_user(User.t(), User.t()) :: {:ok, Friendship.t()} | {:error, Ecto.Changeset.t()}
  def block_user(user, target_user) do
    from(f in Friendship,
      where: (f.user_id == ^user.id and f.friend_id == ^target_user.id) or
             (f.user_id == ^target_user.id and f.friend_id == ^user.id))
    |> Repo.delete_all()

    %Friendship{}
    |> Friendship.changeset(%{user_id: user.id, friend_id: target_user.id, status: :blocked})
    |> Repo.insert()
  end

  @doc "Unblock a user."
  @spec unblock_user(User.t(), User.t()) :: {:ok, Friendship.t()} | {:error, :not_found}
  def unblock_user(user, target_user) do
    case Repo.one(from f in Friendship,
      where: f.user_id == ^user.id and f.friend_id == ^target_user.id and f.status == :blocked) do
      nil -> {:error, :not_found}
      block -> Repo.delete(block)
    end
  end

  @doc "List blocked users."
  @spec list_blocked_users(User.t(), keyword()) :: {[Friendship.t()], map()}
  def list_blocked_users(user, opts \\ []) do
    query = from f in Friendship,
      where: f.user_id == ^user.id and f.status == :blocked, preload: [:friend]

    CGraph.Pagination.paginate(query,
      CGraph.Pagination.parse_params(Enum.into(opts, %{}),
        sort_field: :inserted_at, sort_direction: :desc, default_limit: 50))
  end

  @doc "Get mutual friends between two users."
  @spec get_mutual_friends(User.t(), User.t()) :: [User.t()]
  def get_mutual_friends(user, target_user) do
    mutual_ids = MapSet.intersection(
      MapSet.new(get_friend_ids(user)),
      MapSet.new(get_friend_ids(target_user))
    )
    Repo.all(from u in User, where: u.id in ^MapSet.to_list(mutual_ids))
  end

  @doc "Get online friends."
  @spec get_online_friends(User.t()) :: [map()]
  def get_online_friends(user) do
    friend_ids = get_friend_ids(user)
    statuses = CGraph.Presence.bulk_status(friend_ids)

    online_ids = statuses
      |> Enum.filter(fn {_id, status} -> status != "offline" end)
      |> Enum.map(fn {id, _} -> id end)

    if online_ids == [] do
      []
    else
      Repo.all(from u in User, where: u.id in ^online_ids)
      |> Enum.map(fn u ->
        status = Map.get(statuses, u.id, "offline")
        presence = CGraph.Presence.get_user_presence(u.id)
        status_text = if presence, do: Map.get(presence, :status_message), else: nil
        Map.merge(u, %{status: status, status_text: status_text})
      end)
    end
  end

  @doc "Get friend suggestions (friends of friends)."
  @spec get_friend_suggestions(User.t(), keyword()) :: [map()]
  def get_friend_suggestions(user, opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)
    friend_ids = get_friend_ids(user)

    suggestions = from(f in Friendship,
      where: f.user_id in ^friend_ids and f.status == :accepted,
      where: f.friend_id != ^user.id and f.friend_id not in ^friend_ids,
      group_by: f.friend_id,
      select: %{user_id: f.friend_id, mutual_count: count(f.id)},
      order_by: [desc: count(f.id)], limit: ^limit)
    |> Repo.all()

    users = Repo.all(from u in User, where: u.id in ^Enum.map(suggestions, & &1.user_id))
    |> Map.new(& {&1.id, &1})

    Enum.map(suggestions, fn s ->
      %{user: Map.get(users, s.user_id), reason: "mutual_friends", mutual_friends_count: s.mutual_count}
    end)
  end

  @doc "Notify user of friend request."
  @spec notify_friend_request(Friendship.t()) :: :ok | {:error, term()}
  def notify_friend_request(friendship) do
    with {:ok, recipient} <- CGraph.Accounts.get_user(friendship.friend_id),
         {:ok, sender} <- CGraph.Accounts.get_user(friendship.user_id) do
      CGraph.Notifications.notify_friend_request(recipient, sender)
    end
  end

  @doc "Notify user friend request was accepted."
  @spec notify_friend_accepted(Friendship.t()) :: :ok | {:error, term()}
  def notify_friend_accepted(friendship) do
    with {:ok, requester} <- CGraph.Accounts.get_user(friendship.user_id),
         {:ok, accepter} <- CGraph.Accounts.get_user(friendship.friend_id) do
      CGraph.Notifications.notify_friend_accepted(requester, accepter)
    end
  end

  # Get all accepted friend IDs for a user (single query with UNION)
  @spec get_friend_ids(User.t()) :: [String.t()]
  def get_friend_ids(user) do
    sent_query = from(f in Friendship, where: f.user_id == ^user.id and f.status == :accepted, select: f.friend_id)
    received_query = from(f in Friendship, where: f.friend_id == ^user.id and f.status == :accepted, select: f.user_id)
    Repo.all(union_all(sent_query, ^received_query))
  end
end
