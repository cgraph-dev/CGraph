defmodule CGraph.Groups.Emojis do
  @moduledoc """
  Custom emoji operations for groups.

  Handles CRUD for group custom emojis with permission enforcement.
  """

  import Ecto.Query, warn: false

  @dialyzer {:nowarn_function, check_manage_emojis_permission: 2, create_group_emoji_with_permission: 4, delete_group_emoji_with_permission: 3}

  alias CGraph.Groups.GroupEmoji
  alias CGraph.Groups.Roles
  alias CGraph.Repo

  # Size limits for emoji uploads
  @max_static_size 128 * 1024   # 128KB for static
  @max_animated_size 256 * 1024 # 256KB for animated
  # Maximum dimension for emoji (reserved for future use)
  # @max_dimension 128          # 128x128 pixels max

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
  @spec create_group_emoji(struct(), struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t() | atom()}
  def create_group_emoji(group, user, attrs) do
    %GroupEmoji{}
    |> GroupEmoji.changeset(Map.merge(attrs, %{group_id: group.id, uploaded_by_id: user.id}))
    |> Repo.insert()
  end

  @doc "Create a custom emoji with permission check."
  @spec create_group_emoji_with_permission(struct(), struct(), struct(), map()) ::
          {:ok, struct()} | {:error, atom() | Ecto.Changeset.t()}
  def create_group_emoji_with_permission(group, member, user, attrs) do
    with :ok <- check_manage_emojis_permission(member, group),
         :ok <- validate_animated_emoji(attrs) do
      create_group_emoji(group, user, attrs)
    end
  end

  @doc "Delete a custom emoji with permission check."
  @spec delete_group_emoji_with_permission(struct(), struct(), struct()) ::
          {:ok, struct()} | {:error, atom() | Ecto.Changeset.t()}
  def delete_group_emoji_with_permission(emoji, member, group) do
    with :ok <- check_manage_emojis_permission(member, group) do
      delete_group_emoji(emoji)
    end
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

  # ===========================================================================
  # Permission & Validation Helpers
  # ===========================================================================

  defp check_manage_emojis_permission(member, group) do
    if Roles.has_effective_permission?(member, group, nil, :manage_emojis) do
      :ok
    else
      {:error, :forbidden}
    end
  end

  @doc "Validate animated emoji file constraints."
  @spec validate_animated_emoji(map()) :: :ok | {:error, atom()}
  def validate_animated_emoji(attrs) do
    is_animated = Map.get(attrs, :is_animated, false) || Map.get(attrs, "is_animated", false)
    file_size = Map.get(attrs, :file_size, 0) || Map.get(attrs, "file_size", 0)

    max_size = if is_animated, do: @max_animated_size, else: @max_static_size

    cond do
      file_size > max_size ->
        {:error, :file_too_large}
      is_animated && not valid_animated_type?(attrs) ->
        {:error, :invalid_animated_type}
      true ->
        :ok
    end
  end

  defp valid_animated_type?(attrs) do
    mime = Map.get(attrs, :file_mime_type, "") || Map.get(attrs, "file_mime_type", "")
    mime in ["image/gif", "image/apng", "image/webp"]
  end
end
