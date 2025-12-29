defmodule Cgraph.Permissions do
  @moduledoc """
  Fine-grained permission system with role-based and resource-level access control.
  
  ## Overview
  
  Provides flexible authorization with multiple strategies:
  
  - **Role-Based (RBAC)**: Assign permissions via roles
  - **Resource-Based**: Per-resource permissions
  - **Attribute-Based (ABAC)**: Dynamic permissions based on context
  - **Hierarchical**: Permission inheritance
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                   PERMISSION SYSTEM                             │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  User ──► Roles ──► Permissions ──► Resources                   │
  │            │             │              │                        │
  │     ┌──────▼──────┐ ┌────▼────┐   ┌─────▼─────┐                │
  │     │ admin       │ │ create  │   │ message   │                │
  │     │ moderator   │ │ read    │   │ channel   │                │
  │     │ member      │ │ update  │   │ user      │                │
  │     │ guest       │ │ delete  │   │ file      │                │
  │     └─────────────┘ └─────────┘   └───────────┘                │
  │                                                                  │
  │  ┌───────────────────────────────────────────────────────────┐ │
  │  │                   Permission Check                         │ │
  │  │  can?(user, :delete, message) -> true/false               │ │
  │  │                                                            │ │
  │  │  1. Check user roles                                       │ │
  │  │  2. Check resource ownership                               │ │
  │  │  3. Check resource-specific permissions                    │ │
  │  │  4. Apply context rules (time, location, etc.)            │ │
  │  └───────────────────────────────────────────────────────────┘ │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Check permission
      if Permissions.can?(user, :delete, message) do
        delete_message(message)
      end
      
      # With plug
      plug Permissions.Plug, permission: :manage_users
      
      # Role-based
      Permissions.has_role?(user, :admin)
      
      # Grant/revoke
      Permissions.grant(user, :moderate, channel)
      Permissions.revoke(user, :moderate, channel)
  
  ## Default Roles
  
  | Role | Description | Key Permissions |
  |------|-------------|-----------------|
  | `admin` | Full access | Everything |
  | `moderator` | Content moderation | Delete messages, ban users |
  | `member` | Standard user | Send messages, create channels |
  | `guest` | Limited access | Read only |
  
  ## Permission Format
  
  Permissions follow the format: `action:resource` or `action:resource:scope`
  
  Examples:
  - `read:messages`
  - `create:channels`
  - `delete:messages:own`
  - `manage:users`
  """
  
  use GenServer
  require Logger
  
  # ---------------------------------------------------------------------------
  # Role Definitions
  # ---------------------------------------------------------------------------
  
  @roles %{
    super_admin: %{
      name: "Super Admin",
      permissions: [:*],
      inherits: []
    },
    admin: %{
      name: "Admin",
      permissions: [
        :manage_users, :manage_channels, :manage_settings,
        :view_analytics, :view_audit_log, :export_data
      ],
      inherits: [:moderator]
    },
    moderator: %{
      name: "Moderator",
      permissions: [
        :delete_messages, :mute_users, :kick_users,
        :pin_messages, :slow_mode
      ],
      inherits: [:member]
    },
    member: %{
      name: "Member",
      permissions: [
        :send_messages, :edit_own_messages, :delete_own_messages,
        :create_channels, :join_channels, :upload_files,
        :add_reactions, :mention_users, :use_custom_emoji
      ],
      inherits: [:guest]
    },
    guest: %{
      name: "Guest",
      permissions: [
        :read_messages, :view_channels, :view_profiles
      ],
      inherits: []
    }
  }
  
  # Available resource types: message, channel, user, file, reaction, invitation
  # Available actions: create, read, update, delete, manage, moderate
  
  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------
  
  @type role :: :super_admin | :admin | :moderator | :member | :guest
  @type permission :: atom()
  @type resource :: struct() | {atom(), String.t()}
  @type user :: %{id: String.t(), roles: [role()]}
  
  # ---------------------------------------------------------------------------
  # Client API - Permission Checks
  # ---------------------------------------------------------------------------
  
  @doc """
  Check if a user can perform an action on a resource.
  
  ## Examples
  
      can?(user, :delete, message)
      can?(user, :manage, channel)
      can?(user, :create, :channels)
  """
  def can?(user, action, resource, context \\ %{})
  
  def can?(%{roles: roles} = user, action, resource, context) when is_list(roles) do
    # Super admin can do anything
    if :super_admin in roles do
      true
    else
      check_permission(user, action, resource, context)
    end
  end
  
  def can?(user_id, action, resource, context) when is_binary(user_id) do
    case get_user_permissions(user_id) do
      {:ok, user} -> can?(user, action, resource, context)
      _ -> false
    end
  end
  
  @doc """
  Authorize an action, returning :ok or {:error, :unauthorized}.
  
  Useful in pipelines.
  """
  def authorize(user, action, resource, context \\ %{}) do
    if can?(user, action, resource, context) do
      :ok
    else
      {:error, :unauthorized}
    end
  end
  
  @doc """
  Authorize or raise an exception.
  """
  def authorize!(user, action, resource, context \\ %{}) do
    unless can?(user, action, resource, context) do
      raise Cgraph.UnauthorizedError, 
        message: "User not authorized to #{action} #{inspect(resource)}"
    end
    
    :ok
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Role Checks
  # ---------------------------------------------------------------------------
  
  @doc """
  Check if user has a specific role.
  """
  def has_role?(%{roles: roles}, role) when is_list(roles) do
    role in roles || has_inherited_role?(roles, role)
  end
  
  def has_role?(_, _), do: false
  
  @doc """
  Check if user has any of the specified roles.
  """
  def has_any_role?(user, roles) when is_list(roles) do
    Enum.any?(roles, &has_role?(user, &1))
  end
  
  @doc """
  Check if user has all of the specified roles.
  """
  def has_all_roles?(user, roles) when is_list(roles) do
    Enum.all?(roles, &has_role?(user, &1))
  end
  
  @doc """
  Get all permissions for a role (including inherited).
  """
  def role_permissions(role) do
    case Map.get(@roles, role) do
      nil -> []
      role_def -> expand_permissions(role_def)
    end
  end
  
  @doc """
  Get all available roles.
  """
  def available_roles do
    Map.keys(@roles)
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Permission Grants
  # ---------------------------------------------------------------------------
  
  @doc """
  Grant a permission to a user for a resource.
  """
  def grant(user_id, permission, resource) do
    GenServer.call(__MODULE__, {:grant, user_id, permission, resource})
  end
  
  @doc """
  Revoke a permission from a user for a resource.
  """
  def revoke(user_id, permission, resource) do
    GenServer.call(__MODULE__, {:revoke, user_id, permission, resource})
  end
  
  @doc """
  Get resource-specific permissions for a user.
  """
  def resource_permissions(user_id, resource) do
    GenServer.call(__MODULE__, {:resource_permissions, user_id, resource})
  end
  
  @doc """
  Assign a role to a user.
  """
  def assign_role(user_id, role) when role in [:super_admin, :admin, :moderator, :member, :guest] do
    GenServer.call(__MODULE__, {:assign_role, user_id, role})
  end
  
  @doc """
  Remove a role from a user.
  """
  def remove_role(user_id, role) do
    GenServer.call(__MODULE__, {:remove_role, user_id, role})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Channel/Resource Roles
  # ---------------------------------------------------------------------------
  
  @doc """
  Get user's role in a specific channel.
  """
  def channel_role(user_id, channel_id) do
    GenServer.call(__MODULE__, {:channel_role, user_id, channel_id})
  end
  
  @doc """
  Set user's role in a channel.
  """
  def set_channel_role(user_id, channel_id, role) do
    GenServer.call(__MODULE__, {:set_channel_role, user_id, channel_id, role})
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    state = %{
      # user_id => [roles]
      user_roles: %{},
      # {user_id, resource_type, resource_id} => [permissions]
      resource_permissions: %{},
      # {user_id, channel_id} => role
      channel_roles: %{}
    }
    
    {:ok, state}
  end
  
  @impl true
  def handle_call({:grant, user_id, permission, resource}, _from, state) do
    key = resource_key(user_id, resource)
    current = Map.get(state.resource_permissions, key, [])
    
    if permission in current do
      {:reply, {:ok, :already_granted}, state}
    else
      new_perms = Map.put(state.resource_permissions, key, [permission | current])
      Logger.info("Granted #{permission} to #{user_id} on #{inspect(key)}")
      {:reply, :ok, %{state | resource_permissions: new_perms}}
    end
  end
  
  @impl true
  def handle_call({:revoke, user_id, permission, resource}, _from, state) do
    key = resource_key(user_id, resource)
    current = Map.get(state.resource_permissions, key, [])
    new_list = List.delete(current, permission)
    new_perms = Map.put(state.resource_permissions, key, new_list)
    
    {:reply, :ok, %{state | resource_permissions: new_perms}}
  end
  
  @impl true
  def handle_call({:resource_permissions, user_id, resource}, _from, state) do
    key = resource_key(user_id, resource)
    permissions = Map.get(state.resource_permissions, key, [])
    {:reply, {:ok, permissions}, state}
  end
  
  @impl true
  def handle_call({:assign_role, user_id, role}, _from, state) do
    current = Map.get(state.user_roles, user_id, [:member])
    
    if role in current do
      {:reply, {:ok, :already_assigned}, state}
    else
      new_roles = Map.put(state.user_roles, user_id, [role | current])
      Logger.info("Assigned role #{role} to #{user_id}")
      {:reply, :ok, %{state | user_roles: new_roles}}
    end
  end
  
  @impl true
  def handle_call({:remove_role, user_id, role}, _from, state) do
    current = Map.get(state.user_roles, user_id, [])
    new_list = List.delete(current, role)
    # Ensure at least guest role
    new_list = if Enum.empty?(new_list), do: [:guest], else: new_list
    new_roles = Map.put(state.user_roles, user_id, new_list)
    
    {:reply, :ok, %{state | user_roles: new_roles}}
  end
  
  @impl true
  def handle_call({:channel_role, user_id, channel_id}, _from, state) do
    key = {user_id, channel_id}
    role = Map.get(state.channel_roles, key, :member)
    {:reply, {:ok, role}, state}
  end
  
  @impl true
  def handle_call({:set_channel_role, user_id, channel_id, role}, _from, state) do
    key = {user_id, channel_id}
    new_channel_roles = Map.put(state.channel_roles, key, role)
    {:reply, :ok, %{state | channel_roles: new_channel_roles}}
  end
  
  # ---------------------------------------------------------------------------
  # Permission Checking Logic
  # ---------------------------------------------------------------------------
  
  defp check_permission(user, action, resource, context) do
    # 1. Check role-based permissions
    role_allowed = check_role_permission(user, action, resource)
    
    # 2. Check resource ownership
    ownership_allowed = check_ownership(user, action, resource)
    
    # 3. Check resource-specific grants
    resource_allowed = check_resource_grant(user, action, resource)
    
    # 4. Apply context rules
    context_allowed = check_context_rules(user, action, resource, context)
    
    (role_allowed || ownership_allowed || resource_allowed) && context_allowed
  end
  
  defp check_role_permission(%{roles: roles}, action, resource) do
    permission = action_to_permission(action, resource)
    
    Enum.any?(roles, fn role ->
      perms = role_permissions(role)
      :* in perms || permission in perms || wildcard_match?(perms, permission)
    end)
  end
  
  defp check_ownership(%{id: user_id}, action, resource) when action in [:edit, :update, :delete] do
    # Check if user owns the resource
    case resource do
      %{user_id: ^user_id} -> true
      %{sender_id: ^user_id} -> true
      %{author_id: ^user_id} -> true
      %{creator_id: ^user_id} -> true
      _ -> false
    end
  end
  
  defp check_ownership(_, _, _), do: false
  
  defp check_resource_grant(%{id: _user_id}, _action, _resource) do
    # Would check stored resource permissions
    # For now, just return false (let role-based handle it)
    false
  end
  
  defp check_context_rules(_user, _action, _resource, context) do
    # Time-based restrictions
    time_allowed = case context[:time_restriction] do
      nil -> true
      {start_time, end_time} ->
        now = Time.utc_now()
        Time.compare(now, start_time) != :lt && Time.compare(now, end_time) != :gt
    end
    
    # IP-based restrictions
    ip_allowed = case context[:ip_whitelist] do
      nil -> true
      ips -> context[:ip] in ips
    end
    
    time_allowed && ip_allowed
  end
  
  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------
  
  defp expand_permissions(role_def) do
    # Get direct permissions
    direct = role_def.permissions
    
    # Get inherited permissions
    inherited = Enum.flat_map(role_def.inherits, fn parent_role ->
      case Map.get(@roles, parent_role) do
        nil -> []
        parent_def -> expand_permissions(parent_def)
      end
    end)
    
    Enum.uniq(direct ++ inherited)
  end
  
  defp has_inherited_role?(user_roles, target_role) do
    Enum.any?(user_roles, fn role ->
      case Map.get(@roles, role) do
        nil -> false
        role_def -> target_role in role_def.inherits || 
                    Enum.any?(role_def.inherits, &has_inherited_role?([&1], target_role))
      end
    end)
  end
  
  defp action_to_permission(action, resource) when is_atom(resource) do
    # Simple resource type
    :"#{action}_#{resource}"
  end
  
  defp action_to_permission(action, %{__struct__: struct}) do
    # Struct - extract type from module name
    type = struct
    |> Module.split()
    |> List.last()
    |> Macro.underscore()
    |> String.to_atom()
    
    :"#{action}_#{type}"
  end
  
  defp action_to_permission(action, {type, _id}) do
    :"#{action}_#{type}"
  end
  
  defp action_to_permission(action, _) do
    action
  end
  
  defp wildcard_match?(permissions, permission) do
    perm_str = to_string(permission)
    
    Enum.any?(permissions, fn p ->
      p_str = to_string(p)
      String.ends_with?(p_str, "*") && 
      String.starts_with?(perm_str, String.trim_trailing(p_str, "*"))
    end)
  end
  
  defp resource_key(user_id, {type, id}) do
    {user_id, type, id}
  end
  
  defp resource_key(user_id, %{__struct__: struct, id: id}) do
    type = struct |> Module.split() |> List.last() |> Macro.underscore() |> String.to_atom()
    {user_id, type, id}
  end
  
  defp resource_key(user_id, resource_type) when is_atom(resource_type) do
    {user_id, resource_type, :*}
  end
  
  defp get_user_permissions(user_id) do
    # Would fetch from database
    {:ok, %{id: user_id, roles: [:member]}}
  end
end

defmodule Cgraph.UnauthorizedError do
  @moduledoc """
  Raised when a user is not authorized to perform an action.
  """
  defexception [:message]
  
  @impl true
  def exception(opts) do
    message = Keyword.get(opts, :message, "Unauthorized")
    %__MODULE__{message: message}
  end
end
