defmodule Cgraph.Messaging.Reactions do
  @moduledoc """
  Sub-context for Reaction-related operations.
  
  Handles adding, removing, and listing reactions on messages.
  Extracted from the main Messaging context for better maintainability.
  
  @since v0.7.29
  """

  import Ecto.Query, warn: false

  alias Cgraph.Messaging.{Message, Reaction}
  alias Cgraph.Repo

  @doc """
  List reactions on a message.
  
  ## Options
    - `:emoji` - Filter by specific emoji
  """
  @spec list_reactions(Message.t(), keyword()) :: list(Reaction.t())
  def list_reactions(message, opts \\ []) do
    emoji_filter = Keyword.get(opts, :emoji)

    query = from r in Reaction,
      where: r.message_id == ^message.id,
      preload: [:user]

    query = if emoji_filter do
      from r in query, where: r.emoji == ^emoji_filter
    else
      query
    end

    Repo.all(query)
  end

  @doc """
  Add a reaction to a message.
  If the user already has this reaction, returns existing.
  """
  @spec add_reaction(map(), Message.t(), String.t()) :: {:ok, Reaction.t()} | {:error, term()}
  def add_reaction(user, message, emoji) do
    case get_existing_reaction(user, message, emoji) do
      nil ->
        %Reaction{}
        |> Reaction.changeset(%{
          user_id: user.id,
          message_id: message.id,
          emoji: emoji
        })
        |> Repo.insert()

      existing ->
        {:ok, existing}
    end
  end

  @doc """
  Remove a reaction from a message.
  """
  @spec remove_reaction(map(), Message.t(), String.t()) :: :ok | {:error, :not_found}
  def remove_reaction(user, message, emoji) do
    case get_existing_reaction(user, message, emoji) do
      nil ->
        {:error, :not_found}

      reaction ->
        Repo.delete(reaction)
        :ok
    end
  end

  @doc """
  Toggle a reaction - adds if not present, removes if present.
  """
  @spec toggle_reaction(map(), Message.t(), String.t()) :: {:ok, :added | :removed, Reaction.t() | nil}
  def toggle_reaction(user, message, emoji) do
    case get_existing_reaction(user, message, emoji) do
      nil ->
        {:ok, reaction} = add_reaction(user, message, emoji)
        {:ok, :added, reaction}

      existing ->
        Repo.delete(existing)
        {:ok, :removed, nil}
    end
  end

  @doc """
  Get aggregated reactions for a message.
  Returns a list of `{emoji, count, users}` tuples.
  """
  @spec get_aggregated_reactions(Message.t()) :: list(map())
  def get_aggregated_reactions(message) do
    reactions = list_reactions(message)

    reactions
    |> Enum.group_by(& &1.emoji)
    |> Enum.map(fn {emoji, reaction_list} ->
      %{
        emoji: emoji,
        count: length(reaction_list),
        users: Enum.map(reaction_list, & &1.user)
      }
    end)
    |> Enum.sort_by(& &1.count, :desc)
  end

  @doc """
  Check if user has reacted with a specific emoji.
  """
  @spec has_reacted?(map(), Message.t(), String.t()) :: boolean()
  def has_reacted?(user, message, emoji) do
    get_existing_reaction(user, message, emoji) != nil
  end

  @doc """
  Get users who reacted with a specific emoji.
  """
  @spec get_reaction_users(Message.t(), String.t(), keyword()) :: list(map())
  def get_reaction_users(message, emoji, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)

    from(r in Reaction,
      where: r.message_id == ^message.id,
      where: r.emoji == ^emoji,
      join: u in assoc(r, :user),
      select: u,
      limit: ^limit
    )
    |> Repo.all()
  end

  # Private helpers

  defp get_existing_reaction(user, message, emoji) do
    from(r in Reaction,
      where: r.user_id == ^user.id,
      where: r.message_id == ^message.id,
      where: r.emoji == ^emoji
    )
    |> Repo.one()
  end
end
