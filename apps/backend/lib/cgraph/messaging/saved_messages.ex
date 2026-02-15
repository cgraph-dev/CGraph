defmodule CGraph.Messaging.SavedMessages do
  @moduledoc """
  Saved message (bookmark) functionality.

  Extracted from `CGraph.Messaging` to keep the facade under 500 lines.
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.{Message, SavedMessage}
  alias CGraph.Repo

  @doc "List saved messages for a user, optionally filtered by search term."
  @spec list_saved_messages(String.t(), keyword()) :: [SavedMessage.t()]
  def list_saved_messages(user_id, opts \\ []) do
    search = Keyword.get(opts, :search)

    query =
      from sm in SavedMessage,
        where: sm.user_id == ^user_id,
        join: m in Message, on: m.id == sm.message_id,
        join: sender in assoc(m, :sender),
        order_by: [desc: sm.saved_at],
        preload: [message: {m, sender: sender}]

    query = if search && search != "" do
      term = "%#{search}%"
      from [sm, m, _s] in query, where: ilike(m.content, ^term)
    else
      query
    end

    Repo.all(query)
  end

  @doc "Save a message (bookmark it)."
  @spec save_message(String.t(), String.t(), keyword()) :: {:ok, SavedMessage.t()} | {:error, Ecto.Changeset.t()}
  def save_message(user_id, message_id, opts \\ []) do
    note = Keyword.get(opts, :note)
    %SavedMessage{}
    |> SavedMessage.changeset(%{user_id: user_id, message_id: message_id, note: note})
    |> Repo.insert()
  end

  @doc "Remove a saved message."
  @spec unsave_message(String.t(), String.t()) :: {:ok, SavedMessage.t()} | {:error, :not_found}
  def unsave_message(user_id, saved_message_id) do
    case Repo.get_by(SavedMessage, id: saved_message_id, user_id: user_id) do
      nil -> {:error, :not_found}
      saved -> Repo.delete(saved)
    end
  end

  @doc "Check if a message is saved by a user."
  @spec message_saved?(String.t(), String.t()) :: boolean()
  def message_saved?(user_id, message_id) do
    Repo.exists?(
      from sm in SavedMessage,
        where: sm.user_id == ^user_id and sm.message_id == ^message_id
    )
  end
end
