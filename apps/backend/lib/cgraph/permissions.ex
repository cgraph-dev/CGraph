defmodule CGraph.Permissions do
  @moduledoc """
  Fine-grained permission system with role-based and resource-level access control.

  Provides flexible authorization with multiple strategies:

  - **Role-Based (RBAC)**: Assign permissions via roles
  - **Resource-Based**: Per-resource permissions
  - **Attribute-Based (ABAC)**: Dynamic permissions based on context
  - **Hierarchical**: Permission inheritance

  ## Usage

      # Check permission
      if Permissions.can?(user, :delete, message) do
        delete_message(message)
      end

      # Role-based
      Permissions.has_role?(user, :admin)

      # Grant/revoke
      Permissions.grant(user, :moderate, channel)
      Permissions.revoke(user, :moderate, channel)

  See `CGraph.Permissions.Roles` for role definitions and
  `CGraph.Permissions.Checker` for authorization logic.
  """

  use GenServer
  require Logger

  alias CGraph.Permissions.{Checker, Roles}

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type role :: Roles.role()
  @type permission :: atom()
  @type resource :: Checker.resource()
  @type user :: Checker.user()

  # ---------------------------------------------------------------------------
  # Permission Checks (delegated to Checker)
  # ---------------------------------------------------------------------------

  @doc "Check if a user can perform an action on a resource."
  @spec can?(user(), permission(), resource(), map()) :: boolean()
  def can?(user, action, resource, context \\ %{}),
    do: Checker.can?(user, action, resource, context)

  @doc "Authorize an action, returning :ok or {:error, :unauthorized}."
  @spec authorize(user(), permission(), resource(), map()) :: :ok | {:error, :unauthorized}
  def authorize(user, action, resource, context \\ %{}),
    do: Checker.authorize(user, action, resource, context)

  @doc "Authorize or raise an exception."
  @spec authorize!(user(), permission(), resource(), map()) :: :ok | no_return()
  def authorize!(user, action, resource, context \\ %{}),
    do: Checker.authorize!(user, action, resource, context)

  # ---------------------------------------------------------------------------
  # Role Checks (delegated to Roles)
  # ---------------------------------------------------------------------------

  defdelegate has_role?(user, role), to: Roles
  defdelegate has_any_role?(user, roles), to: Roles
  defdelegate has_all_roles?(user, roles), to: Roles
  defdelegate role_permissions(role), to: Roles
  defdelegate available_roles(), to: Roles

  # ---------------------------------------------------------------------------
  # Client API - Permission Grants
  # ---------------------------------------------------------------------------

  @doc "Grant a permission to a user for a resource."
  @spec grant(String.t(), permission(), resource()) :: :ok | {:ok, :already_granted}
  def grant(user_id, permission, resource) do
    GenServer.call(__MODULE__, {:grant, user_id, permission, resource})
  end

  @doc "Revoke a permission from a user for a resource."
  @spec revoke(String.t(), permission(), resource()) :: :ok
  def revoke(user_id, permission, resource) do
    GenServer.call(__MODULE__, {:revoke, user_id, permission, resource})
  end

  @doc "Get resource-specific permissions for a user."
  @spec resource_permissions(String.t(), resource()) :: {:ok, [permission()]}
  def resource_permissions(user_id, resource) do
    GenServer.call(__MODULE__, {:resource_permissions, user_id, resource})
  end

  @doc "Assign a role to a user."
  @spec assign_role(String.t(), role()) :: :ok | {:ok, :already_assigned}
  def assign_role(user_id, role)
      when role in [:super_admin, :admin, :moderator, :member, :guest] do
    GenServer.call(__MODULE__, {:assign_role, user_id, role})
  end

  @doc "Remove a role from a user."
  @spec remove_role(String.t(), role()) :: :ok
  def remove_role(user_id, role) do
    GenServer.call(__MODULE__, {:remove_role, user_id, role})
  end

  # ---------------------------------------------------------------------------
  # Client API - Channel/Resource Roles
  # ---------------------------------------------------------------------------

  @doc "Get user's role in a specific channel."
  @spec channel_role(String.t(), String.t()) :: {:ok, role()}
  def channel_role(user_id, channel_id) do
    GenServer.call(__MODULE__, {:channel_role, user_id, channel_id})
  end

  @doc "Set user's role in a channel."
  @spec set_channel_role(String.t(), String.t(), role()) :: :ok
  def set_channel_role(user_id, channel_id, role) do
    GenServer.call(__MODULE__, {:set_channel_role, user_id, channel_id, role})
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @spec init(keyword()) :: {:ok, map()}
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

  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call({:grant, user_id, permission, resource}, _from, state) do
    key = Checker.resource_key(user_id, resource)
    current = Map.get(state.resource_permissions, key, [])

    if permission in current do
      {:reply, {:ok, :already_granted}, state}
    else
      new_perms = Map.put(state.resource_permissions, key, [permission | current])
      Logger.info("granted_to_on", permission: permission, user_id: user_id, key: inspect(key))
      {:reply, :ok, %{state | resource_permissions: new_perms}}
    end
  end

  @impl true
  def handle_call({:revoke, user_id, permission, resource}, _from, state) do
    key = Checker.resource_key(user_id, resource)
    current = Map.get(state.resource_permissions, key, [])
    new_list = List.delete(current, permission)
    new_perms = Map.put(state.resource_permissions, key, new_list)

    {:reply, :ok, %{state | resource_permissions: new_perms}}
  end

  @impl true
  def handle_call({:resource_permissions, user_id, resource}, _from, state) do
    key = Checker.resource_key(user_id, resource)
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
      Logger.info("assigned_role_to", role: role, user_id: user_id)
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
end

defmodule CGraph.UnauthorizedError do
  @moduledoc """
  Raised when a user is not authorized to perform an action.
  """
  defexception [:message]

  @spec exception(keyword()) :: Exception.t()
  @impl true
  def exception(opts) do
    message = Keyword.get(opts, :message, "Unauthorized")
    %__MODULE__{message: message}
  end
end
