defmodule CGraph.Accounts.Friends.Management do
  @moduledoc """
  Friend management operations: removing friends, blocking/unblocking users,
  and managing friend nicknames.
  """

  import Ecto.Query

  alias CGraph.Accounts.{DeletedFriendship, Friendship}
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Removes a friend (unfriend).
  Removes both sides of the friendship.
  """
  @spec remove_friend(String.t(), String.t()) :: {:ok, :ok}
  def remove_friend(user_id, friend_id) do
    Repo.transaction(fn ->
      # Record the deletion for sync clients before hard-deleting
      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
      Repo.insert_all(DeletedFriendship, [
        %{id: Ecto.UUID.generate(), user_id: user_id, friend_id: friend_id,
          deleted_at: now, inserted_at: now, updated_at: now},
        %{id: Ecto.UUID.generate(), user_id: friend_id, friend_id: user_id,
          deleted_at: now, inserted_at: now, updated_at: now}
      ])

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
  @spec block_user(String.t(), String.t()) :: {:ok, :ok}
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
  @spec unblock_user(String.t(), String.t()) :: {:ok, Friendship.t()} | {:error, :not_blocked}
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

  @doc """
  Sets a custom nickname for a friend (only visible to you).
  """
  @spec set_friend_nickname(String.t(), String.t(), String.t() | nil) ::
    {:ok, Friendship.t()} | {:error, :not_friends}
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
  @spec remove_friend_nickname(String.t(), String.t()) ::
    {:ok, Friendship.t()} | {:error, :not_friends}
  def remove_friend_nickname(user_id, friend_id) do
    set_friend_nickname(user_id, friend_id, nil)
  end
end
