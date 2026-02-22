defmodule CGraph.Accounts.Friends do
  @moduledoc """
  Context module for managing friendships.

  Handles friend requests, acceptances, blocks, and friend list queries.

  Delegates to submodules:

  - `CGraph.Accounts.Friends.Requests` — send, accept, decline, cancel requests
  - `CGraph.Accounts.Friends.Queries` — lists, checks, suggestions, stats
  - `CGraph.Accounts.Friends.Management` — remove, block/unblock, nicknames
  """

  alias CGraph.Accounts.Friends.{Requests, Queries, Management}

  # ---------------------------------------------------------------------------
  # Requests (wrapper functions for default args)
  # ---------------------------------------------------------------------------

  @doc "Sends a friend request from one user to another."
  @spec send_friend_request(binary(), binary(), String.t() | nil) :: {:ok, struct()} | {:error, term()}
  def send_friend_request(from_user_id, to_user_id, message \\ nil),
    do: Requests.send_friend_request(from_user_id, to_user_id, message)

  @doc "Accepts a pending friend request. Uses upsert for race condition safety."
  defdelegate accept_friend_request(accepting_user_id, requesting_user_id), to: Requests

  @doc "Declines/rejects a pending friend request."
  defdelegate decline_friend_request(declining_user_id, requesting_user_id), to: Requests

  @doc "Cancels a sent friend request."
  defdelegate cancel_friend_request(from_user_id, to_user_id), to: Requests

  # ---------------------------------------------------------------------------
  # Queries
  # ---------------------------------------------------------------------------

  @doc "Gets the list of friends for a user."
  @spec list_friends(binary(), keyword()) :: {list(), map()} | list()
  def list_friends(user_id, opts \\ []), do: Queries.list_friends(user_id, opts)

  @doc "Gets list of accepted friend IDs for a user."
  defdelegate get_accepted_friend_ids(user_id), to: Queries

  @doc "Gets pending friend requests (incoming)."
  defdelegate list_incoming_requests(user_id), to: Queries

  @doc "Gets pending friend requests (outgoing)."
  defdelegate list_outgoing_requests(user_id), to: Queries

  @doc "Gets list of blocked users."
  defdelegate list_blocked_users(user_id), to: Queries

  @doc "Checks if two users are friends."
  defdelegate are_friends?(user_id, other_id), to: Queries

  @doc "Checks if a user has blocked another user."
  defdelegate blocked?(blocker_id, blocked_id), to: Queries

  @doc "Gets the relationship between two users."
  defdelegate get_relationship(user_id, other_id), to: Queries

  @doc "Gets mutual friends between two users."
  defdelegate get_mutual_friends(user_id, other_id), to: Queries

  @doc "Gets friend suggestions based on mutual friends."
  @spec get_friend_suggestions(binary(), pos_integer()) :: list()
  def get_friend_suggestions(user_id, limit \\ 10),
    do: Queries.get_friend_suggestions(user_id, limit)

  @doc "Gets friend counts for a user."
  defdelegate get_friend_stats(user_id), to: Queries

  # ---------------------------------------------------------------------------
  # Management
  # ---------------------------------------------------------------------------

  @doc "Removes a friend (unfriend). Removes both sides of the friendship."
  defdelegate remove_friend(user_id, friend_id), to: Management

  @doc "Blocks a user. Also removes any existing friendship."
  defdelegate block_user(blocker_id, blocked_id), to: Management

  @doc "Unblocks a user."
  defdelegate unblock_user(blocker_id, blocked_id), to: Management

  @doc "Sets a custom nickname for a friend (only visible to you)."
  defdelegate set_friend_nickname(user_id, friend_id, nickname), to: Management

  @doc "Removes custom nickname for a friend."
  defdelegate remove_friend_nickname(user_id, friend_id), to: Management
end
