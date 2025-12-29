defmodule CgraphWeb.API.V1.FriendJSON do
  @moduledoc """
  JSON rendering for friend responses.
  """

  alias CgraphWeb.API.V1.UserJSON

  def index(%{friends: friends, meta: meta}) do
    %{
      data: Enum.map(friends, &friend_data/1),
      meta: meta
    }
  end

  def requests(%{requests: requests, meta: meta}) do
    %{
      data: Enum.map(requests, &request_data/1),
      meta: meta
    }
  end

  def sent(%{requests: requests, meta: meta}) do
    %{
      data: Enum.map(requests, &sent_request_data/1),
      meta: meta
    }
  end

  def show(%{friendship: friendship}) do
    %{data: friendship_data(friendship)}
  end

  def block(%{block: block}) do
    %{
      data: %{
        id: block.id,
        blocked_user_id: block.friend_id,
        created_at: block.inserted_at
      }
    }
  end

  def blocked(%{users: users, meta: meta}) do
    %{
      data: Enum.map(users, fn block ->
        %{
          id: block.id,
          user: UserJSON.user_data(block.blocked_user),
          blocked_at: block.inserted_at
        }
      end),
      meta: meta
    }
  end

  def mutual(%{friends: friends}) do
    %{
      data: %{
        count: length(friends),
        users: Enum.map(friends, &UserJSON.user_data/1)
      }
    }
  end

  def online(%{friends: friends}) do
    %{
      data: Enum.map(friends, fn friend ->
        UserJSON.user_data(friend)
        |> Map.put(:status, friend.status)
        |> Map.put(:status_text, friend.status_text)
      end)
    }
  end

  def suggestions(%{suggestions: suggestions}) do
    %{
      data: Enum.map(suggestions, fn suggestion ->
        %{
          user: UserJSON.user_data(suggestion.user),
          reason: suggestion.reason,
          mutual_friends_count: Map.get(suggestion, :mutual_friends_count, 0),
          mutual_groups_count: Map.get(suggestion, :mutual_groups_count, 0)
        }
      end)
    }
  end

  @doc """
  Render friend data (accepted friendship).
  """
  def friend_data(friendship) do
    # The friend is the other user in the friendship
    friend = friendship.friend || friendship.user
    
    %{
      id: friendship.id,
      user: UserJSON.user_data(friend),
      nickname: Map.get(friendship, :nickname),
      since: friendship.accepted_at || friendship.inserted_at
    }
  end

  @doc """
  Render incoming friend request.
  """
  def request_data(friendship) do
    %{
      id: friendship.id,
      from: UserJSON.user_data(friendship.user),
      mutual_friends_count: Map.get(friendship, :mutual_friends_count, 0),
      sent_at: friendship.inserted_at
    }
  end

  @doc """
  Render outgoing friend request.
  """
  def sent_request_data(friendship) do
    %{
      id: friendship.id,
      to: UserJSON.user_data(friendship.friend),
      sent_at: friendship.inserted_at
    }
  end

  @doc """
  Render friendship data.
  """
  def friendship_data(friendship) do
    %{
      id: friendship.id,
      user_id: friendship.user_id,
      friend_id: friendship.friend_id,
      status: friendship.status,
      created_at: friendship.inserted_at,
      accepted_at: friendship.accepted_at
    }
  end
end
