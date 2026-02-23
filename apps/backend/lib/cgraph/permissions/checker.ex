defmodule CGraph.Permissions.Checker do
  @moduledoc """
  Permission checking logic for the CGraph permission system.

  Implements multi-strategy authorization combining:
  - Role-based permission checks
  - Resource ownership checks
  - Resource-specific grant checks
  - Context-based rules (time restrictions, IP whitelists)
  """

  alias CGraph.Permissions.Roles

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type resource :: struct() | {atom(), String.t()}
  @type user :: %{id: String.t(), roles: [Roles.role()]}

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Check if a user can perform an action on a resource.

  ## Examples

      can?(user, :delete, message)
      can?(user, :manage, channel)
      can?(user, :create, :channels)
  """
  @spec can?(user() | String.t(), atom(), resource(), map()) :: boolean()
  def can?(user, action, resource, context \\ %{})

  def can?(%{roles: roles} = user, action, resource, context) when is_list(roles) do
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
  @spec authorize(user() | String.t(), atom(), resource(), map()) :: :ok | {:error, :unauthorized}
  def authorize(user, action, resource, context \\ %{}) do
    if can?(user, action, resource, context) do
      :ok
    else
      {:error, :unauthorized}
    end
  end

  @doc """
  Authorize or raise CGraph.UnauthorizedError.
  """
  @spec authorize!(user() | String.t(), atom(), resource(), map()) :: :ok
  def authorize!(user, action, resource, context \\ %{}) do
    unless can?(user, action, resource, context) do
      raise CGraph.UnauthorizedError,
        message: "User not authorized to #{action} #{inspect(resource)}"
    end

    :ok
  end

  # ---------------------------------------------------------------------------
  # Resource Key (public — used by GenServer in main module)
  # ---------------------------------------------------------------------------

  @doc false
  @spec resource_key(String.t(), {atom(), String.t()} | struct() | atom()) :: {String.t(), atom(), term()}
  def resource_key(user_id, {type, id}) do
    {user_id, type, id}
  end

  def resource_key(user_id, %{__struct__: struct, id: id}) do
    type =
      struct
      |> Module.split()
      |> List.last()
      |> Macro.underscore()
      |> String.to_existing_atom()

    {user_id, type, id}
  end

  def resource_key(user_id, resource_type) when is_atom(resource_type) do
    {user_id, resource_type, :*}
  end

  # ---------------------------------------------------------------------------
  # Permission Checking Logic (private)
  # ---------------------------------------------------------------------------

  defp check_permission(user, action, resource, context) do
    role_allowed = check_role_permission(user, action, resource)
    ownership_allowed = check_ownership(user, action, resource)
    resource_allowed = check_resource_grant(user, action, resource)
    context_allowed = check_context_rules(user, action, resource, context)

    (role_allowed || ownership_allowed || resource_allowed) && context_allowed
  end

  defp check_role_permission(%{roles: roles}, action, resource) do
    permission = action_to_permission(action, resource)

    Enum.any?(roles, fn role ->
      perms = Roles.role_permissions(role)
      :* in perms || permission in perms || wildcard_match?(perms, permission)
    end)
  end

  defp check_ownership(%{id: user_id}, action, resource)
       when action in [:edit, :update, :delete] do
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
    time_allowed =
      case context[:time_restriction] do
        nil ->
          true

        {start_time, end_time} ->
          now = Time.utc_now()
          Time.compare(now, start_time) != :lt && Time.compare(now, end_time) != :gt
      end

    ip_allowed =
      case context[:ip_whitelist] do
        nil -> true
        ips -> context[:ip] in ips
      end

    time_allowed && ip_allowed
  end

  # ---------------------------------------------------------------------------
  # Helpers (private)
  # ---------------------------------------------------------------------------

  defp action_to_permission(action, resource) when is_atom(resource) do
    safe_to_permission_atom(action, resource)
  end

  defp action_to_permission(action, %{__struct__: struct}) do
    type =
      struct
      |> Module.split()
      |> List.last()
      |> Macro.underscore()
      |> String.to_existing_atom()

    safe_to_permission_atom(action, type)
  end

  defp action_to_permission(action, {type, _id}) do
    safe_to_permission_atom(action, type)
  end

  defp action_to_permission(action, _) do
    action
  end

  # Safely construct permission atoms using existing atom registration.
  # Both action and type are already atoms from internal code, so the
  # combined atom is predictable and bounded (Google-style allowlist safety).
  defp safe_to_permission_atom(action, type) do
    "#{action}_#{type}"
    |> String.to_existing_atom()
  rescue
    ArgumentError -> :unknown_permission
  end

  defp wildcard_match?(permissions, permission) do
    perm_str = to_string(permission)

    Enum.any?(permissions, fn p ->
      p_str = to_string(p)

      String.ends_with?(p_str, "*") &&
        String.starts_with?(perm_str, String.trim_trailing(p_str, "*"))
    end)
  end

  defp get_user_permissions(user_id) do
    # Would fetch from database
    {:ok, %{id: user_id, roles: [:member]}}
  end
end
