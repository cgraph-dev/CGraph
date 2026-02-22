defmodule CGraph.Messaging.ReactionActions do
  @moduledoc """
  Inline reaction operations and real-time broadcasts.

  Provides add/remove for message reactions and WebSocket broadcasts
  for reaction events. Listing and user queries are handled by
  `CGraph.Messaging.Reactions`.

  Extracted from `CGraph.Messaging` for maintainability.
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.Reaction
  alias CGraph.Repo

  @doc """
  Add a reaction to a message.

  Returns `{:ok, reaction, nil}` (3-element tuple for callers that
  expect the extra element).
  """
  @spec add_reaction(struct(), struct(), String.t()) ::
          {:ok, struct(), nil} | {:error, :already_exists} | {:error, Ecto.Changeset.t()}
  def add_reaction(user, message, emoji) do
    existing_same =
      Repo.get_by(Reaction,
        user_id: user.id,
        message_id: message.id,
        emoji: emoji
      )

    if existing_same do
      {:error, :already_exists}
    else
      case %Reaction{}
           |> Reaction.changeset(%{user_id: user.id, message_id: message.id, emoji: emoji})
           |> Repo.insert() do
        {:ok, reaction} -> {:ok, reaction, nil}
        {:error, changeset} -> {:error, changeset}
      end
    end
  end

  @doc "Remove a reaction from a message."
  @spec remove_reaction(struct(), struct(), String.t()) :: {:ok, struct()} | {:error, :not_found}
  def remove_reaction(user, message, emoji) do
    query =
      from r in Reaction,
        where: r.user_id == ^user.id,
        where: r.message_id == ^message.id,
        where: r.emoji == ^emoji

    case Repo.one(query) do
      nil -> {:error, :not_found}
      reaction -> Repo.delete(reaction)
    end
  end

  @doc "Broadcast a reaction-added event over the conversation channel."
  @spec broadcast_reaction_added(struct(), struct(), struct(), struct() | nil) :: :ok
  def broadcast_reaction_added(conversation, message, reaction, user \\ nil) do
    user_data = user || reaction.user

    CGraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "reaction_added",
      %{
        message_id: message.id,
        emoji: reaction.emoji,
        user_id: reaction.user_id,
        user:
          if(user_data,
            do: %{
              id: user_data.id,
              username: user_data.username,
              display_name: user_data.display_name,
              avatar_url: user_data.avatar_url
            },
            else: %{id: reaction.user_id}
          )
      }
    )
  end

  @doc "Broadcast a reaction-removed event over the conversation channel."
  @spec broadcast_reaction_removed(struct(), struct(), struct(), String.t()) :: :ok
  def broadcast_reaction_removed(conversation, message, user, emoji) do
    CGraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "reaction_removed",
      %{message_id: message.id, user_id: user.id, emoji: emoji}
    )
  end
end
