defmodule CGraph.Groups.Emojis do
  @moduledoc """
  Custom emoji operations for groups.

  Handles CRUD for group custom emojis.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.GroupEmoji
  alias CGraph.Repo

  @doc "List custom emojis for a group."
  @spec list_group_emojis(struct()) :: list()
  def list_group_emojis(group) do
    GroupEmoji
    |> where([ge], ge.group_id == ^group.id)
    |> order_by([ge], asc: ge.name)
    |> Repo.all()
  end

  @doc "Get a specific custom emoji."
  @spec get_group_emoji(struct(), binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_group_emoji(group, emoji_id) do
    case Repo.get_by(GroupEmoji, id: emoji_id, group_id: group.id) do
      nil -> {:error, :not_found}
      emoji -> {:ok, emoji}
    end
  end

  @doc "Create a custom emoji in a group."
  @spec create_group_emoji(struct(), struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_group_emoji(group, user, attrs) do
    %GroupEmoji{}
    |> GroupEmoji.changeset(Map.merge(attrs, %{group_id: group.id, uploaded_by_id: user.id}))
    |> Repo.insert()
  end

  @doc "Update a custom emoji (rename)."
  @spec update_group_emoji(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_group_emoji(emoji, attrs) do
    emoji
    |> GroupEmoji.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete a custom emoji. Hard delete intentional: emoji schema lacks deleted_at."
  @spec delete_group_emoji(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def delete_group_emoji(emoji) do
    Repo.delete(emoji)
  end
end
