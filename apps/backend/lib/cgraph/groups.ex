defmodule CGraph.Groups do
  @moduledoc """
  The Groups context.

  Thin facade delegating to focused sub-modules:
  - `CGraph.Groups.Channels` — channels, messages, reactions, pinning, categories, overwrites
  - `CGraph.Groups.Members` — member CRUD, muting, hierarchy, bans
  - `CGraph.Groups.Roles` — role CRUD, permissions, reordering
  - `CGraph.Groups.Invites` — invite CRUD, join-via-invite
  - `CGraph.Groups.Emojis` — custom emoji CRUD

  Groups CRUD, authorization, search, audit log, and orchestrating operations
  (e.g. send_channel_message, transfer_ownership) remain inline.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.{AuditLog, Group, Member}
  alias CGraph.Groups.{Channels, Emojis, Invites, Members, Roles}
  alias CGraph.Messaging.Message
  alias CGraph.Repo

  # ============================================================================
  # Delegated: Channels
  # ============================================================================

  defdelegate list_channels(group, opts \\ []), to: Channels

  @doc "Get a channel by group + channel_id, or by channel_id alone."
  def get_channel(channel_id) when is_binary(channel_id), do: Channels.get_channel(channel_id)
  def get_channel(group, channel_id), do: Channels.get_channel(group, channel_id)
  defdelegate create_channel(group, attrs), to: Channels
  defdelegate update_channel(channel, attrs), to: Channels
  defdelegate delete_channel(channel), to: Channels
  defdelegate reorder_channels(group, channel_ids), to: Channels
  defdelegate list_channel_messages(channel_or_id, opts \\ []), to: Channels
  defdelegate create_channel_message(channel, user, attrs), to: Channels
  defdelegate get_channel_message(channel, message_id), to: Channels
  defdelegate broadcast_channel_typing(channel, user), to: Channels
  defdelegate broadcast_channel_message(channel, message), to: Channels
  defdelegate list_message_reactions(message, opts \\ []), to: Channels
  defdelegate add_message_reaction(user, message, emoji), to: Channels
  defdelegate remove_message_reaction(user, message, emoji), to: Channels
  defdelegate broadcast_reaction_added(channel, message, reaction, user \\ nil), to: Channels
  defdelegate broadcast_reaction_removed(channel, message, user, emoji), to: Channels
  defdelegate can_view_channel?(member, channel), to: Channels
  defdelegate can_send_messages?(member), to: Channels
  defdelegate can_manage_messages?(member), to: Channels
  defdelegate pin_message(message, user), to: Channels
  defdelegate list_pinned_messages(channel), to: Channels
  defdelegate get_pinned_message(channel_id, pinned_id), to: Channels
  defdelegate unpin_message(pinned_message), to: Channels
  defdelegate list_permission_overwrites(channel), to: Channels
  defdelegate get_permission_overwrite(channel_id, overwrite_id), to: Channels
  defdelegate create_permission_overwrite(channel, attrs), to: Channels
  defdelegate update_permission_overwrite(overwrite, attrs), to: Channels
  defdelegate delete_permission_overwrite(overwrite), to: Channels
  defdelegate list_channel_categories(group), to: Channels
  defdelegate get_channel_category(group, category_id), to: Channels
  defdelegate create_channel_category(group, attrs), to: Channels
  defdelegate update_channel_category(category, attrs), to: Channels
  defdelegate delete_channel_category(category), to: Channels

  # ============================================================================
  # Delegated: Members
  # ============================================================================

  defdelegate list_group_members(group, opts \\ []), to: Members
  defdelegate get_member(group, member_id), to: Members
  defdelegate get_member_by_user(group, user_id), to: Members
  defdelegate add_member(group, user, role_ids \\ []), to: Members
  defdelegate update_member(member, attrs), to: Members
  defdelegate update_member_notifications(member, attrs), to: Members
  defdelegate update_member_roles(member, role_ids), to: Members
  defdelegate remove_member(member), to: Members
  defdelegate mute_member(member, until), to: Members
  defdelegate unmute_member(member), to: Members
  defdelegate compare_hierarchy(member_a, member_b), to: Members
  defdelegate ban_member(group, user, reason \\ nil), to: Members
  defdelegate unban_user(group, user_id), to: Members
  defdelegate list_bans(group), to: Members
  defdelegate get_ban(group, user_id), to: Members

  # ============================================================================
  # Delegated: Roles
  # ============================================================================

  defdelegate list_roles(group), to: Roles
  defdelegate get_role(group, role_id), to: Roles
  defdelegate create_role(group, attrs), to: Roles
  defdelegate update_role(role, attrs), to: Roles
  defdelegate delete_role(role), to: Roles
  defdelegate reorder_roles(group, role_ids), to: Roles
  defdelegate calculate_permissions(member, group), to: Roles

  # ============================================================================
  # Delegated: Invites
  # ============================================================================

  defdelegate list_invites(group), to: Invites
  defdelegate get_invite(group, invite_id), to: Invites
  defdelegate get_invite_by_code(code), to: Invites
  defdelegate create_invite(group, user, opts \\ %{}), to: Invites
  defdelegate delete_invite(invite), to: Invites

  @doc "Join a group via invite. Accepts (invite, user) or (user, invite)."
  def join_via_invite(first, second), do: Invites.join_via_invite(first, second)

  # ============================================================================
  # Delegated: Emojis
  # ============================================================================

  defdelegate list_group_emojis(group), to: Emojis
  defdelegate get_group_emoji(group, emoji_id), to: Emojis
  defdelegate create_group_emoji(group, user, attrs), to: Emojis
  defdelegate update_group_emoji(emoji, attrs), to: Emojis
  defdelegate delete_group_emoji(emoji), to: Emojis

  # ============================================================================
  # Groups CRUD (inline — orchestrates sub-modules)
  # ============================================================================

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  @doc "List groups for a user."
  @spec list_groups(struct(), keyword()) :: {list(), map()}
  def list_groups(user, opts \\ []) do
    query = from g in Group,
      join: m in Member, on: m.group_id == g.id,
      where: m.user_id == ^user.id,
      preload: [:channels]

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :updated_at,
      sort_direction: :desc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "List user groups (alias for list_groups)."
  @spec list_user_groups(struct(), keyword()) :: {list(), map()}
  def list_user_groups(user, opts \\ []), do: list_groups(user, opts)

  @doc "Count the number of groups owned by a user."
  @spec count_user_groups(binary()) :: non_neg_integer()
  def count_user_groups(user_id) do
    from(g in Group, where: g.owner_id == ^user_id and is_nil(g.deleted_at))
    |> Repo.aggregate(:count, :id)
  end

  @doc "Get a group by ID."
  @spec get_group(binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_group(id) do
    query = from g in Group,
      where: g.id == ^id,
      preload: [:channels, :roles, members: :user]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      group -> {:ok, group}
    end
  end

  @doc "Get a group that user is a member of."
  @spec get_user_group(struct(), binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_user_group(user, group_id) do
    with {:ok, group} <- get_group(group_id),
         true <- member?(user, group) do
      {:ok, group}
    else
      false -> {:error, :not_found}
      error -> error
    end
  end

  @doc "Authorize an action (alias for authorize_action)."
  @spec authorize(struct(), struct(), atom()) :: :ok | {:error, atom()}
  def authorize(user, group, action), do: authorize_action(user, group, action)

  @doc "Check if user is a member of a group."
  @spec member?(struct(), struct()) :: boolean()
  def member?(user, group) do
    query = from m in Member,
      where: m.group_id == ^group.id,
      where: m.user_id == ^user.id

    Repo.exists?(query)
  end

  @doc "Authorize an action on a group."
  @spec authorize_action(struct(), struct(), atom()) :: :ok | {:error, atom()}
  def authorize_action(user, group, action) do
    member = Members.get_member_by_user(group, user.id)

    cond do
      is_nil(member) -> {:error, :not_found}
      group.owner_id == user.id -> :ok
      Roles.has_permission?(member, action) -> :ok
      true -> {:error, :insufficient_permissions}
    end
  end

  @doc "Create a new group."
  @spec create_group(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_group(user, attrs) do
    attrs = stringify_keys(attrs) |> Map.put("owner_id", user.id)

    case %Group{} |> Group.changeset(attrs) |> Repo.insert() do
      {:error, changeset} ->
        {:error, changeset}

      {:ok, group} ->
        Repo.transaction(fn ->
          {:ok, admin_role} = Roles.create_role(group, %{
            "name" => "Admin",
            "color" => "#FF0000",
            "position" => 1,
            "is_admin" => true
          })

          {:ok, _member_role} = Roles.create_role(group, %{
            "name" => "Member",
            "color" => "#808080",
            "position" => 0,
            "is_default" => true
          })

          {:ok, _member} = Members.add_member(group, user, [admin_role.id])

          {:ok, _channel} = Channels.create_channel(group, %{
            "name" => "general",
            "type" => "text"
          })

          {:ok, loaded_group} = get_group(group.id)
          loaded_group
        end)
    end
  end

  @doc "Update a group."
  @spec update_group(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_group(group, attrs) do
    group
    |> Group.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete a group (soft delete)."
  @spec delete_group(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def delete_group(group) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    group
    |> Ecto.Changeset.change(deleted_at: now)
    |> Repo.update()
  end

  # ============================================================================
  # Search
  # ============================================================================

  @doc "Search groups."
  @spec search_groups(binary(), keyword()) :: {list(), map()}
  def search_groups(query, opts \\ []) do
    user = Keyword.get(opts, :user)
    search_term = "%#{query}%"

    db_query = from g in Group,
      where: ilike(g.name, ^search_term) or ilike(g.description, ^search_term),
      where: g.is_public == true

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :member_count,
      sort_direction: :desc,
      default_limit: 20
    )

    {groups, page_info} = CGraph.Pagination.paginate(db_query, pagination_opts)

    groups = Enum.map(groups, fn g ->
      is_member = if user, do: member?(user, g), else: false
      Map.put(g, :is_member, is_member)
    end)

    {groups, page_info}
  end

  @doc "Get group suggestions for autocomplete."
  @spec get_group_suggestions(binary(), keyword()) :: list()
  def get_group_suggestions(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)
    search_term = "#{query}%"

    from(g in Group,
      where: ilike(g.name, ^search_term),
      where: g.is_public == true,
      order_by: [desc: g.member_count],
      limit: ^limit
    )
    |> Repo.all()
  end

  # ============================================================================
  # Audit Log
  # ============================================================================

  @doc "Log an audit event."
  @spec log_audit_event(struct(), struct(), atom() | binary(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def log_audit_event(group, user, action, data \\ %{}) do
    %AuditLog{}
    |> AuditLog.changeset(%{
      group_id: group.id,
      user_id: user.id,
      action_type: to_string(action),
      changes: data
    })
    |> Repo.insert()
  end

  @doc "Get audit log entries."
  @spec get_audit_log(struct(), keyword()) :: {list(), map()}
  def get_audit_log(group, opts \\ []) do
    action_filter = Keyword.get(opts, :action)
    user_filter = Keyword.get(opts, :user_id)

    query = from a in AuditLog,
      where: a.group_id == ^group.id,
      preload: [:user]

    query = if action_filter do
      from a in query, where: a.action == ^action_filter
    else
      query
    end

    query = if user_filter do
      from a in query, where: a.user_id == ^user_filter
    else
      query
    end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 50
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Alias for get_audit_log for controller compatibility."
  @spec list_audit_log(struct(), keyword()) :: {list(), map()}
  def list_audit_log(group, opts \\ []), do: get_audit_log(group, opts)

  # ============================================================================
  # Orchestrating Operations
  # ============================================================================

  @doc "Send a message to a channel with idempotency support."
  @spec send_channel_message(struct(), struct(), map()) :: {:ok, struct()} | {:error, any()}
  def send_channel_message(channel, user, attrs) do
    message_attrs = attrs
      |> Map.put("user_id", user.id)
      |> Map.put("channel_id", channel.id)

    %Message{}
    |> Message.changeset(message_attrs)
    |> Repo.insert()
    |> case do
      {:ok, message} ->
        {:ok, Repo.preload(message, [[sender: :customization], :reactions])}

      {:error, %Ecto.Changeset{} = changeset} ->
        if idempotency_conflict?(changeset) do
          client_message_id = Ecto.Changeset.get_field(changeset, :client_message_id)

          case get_channel_message_by_client_id(channel.id, client_message_id) do
            nil -> {:error, changeset}
            message -> {:ok, Repo.preload(message, [[sender: :customization], :reactions])}
          end
        else
          {:error, changeset}
        end

      error ->
        error
    end
  end

  @doc "Transfer group ownership."
  @spec transfer_ownership(struct(), binary()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def transfer_ownership(group, new_owner_id) do
    group
    |> Ecto.Changeset.change(owner_id: new_owner_id)
    |> Repo.update()
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp idempotency_conflict?(changeset) do
    Enum.any?(changeset.errors, fn {field, {_, _}} ->
      field == :client_message_id
    end)
  end

  defp get_channel_message_by_client_id(channel_id, client_message_id)
       when is_binary(client_message_id) do
    from(m in Message,
      where: m.channel_id == ^channel_id,
      where: m.client_message_id == ^client_message_id,
      preload: [[sender: :customization], reactions: :user]
    )
    |> Repo.one()
  end

  defp get_channel_message_by_client_id(_, _), do: nil
end
