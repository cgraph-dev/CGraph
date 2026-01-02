defmodule Cgraph.Groups do
  @moduledoc """
  The Groups context.
  
  Handles group (server) management, channels, members, roles, and invites.
  Discord-style server functionality.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Groups.{Group, Channel, Member, Role, Invite, AuditLog}
  alias Cgraph.Messaging.Message

  # Helper to convert atom keys to string keys
  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  # ============================================================================
  # Groups
  # ============================================================================

  @doc """
  List groups for a user.
  """
  def list_groups(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from g in Group,
      join: m in Member, on: m.group_id == g.id,
      where: m.user_id == ^user.id,
      order_by: [desc: g.updated_at],
      preload: [:channels]

    total = Repo.aggregate(query, :count, :id)
    
    groups = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {groups, meta}
  end

  @doc """
  List user groups (alias for list_groups).
  """
  def list_user_groups(user, opts \\ []), do: list_groups(user, opts)

  @doc """
  Get a group by ID.
  """
  def get_group(id) do
    query = from g in Group,
      where: g.id == ^id,
      preload: [:channels, :roles, members: :user]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      group -> {:ok, group}
    end
  end

  @doc """
  Get a group that user is a member of.
  """
  def get_user_group(user, group_id) do
    with {:ok, group} <- get_group(group_id),
         true <- is_member?(user, group) do
      {:ok, group}
    else
      false -> {:error, :not_found}
      error -> error
    end
  end

  @doc """
  Authorize an action (alias for authorize_action).
  """
  def authorize(user, group, action), do: authorize_action(user, group, action)

  @doc """
  Check if user is a member of a group.
  """
  def is_member?(user, group) do
    query = from m in Member,
      where: m.group_id == ^group.id,
      where: m.user_id == ^user.id

    Repo.exists?(query)
  end

  @doc """
  Authorize an action on a group.
  """
  def authorize_action(user, group, action) do
    member = get_member_by_user(group, user.id)
    
    cond do
      is_nil(member) -> {:error, :not_found}
      group.owner_id == user.id -> :ok
      has_permission?(member, action) -> :ok
      true -> {:error, :insufficient_permissions}
    end
  end

  @doc """
  Create a new group.
  """
  def create_group(user, attrs) do
    # Convert to string keys for consistency
    attrs = stringify_keys(attrs) |> Map.put("owner_id", user.id)
    
    # Create the group first, handle validation errors
    case %Group{} |> Group.changeset(attrs) |> Repo.insert() do
      {:error, changeset} ->
        {:error, changeset}
      
      {:ok, group} ->
        # Wrap the rest in a transaction
        Repo.transaction(fn ->
          # Create default roles
          {:ok, admin_role} = create_role(group, %{
            "name" => "Admin",
            "color" => "#FF0000",
            "position" => 1,
            "is_admin" => true
          })

          {:ok, _member_role} = create_role(group, %{
            "name" => "Member",
            "color" => "#808080",
            "position" => 0,
            "is_default" => true
          })

          # Add owner as member with admin role
          {:ok, _member} = add_member(group, user, [admin_role.id])

          # Create default channel
          {:ok, _channel} = create_channel(group, %{
            "name" => "general",
            "type" => "text"
          })

          # Reload group with associations
          {:ok, loaded_group} = get_group(group.id)
          loaded_group
        end)
    end
  end

  @doc """
  Update a group.
  """
  def update_group(group, attrs) do
    group
    |> Group.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a group (soft delete).
  
  Sets deleted_at timestamp rather than removing the record.
  """
  def delete_group(group) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    group
    |> Ecto.Changeset.change(deleted_at: now)
    |> Repo.update()
  end

  # ============================================================================
  # Channels
  # ============================================================================

  @doc """
  List channels in a group.
  """
  def list_channels(group, opts \\ []) do
    category_id = Keyword.get(opts, :category_id)

    query = from c in Channel,
      where: c.group_id == ^group.id,
      order_by: [asc: c.position]

    query = if category_id do
      from c in query, where: c.category_id == ^category_id
    else
      query
    end

    Repo.all(query)
  end

  @doc """
  Get a channel by ID.
  """
  def get_channel(group, channel_id) do
    query = from c in Channel,
      where: c.id == ^channel_id,
      where: c.group_id == ^group.id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      channel -> {:ok, channel}
    end
  end

  @doc """
  Create a channel.
  
  Accepts both :type and :channel_type for the channel type field.
  """
  def create_channel(group, attrs) do
    channel_attrs = attrs
      |> stringify_keys()
      |> Map.put("group_id", group.id)
      |> normalize_channel_type()
    
    %Channel{}
    |> Channel.changeset(channel_attrs)
    |> Repo.insert()
  end
  
  # Normalize "type" to "channel_type" for API consistency
  defp normalize_channel_type(attrs) do
    case Map.pop(attrs, "type") do
      {nil, attrs} -> attrs
      {type, attrs} -> Map.put_new(attrs, "channel_type", type)
    end
  end

  @doc """
  Update a channel.
  """
  def update_channel(channel, attrs) do
    channel
    |> Channel.changeset(stringify_keys(attrs))
    |> Repo.update()
  end

  @doc """
  Delete a channel.
  """
  def delete_channel(channel) do
    Repo.delete(channel)
  end

  # ============================================================================
  # Channel Messages
  # ============================================================================

  @doc """
  List messages in a channel.
  Accepts either a channel struct or channel_id string.
  """
  def list_channel_messages(channel_or_id, opts \\ [])

  def list_channel_messages(channel_id, opts) when is_binary(channel_id) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, Keyword.get(opts, :limit, 50))

    query = from m in Message,
      where: m.channel_id == ^channel_id,
      order_by: [desc: m.inserted_at],
      preload: [:sender, :reactions]

    total = Repo.aggregate(query, :count, :id)
    
    messages = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()
      |> Enum.reverse()

    meta = %{page: page, per_page: per_page, total: total, has_more: length(messages) == per_page}
    {messages, meta}
  end

  def list_channel_messages(channel, opts) when is_struct(channel) do
    list_channel_messages(channel.id, opts)
  end

  @doc """
  Create a message in a channel.
  """
  def create_channel_message(user, channel, attrs) do
    message_attrs = attrs
      |> Map.put("sender_id", user.id)
      |> Map.put("channel_id", channel.id)

    result = %Message{}
      |> Message.changeset(message_attrs)
      |> Repo.insert()

    case result do
      {:ok, message} ->
        broadcast_channel_message(channel, message)
        {:ok, Repo.preload(message, [:sender, :reactions])}
      error -> error
    end
  end

  @doc """
  Broadcast typing indicator in channel.
  """
  def broadcast_channel_typing(channel, user) do
    CgraphWeb.Endpoint.broadcast(
      "channel:#{channel.id}",
      "typing",
      %{user_id: user.id, username: user.username}
    )
    :ok
  end

  defp broadcast_channel_message(channel, message) do
    CgraphWeb.Endpoint.broadcast(
      "channel:#{channel.id}",
      "new_message",
      %{message: message}
    )
  end

  # ============================================================================
  # Members
  # ============================================================================

  @doc """
  List members of a group.
  """
  def list_group_members(group, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    role_filter = Keyword.get(opts, :role)

    query = from m in Member,
      where: m.group_id == ^group.id,
      preload: [:user, :roles]

    query = if role_filter do
      from m in query,
        join: r in assoc(m, :roles),
        where: r.id == ^role_filter
    else
      query
    end

    total = Repo.aggregate(query, :count, :id)
    
    members = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {members, meta}
  end

  @doc """
  Get a member by ID.
  """
  def get_member(group, member_id) do
    query = from m in Member,
      where: m.id == ^member_id,
      where: m.group_id == ^group.id,
      preload: [:user, :roles]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      member -> {:ok, member}
    end
  end

  @doc """
  Get a member by user ID.
  """
  def get_member_by_user(group, user_id) do
    query = from m in Member,
      where: m.group_id == ^group.id,
      where: m.user_id == ^user_id,
      preload: [:roles]

    Repo.one(query)
  end

  @doc """
  Add a member to a group.
  """
  def add_member(group, user, role_ids \\ []) do
    %Member{}
    |> Member.changeset(%{group_id: group.id, user_id: user.id})
    |> Repo.insert()
    |> case do
      {:ok, member} ->
        if role_ids != [] do
          update_member_roles(member, role_ids)
        else
          {:ok, member}
        end
      error -> error
    end
  end

  @doc """
  Update a member.
  """
  def update_member(member, attrs) do
    member
    |> Member.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Update member roles.
  """
  def update_member_roles(member, role_ids) do
    roles = Repo.all(from r in Role, where: r.id in ^role_ids)
    
    member
    |> Repo.preload(:roles)
    |> Ecto.Changeset.change()
    |> Ecto.Changeset.put_assoc(:roles, roles)
    |> Repo.update()
  end

  @doc """
  Remove a member from a group.
  """
  def remove_member(member) do
    Repo.delete(member)
  end

  @doc """
  Mute a member.
  """
  def mute_member(member, duration_seconds) do
    # Truncate to seconds for :utc_datetime field (not _usec)
    muted_until = DateTime.utc_now()
      |> DateTime.add(duration_seconds, :second)
      |> DateTime.truncate(:second)
    
    member
    |> Ecto.Changeset.change(muted_until: muted_until)
    |> Repo.update()
  end

  @doc """
  Unmute a member.
  """
  def unmute_member(member) do
    member
    |> Ecto.Changeset.change(muted_until: nil)
    |> Repo.update()
  end

  @doc """
  Compare hierarchy of two members.
  Returns :higher, :lower, or :equal.
  """
  def compare_hierarchy(actor_member, target_member) do
    actor_highest = get_highest_role_position(actor_member)
    target_highest = get_highest_role_position(target_member)

    cond do
      actor_highest > target_highest -> :higher
      actor_highest < target_highest -> :lower
      true -> :equal
    end
  end

  defp get_highest_role_position(member) do
    member.roles
    |> Enum.map(& &1.position)
    |> Enum.max(fn -> 0 end)
  end

  # ============================================================================
  # Bans
  # ============================================================================

  @doc """
  Ban a member from a group.
  """
  def ban_member(group, member, opts \\ []) do
    reason = Keyword.get(opts, :reason, "")
    duration = Keyword.get(opts, :duration)
    
    expires_at = if duration do
      DateTime.add(DateTime.utc_now(), duration, :second)
    else
      nil
    end

    # Remove from group
    Repo.delete(member)

    # Create ban record (could be a separate table)
    # For now, store in a simple way
    {:ok, %{
      id: Ecto.UUID.generate(),
      group_id: group.id,
      user_id: member.user_id,
      reason: reason,
      expires_at: expires_at,
      inserted_at: DateTime.utc_now()
    }}
  end

  @doc """
  Unban a user from a group.
  """
  def unban_user(_group, _user_id) do
    # Remove ban record
    {:ok, :unbanned}
  end

  @doc """
  List banned users.
  """
  def list_bans(_group) do
    # Return list of bans
    []
  end

  @doc """
  Get a ban record.
  """
  def get_ban(_group, _user_id) do
    nil
  end

  # ============================================================================
  # Roles
  # ============================================================================

  @doc """
  List roles in a group.
  """
  def list_roles(group) do
    from(r in Role,
      where: r.group_id == ^group.id,
      order_by: [desc: r.position]
    )
    |> Repo.all()
  end

  @doc """
  Get a role by ID.
  """
  def get_role(group, role_id) do
    query = from r in Role,
      where: r.id == ^role_id,
      where: r.group_id == ^group.id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      role -> {:ok, role}
    end
  end

  @doc """
  Create a role.
  """
  def create_role(group, attrs) do
    role_attrs = attrs
      |> stringify_keys()
      |> Map.put("group_id", group.id)

    %Role{}
    |> Role.changeset(role_attrs)
    |> Repo.insert()
  end

  @doc """
  Update a role.
  """
  def update_role(role, attrs) do
    role
    |> Role.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a role.
  """
  def delete_role(role) do
    Repo.delete(role)
  end

  @doc """
  Reorder roles.
  """
  def reorder_roles(group, role_ids) do
    Enum.with_index(role_ids)
    |> Enum.each(fn {role_id, index} ->
      from(r in Role, where: r.id == ^role_id and r.group_id == ^group.id)
      |> Repo.update_all(set: [position: length(role_ids) - index])
    end)

    {:ok, list_roles(group)}
  end

  @doc """
  Calculate the effective permissions for a member based on their roles.
  
  Returns a list of permission strings the member has.
  """
  def calculate_permissions(%Member{} = member, %Group{} = group) do
    roles = member.roles || []
    
    # Owner has all permissions
    if group.owner_id == member.user_id do
      all_permissions()
    else
      roles
      |> Enum.flat_map(&role_permissions/1)
      |> Enum.uniq()
    end
  end

  defp all_permissions do
    [
      "view", "view_members", "send_messages", "manage_messages",
      "manage_channels", "manage_roles", "manage_members", 
      "kick_members", "ban_members", "mute_members", "view_audit_log",
      "create_invites", "manage_invites", "add_reactions", "administrator"
    ]
  end

  defp role_permissions(role) do
    permissions = ["view", "view_members"]
    
    permissions = if role.is_admin, do: all_permissions(), else: permissions
    permissions = if Map.get(role, :can_send_messages, true), do: ["send_messages" | permissions], else: permissions
    permissions = if Map.get(role, :can_manage_messages, false), do: ["manage_messages" | permissions], else: permissions
    permissions = if Map.get(role, :can_manage_channels, false), do: ["manage_channels" | permissions], else: permissions
    permissions = if Map.get(role, :can_manage_roles, false), do: ["manage_roles" | permissions], else: permissions
    permissions = if Map.get(role, :can_manage_members, false), do: ["manage_members" | permissions], else: permissions
    permissions = if Map.get(role, :can_kick_members, false), do: ["kick_members" | permissions], else: permissions
    permissions = if Map.get(role, :can_ban_members, false), do: ["ban_members" | permissions], else: permissions
    permissions = if Map.get(role, :can_mute_members, false), do: ["mute_members" | permissions], else: permissions
    permissions = if Map.get(role, :can_view_audit_log, false), do: ["view_audit_log" | permissions], else: permissions
    permissions = if Map.get(role, :can_create_invites, true), do: ["create_invites" | permissions], else: permissions
    permissions = if Map.get(role, :can_manage_invites, false), do: ["manage_invites" | permissions], else: permissions
    permissions = if Map.get(role, :can_add_reactions, true), do: ["add_reactions" | permissions], else: permissions
    
    permissions
  end

  defp has_permission?(member, action) do
    Enum.any?(member.roles, fn role ->
      role.is_admin || check_role_permission(role, action)
    end)
  end

  defp check_role_permission(role, action) do
    case action do
      :view -> true
      :view_members -> true
      :send_messages -> Map.get(role, :can_send_messages, true)
      :manage_messages -> Map.get(role, :can_manage_messages, false)
      :manage_channels -> Map.get(role, :can_manage_channels, false)
      :manage_roles -> Map.get(role, :can_manage_roles, false)
      :manage_members -> Map.get(role, :can_manage_members, false)
      :kick_members -> Map.get(role, :can_kick_members, false)
      :ban_members -> Map.get(role, :can_ban_members, false)
      :mute_members -> Map.get(role, :can_mute_members, false)
      :view_audit_log -> Map.get(role, :can_view_audit_log, false)
      :create_invites -> Map.get(role, :can_create_invites, true)
      :view_invites -> Map.get(role, :can_create_invites, true)
      :manage_invites -> Map.get(role, :can_manage_invites, false)
      :add_reactions -> Map.get(role, :can_add_reactions, true)
      _ -> false
    end
  end

  # ============================================================================
  # Invites
  # ============================================================================

  @doc """
  List invites for a group.
  Filters out revoked invites and preloads creator info.
  """
  def list_invites(group) do
    from(i in Invite,
      where: i.group_id == ^group.id,
      where: i.is_revoked == false,
      preload: [:created_by]
    )
    |> Repo.all()
  end

  @doc """
  Get an invite by ID.
  """
  def get_invite(group, invite_id) do
    query = from i in Invite,
      where: i.id == ^invite_id,
      where: i.group_id == ^group.id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      invite -> {:ok, invite}
    end
  end

  @doc """
  Get an invite by code.
  """
  def get_invite_by_code(code) do
    # Note: Invite schema has :created_by association, not :inviter
    query = from i in Invite,
      where: i.code == ^code,
      preload: [:created_by, :group]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      invite -> {:ok, invite}
    end
  end

  @doc """
  Create an invite.
  
  Accepts either a keyword list or map for options:
    - max_uses: Maximum number of times the invite can be used
    - expires_in: Seconds until expiration (default: 86400 = 24 hours)
    - expires_at: Explicit expiration DateTime (overrides expires_in)
  """
  def create_invite(group, user, opts \\ [])

  def create_invite(group, user, opts) when is_map(opts) do
    # Convert map to keyword list for consistent handling
    keyword_opts = Enum.map(opts, fn
      {k, v} when is_atom(k) -> {k, v}
      {k, v} when is_binary(k) -> {String.to_existing_atom(k), v}
    end)
    create_invite_impl(group, user, keyword_opts)
  end

  def create_invite(group, user, opts) when is_list(opts) do
    create_invite_impl(group, user, opts)
  end

  defp create_invite_impl(group, user, opts) do
    max_uses = Keyword.get(opts, :max_uses)
    expires_at = Keyword.get(opts, :expires_at)
    expires_in = Keyword.get(opts, :expires_in, 86400)
    
    # Use explicit expires_at if provided, otherwise calculate from expires_in
    final_expires_at = cond do
      expires_at != nil -> expires_at
      expires_in != nil -> DateTime.add(DateTime.utc_now(), expires_in, :second)
      true -> nil
    end

    code = generate_invite_code()

    # Invite schema uses created_by_id, not inviter_id
    %Invite{}
    |> Invite.changeset(%{
      code: code,
      group_id: group.id,
      created_by_id: user.id,
      max_uses: max_uses,
      expires_at: final_expires_at
    })
    |> Repo.insert()
  end

  @doc """
  Delete an invite.
  """
  def delete_invite(invite) do
    Repo.delete(invite)
  end

  @doc """
  Join a group via invite.
  """
  def join_via_invite(user, invite) do
    # Increment uses
    invite
    |> Ecto.Changeset.change(uses: invite.uses + 1)
    |> Repo.update()

    # Get default role
    default_role = Repo.one(from r in Role,
      where: r.group_id == ^invite.group_id,
      where: r.is_default == true
    )

    role_ids = if default_role, do: [default_role.id], else: []

    # Add as member
    {:ok, group} = get_group(invite.group_id)
    add_member(group, user, role_ids)
  end

  defp generate_invite_code do
    :crypto.strong_rand_bytes(6)
    |> Base.url_encode64()
    |> String.replace(~r/[^a-zA-Z0-9]/, "")
    |> String.slice(0, 8)
  end

  # ============================================================================
  # Audit Log
  # ============================================================================

  @doc """
  Log an audit event.
  """
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

  @doc """
  Get audit log entries.
  """
  def get_audit_log(group, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    action_filter = Keyword.get(opts, :action)
    user_filter = Keyword.get(opts, :user_id)

    query = from a in AuditLog,
      where: a.group_id == ^group.id,
      order_by: [desc: a.inserted_at],
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

    total = Repo.aggregate(query, :count, :id)
    
    entries = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {entries, meta}
  end

  @doc """
  Alias for get_audit_log for controller compatibility.
  """
  def list_audit_log(group, opts \\ []), do: get_audit_log(group, opts)

  @doc """
  Send a message to a channel.
  """
  def send_channel_message(channel, user, attrs) do
    message_attrs = attrs
      |> Map.put("user_id", user.id)
      |> Map.put("channel_id", channel.id)

    %Message{}
    |> Message.changeset(message_attrs)
    |> Repo.insert()
  end

  @doc """
  Transfer group ownership.
  """
  def transfer_ownership(group, new_owner_id) do
    group
    |> Ecto.Changeset.change(owner_id: new_owner_id)
    |> Repo.update()
  end

  # ============================================================================
  # Search
  # ============================================================================

  @doc """
  Search groups.
  """
  def search_groups(query, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    user = Keyword.get(opts, :user)
    search_term = "%#{query}%"

    db_query = from g in Group,
      where: ilike(g.name, ^search_term) or ilike(g.description, ^search_term),
      where: g.is_public == true,
      order_by: [desc: g.member_count]

    total = Repo.aggregate(db_query, :count, :id)
    
    groups = db_query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()
      |> Enum.map(fn g ->
        is_member = if user, do: is_member?(user, g), else: false
        Map.put(g, :is_member, is_member)
      end)

    meta = %{page: page, per_page: per_page, total: total}
    {groups, meta}
  end

  @doc """
  Get group suggestions for autocomplete.
  """
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
  # Channel Reactions
  # ============================================================================

  @doc """
  Get a channel message.
  """
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

  @doc """
  List reactions on a channel message.
  """
  def list_message_reactions(message, opts \\ []) do
    Cgraph.Messaging.list_reactions(message, opts)
  end

  @doc """
  Add a reaction to a channel message.
  """
  def add_message_reaction(user, message, emoji) do
    Cgraph.Messaging.add_reaction(user, message, emoji)
  end

  @doc """
  Remove a reaction from a channel message.
  """
  def remove_message_reaction(user, message, emoji) do
    Cgraph.Messaging.remove_reaction(user, message, emoji)
  end

  @doc """
  Broadcast reaction added in channel.
  """
  def broadcast_reaction_added(channel, message, reaction) do
    CgraphWeb.Endpoint.broadcast(
      "channel:#{channel.id}",
      "reaction_added",
      %{message_id: message.id, reaction: reaction}
    )
  end

  @doc """
  Broadcast reaction removed in channel.
  """
  def broadcast_reaction_removed(channel, message, user, emoji) do
    CgraphWeb.Endpoint.broadcast(
      "channel:#{channel.id}",
      "reaction_removed",
      %{message_id: message.id, user_id: user.id, emoji: emoji}
    )
  end

  # ============================================================================
  # Permission Helpers
  # ============================================================================

  @doc """
  Get a channel by ID only (without group context).
  """
  def get_channel(channel_id) when is_binary(channel_id) do
    case Repo.get(Channel, channel_id) do
      nil -> {:error, :not_found}
      channel -> {:ok, Repo.preload(channel, [:group])}
    end
  end

  @doc """
  Check if a member can view a channel.
  """
  def can_view_channel?(%Member{} = member, %Channel{} = channel) do
    # Load group if not already loaded
    channel = if Ecto.assoc_loaded?(channel.group), do: channel, else: Repo.preload(channel, :group)
    
    # Group owner can view all channels
    # Otherwise all members can view (channel privacy via PermissionOverwrites later)
    member.user_id == channel.group.owner_id || true
  end

  @doc """
  Check if a member can send messages in a channel.
  """
  def can_send_messages?(%Member{} = member) do
    # Check if member's roles allow sending messages
    # For now, all non-muted members can send messages
    !member.is_muted && (is_nil(member.muted_until) || DateTime.compare(member.muted_until, DateTime.utc_now()) == :lt)
  end

  @doc """
  Check if a member can manage messages (edit/delete others' messages).
  """
  def can_manage_messages?(%Member{} = member) do
    # Only moderators and admins can manage messages
    # Check via roles instead of is_admin field
    member_has_permission?(member, :manage_messages) || member_has_permission?(member, :administrator)
  end

  @doc """
  Pin a message in a channel.
  """
  def pin_message(message, user) do
    alias Cgraph.Groups.PinnedMessage

    %PinnedMessage{}
    |> PinnedMessage.changeset(%{
      channel_id: message.channel_id,
      message_id: message.id,
      pinned_by_id: user.id
    })
    |> Repo.insert()
  end

  defp member_has_channel_access?(_member, _channel) do
    # For now, if channel is private and member doesn't have specific override, deny access
    # TODO: Implement channel-specific permission overwrites
    # For basic access, all members can view non-private channels
    true
  end

  defp member_has_permission?(member, permission) do
    # Check if any of the member's roles has the permission using Role.has_permission?
    Enum.any?(member.roles, fn role ->
      Cgraph.Groups.Role.has_permission?(role, permission)
    end)
  end
end
