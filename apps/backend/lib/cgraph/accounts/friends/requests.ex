defmodule CGraph.Accounts.Friends.Requests do
  @moduledoc """
  Friend request operations: sending, accepting, declining, and cancelling.
  """

  import Ecto.Query

  alias CGraph.Accounts.Friendship
  alias CGraph.Accounts.Friends.Queries
  alias CGraph.Notifications
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc "Sends a friend request from one user to another."
  @spec send_friend_request(String.t(), String.t(), String.t() | nil) ::
    {:ok, Friendship.t()} | {:error, atom() | Ecto.Changeset.t()}
  def send_friend_request(from_user_id, to_user_id, message \\ nil) do
    # Check if there's an existing relationship
    case Queries.get_relationship(from_user_id, to_user_id) do
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

  @doc "Accepts a pending friend request. Uses upsert for race condition safety."
  @spec accept_friend_request(String.t(), String.t()) ::
    {:ok, :ok} | {:error, :request_not_found}
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

          # Create the reverse relationship with conflict handling
          # Uses on_conflict: :nothing to handle race conditions gracefully
          %Friendship{}
          |> Friendship.changeset(%{
            user_id: accepting_user_id,
            friend_id: requesting_user_id,
            status: :accepted
          })
          |> Repo.insert(on_conflict: :nothing, conflict_target: [:user_id, :friend_id])

          # Notify the requester
          Notifications.notify_friend_accepted(requesting_user_id, accepting_user_id)

          :ok
        end)
    end
  end

  @doc """
  Declines/rejects a pending friend request.
  """
  @spec decline_friend_request(String.t(), String.t()) ::
    {:ok, Friendship.t()} | {:error, :request_not_found}
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

  @doc "Cancels a sent friend request."
  @spec cancel_friend_request(String.t(), String.t()) ::
    {:ok, Friendship.t()} | {:error, :request_not_found}
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

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

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
end
