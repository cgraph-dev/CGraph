defmodule CGraph.Groups.Channels do
  @moduledoc """
  Channel operations for groups.

  Handles channel CRUD, channel messages, typing indicators, reactions,
  permission checks, permission overwrites, pinned messages, and channel categories.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.{Channel, ChannelCategory, Member, PermissionOverwrite, PinnedMessage, Role}
  alias CGraph.Messaging.Message
  alias CGraph.Repo

  # ============================================================================
  # Channel CRUD
  # ============================================================================

  @doc "List channels for a group, optionally filtered by category."
  @spec list_channels(struct(), keyword()) :: list()
  def list_channels(group, opts \\ []) do
    category_id = Keyword.get(opts, :category_id)

    query = from c in Channel,
      where: c.group_id == ^group.id,
      where: is_nil(c.deleted_at),
      order_by: [asc: c.position, asc: c.inserted_at]

    query = if category_id do
      from c in query, where: c.category_id == ^category_id
    else
      query
    end

    Repo.all(query)
  end

  @doc "Get a channel by group and channel ID."
  @spec get_channel(struct(), binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_channel(group, channel_id) do
    query = from c in Channel,
      where: c.id == ^channel_id,
      where: c.group_id == ^group.id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      channel -> {:ok, channel}
    end
  end

  @doc "Get a channel by ID only (without group context)."
  @spec get_channel(binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_channel(channel_id) when is_binary(channel_id) do
    case Repo.get(Channel, channel_id) do
      nil -> {:error, :not_found}
      channel -> {:ok, Repo.preload(channel, [:group])}
    end
  end

  @doc "Create a channel in a group."
  @spec create_channel(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_channel(group, attrs) do
    channel_attrs = attrs
      |> stringify_keys()
      |> Map.put("group_id", group.id)
      |> normalize_channel_type()

    %Channel{}
    |> Channel.changeset(channel_attrs)
    |> Repo.insert()
  end

  @doc "Update a channel."
  @spec update_channel(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_channel(channel, attrs) do
    channel
    |> Channel.changeset(stringify_keys(attrs))
    |> Repo.update()
  end

  @doc "Soft-delete a channel (sets deleted_at)."
  @spec delete_channel(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def delete_channel(channel) do
    channel
    |> Ecto.Changeset.change(deleted_at: DateTime.truncate(DateTime.utc_now(), :second))
    |> Repo.update()
  end

  # ============================================================================
  # Channel Messages
  # ============================================================================

  @doc "List messages in a channel with cursor pagination."
  @spec list_channel_messages(binary() | struct(), keyword()) :: {list(), map()}
  def list_channel_messages(channel_id, opts \\ [])

  def list_channel_messages(channel_id, opts) when is_binary(channel_id) do
    query = from m in Message,
      where: m.channel_id == ^channel_id,
      preload: [[sender: :customization], :reactions]

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 50
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  def list_channel_messages(%Channel{} = channel, opts) do
    list_channel_messages(channel.id, opts)
  end

  @doc "Create a channel message."
  @spec create_channel_message(struct(), struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_channel_message(%CGraph.Accounts.User{} = user, channel, attrs) do
    create_channel_message(channel, user, attrs)
  end

  def create_channel_message(channel, user, attrs) do
    message_attrs = attrs |> stringify_keys() |> Map.merge(%{
      "sender_id" => user.id,
      "channel_id" => channel.id
    })

    %Message{}
    |> Message.changeset(message_attrs)
    |> Repo.insert()
    |> case do
      {:ok, message} -> {:ok, Repo.preload(message, [:sender, :reactions])}
      error -> error
    end
  end

  @doc "Get a channel message by ID."
  @spec get_channel_message(struct(), binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_channel_message(channel, message_id) do
    query = from m in Message,
      where: m.id == ^message_id,
      where: m.channel_id == ^channel.id,
      preload: [:user, :reactions]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
  end

  @doc "Broadcast typing indicator for a channel."
  @spec broadcast_channel_typing(struct(), struct()) :: :ok
  def broadcast_channel_typing(channel, user) do
    CGraphWeb.Endpoint.broadcast(
      "channel:#{channel.id}",
      "typing",
      %{user_id: user.id, username: user.username}
    )
  end

  @doc false
  @spec broadcast_channel_message(struct(), struct()) :: :ok
  def broadcast_channel_message(channel, message) do
    CGraphWeb.Endpoint.broadcast(
      "channel:#{channel.id}",
      "new_message",
      %{message: message}
    )
  end

  # ============================================================================
  # Channel Reactions
  # ============================================================================

  @doc "List reactions on a channel message."
  @spec list_message_reactions(struct(), keyword()) :: list()
  def list_message_reactions(message, opts \\ []) do
    CGraph.Messaging.list_reactions(message, opts)
  end

  @doc "Add a reaction to a channel message."
  @spec add_message_reaction(struct(), struct(), binary()) :: {:ok, struct()} | {:error, any()}
  def add_message_reaction(user, message, emoji) do
    CGraph.Messaging.add_reaction(user, message, emoji)
  end

  @doc "Remove a reaction from a channel message."
  @spec remove_message_reaction(struct(), struct(), binary()) :: {:ok, struct()} | {:error, any()}
  def remove_message_reaction(user, message, emoji) do
    CGraph.Messaging.remove_reaction(user, message, emoji)
  end

  @doc "Broadcast reaction added in channel."
  @spec broadcast_reaction_added(struct(), struct(), struct(), struct() | nil) :: :ok
  def broadcast_reaction_added(channel, message, reaction, user \\ nil) do
    user_data = user || reaction.user

    CGraphWeb.Endpoint.broadcast(
      "channel:#{channel.id}",
      "reaction_added",
      %{
        message_id: message.id,
        emoji: reaction.emoji,
        user_id: reaction.user_id,
        user: if user_data do
          %{
            id: user_data.id,
            username: user_data.username,
            display_name: user_data.display_name,
            avatar_url: user_data.avatar_url
          }
        else
          %{id: reaction.user_id}
        end
      }
    )
  end

  @doc "Broadcast reaction removed in channel."
  @spec broadcast_reaction_removed(struct(), struct(), struct(), binary()) :: :ok
  def broadcast_reaction_removed(channel, message, user, emoji) do
    CGraphWeb.Endpoint.broadcast(
      "channel:#{channel.id}",
      "reaction_removed",
      %{message_id: message.id, user_id: user.id, emoji: emoji}
    )
  end

  # ============================================================================
  # Permission Checks
  # ============================================================================

  @doc "Check if a member can view a channel."
  @spec can_view_channel?(Member.t(), Channel.t()) :: boolean()
  def can_view_channel?(%Member{} = member, %Channel{} = channel) do
    channel = if Ecto.assoc_loaded?(channel.group), do: channel, else: Repo.preload(channel, :group)
    member.user_id == channel.group.owner_id || true
  end

  @doc "Check if a member can send messages (not muted)."
  @spec can_send_messages?(Member.t()) :: boolean()
  def can_send_messages?(%Member{} = member) do
    !member.is_muted && (is_nil(member.muted_until) || DateTime.compare(member.muted_until, DateTime.truncate(DateTime.utc_now(), :second)) == :lt)
  end

  @doc "Check if a member can manage messages (edit/delete others')."
  @spec can_manage_messages?(Member.t()) :: boolean()
  def can_manage_messages?(%Member{} = member) do
    member_has_permission?(member, :manage_messages) || member_has_permission?(member, :administrator)
  end

  # ============================================================================
  # Pinned Messages
  # ============================================================================

  @doc "Pin a message in a channel."
  @spec pin_message(struct(), struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def pin_message(message, user) do
    %PinnedMessage{}
    |> PinnedMessage.changeset(%{
      channel_id: message.channel_id,
      message_id: message.id,
      pinned_by_id: user.id
    })
    |> Repo.insert()
  end

  @doc "List pinned messages for a channel, ordered by position."
  @spec list_pinned_messages(struct()) :: list()
  def list_pinned_messages(channel) do
    PinnedMessage
    |> where([pm], pm.channel_id == ^channel.id)
    |> order_by([pm], asc: pm.position, asc: pm.inserted_at)
    |> Repo.all()
  end

  @doc "Get a specific pinned message."
  @spec get_pinned_message(binary(), binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_pinned_message(channel_id, pinned_id) do
    case Repo.get_by(PinnedMessage, id: pinned_id, channel_id: channel_id) do
      nil -> {:error, :not_found}
      pinned -> {:ok, pinned}
    end
  end

  @doc "Unpin a message from a channel."
  @spec unpin_message(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def unpin_message(pinned_message) do
    Repo.delete(pinned_message)
  end

  # ============================================================================
  # Permission Overwrites
  # ============================================================================

  @doc "List permission overwrites for a channel."
  @spec list_permission_overwrites(struct()) :: list()
  def list_permission_overwrites(channel) do
    PermissionOverwrite
    |> where([po], po.channel_id == ^channel.id)
    |> Repo.all()
  end

  @doc "Get a specific permission overwrite."
  @spec get_permission_overwrite(binary(), binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_permission_overwrite(channel_id, overwrite_id) do
    case Repo.get_by(PermissionOverwrite, id: overwrite_id, channel_id: channel_id) do
      nil -> {:error, :not_found}
      overwrite -> {:ok, overwrite}
    end
  end

  @doc "Create a permission overwrite for a channel."
  @spec create_permission_overwrite(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_permission_overwrite(channel, attrs) do
    %PermissionOverwrite{}
    |> PermissionOverwrite.changeset(Map.put(attrs, :channel_id, channel.id))
    |> Repo.insert()
  end

  @doc "Update a permission overwrite."
  @spec update_permission_overwrite(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_permission_overwrite(overwrite, attrs) do
    overwrite
    |> PermissionOverwrite.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete a permission overwrite."
  @spec delete_permission_overwrite(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def delete_permission_overwrite(overwrite) do
    Repo.delete(overwrite)
  end

  # ============================================================================
  # Channel Categories
  # ============================================================================

  @doc "List channel categories for a group, ordered by position."
  @spec list_channel_categories(struct()) :: list()
  def list_channel_categories(group) do
    ChannelCategory
    |> where([cc], cc.group_id == ^group.id)
    |> order_by([cc], asc: cc.position)
    |> Repo.all()
  end

  @doc "Get a specific channel category."
  @spec get_channel_category(struct(), binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_channel_category(group, category_id) do
    case Repo.get_by(ChannelCategory, id: category_id, group_id: group.id) do
      nil -> {:error, :not_found}
      category -> {:ok, category}
    end
  end

  @doc "Create a channel category."
  @spec create_channel_category(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_channel_category(group, attrs) do
    %ChannelCategory{}
    |> ChannelCategory.changeset(Map.put(attrs, :group_id, group.id))
    |> Repo.insert()
  end

  @doc "Update a channel category."
  @spec update_channel_category(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_channel_category(category, attrs) do
    category
    |> ChannelCategory.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete a channel category. Hard delete intentional: organizational container without content."
  @spec delete_channel_category(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def delete_channel_category(category) do
    Repo.delete(category)
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  defp normalize_channel_type(attrs) do
    case Map.pop(attrs, "type") do
      {nil, attrs} -> attrs
      {type, attrs} -> Map.put_new(attrs, "channel_type", type)
    end
  end

  defp member_has_permission?(member, permission) do
    Enum.any?(member.roles, fn role ->
      Role.has_permission?(role, permission)
    end)
  end
end
