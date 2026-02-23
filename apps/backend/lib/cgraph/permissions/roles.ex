defmodule CGraph.Permissions.Roles do
  @moduledoc """
  Role definitions and role-based permission lookups for the CGraph permission system.

  Defines the role hierarchy (super_admin > admin > moderator > member > guest)
  and provides functions for checking role membership and resolving permissions.

  ## Role Hierarchy

  | Role | Inherits From | Key Permissions |
  |------|---------------|-----------------|
  | `super_admin` | — | Everything (`*`) |
  | `admin` | `moderator` | manage_users, manage_channels, analytics |
  | `moderator` | `member` | delete_messages, mute/kick users |
  | `member` | `guest` | send_messages, create_channels, upload |
  | `guest` | — | read_messages, view_channels |
  """

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

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type role :: :super_admin | :admin | :moderator | :member | :guest

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Check if user has a specific role (including inherited roles).
  """
  @spec has_role?(map(), role()) :: boolean()
  def has_role?(%{roles: roles}, role) when is_list(roles) do
    role in roles || has_inherited_role?(roles, role)
  end

  def has_role?(_, _), do: false

  @doc """
  Check if user has any of the specified roles.
  """
  @spec has_any_role?(map(), [role()]) :: boolean()
  def has_any_role?(user, roles) when is_list(roles) do
    Enum.any?(roles, &has_role?(user, &1))
  end

  @doc """
  Check if user has all of the specified roles.
  """
  @spec has_all_roles?(map(), [role()]) :: boolean()
  def has_all_roles?(user, roles) when is_list(roles) do
    Enum.all?(roles, &has_role?(user, &1))
  end

  @doc """
  Get all permissions for a role (including inherited).
  """
  @spec role_permissions(role()) :: [atom()]
  def role_permissions(role) do
    case Map.get(@roles, role) do
      nil -> []
      role_def -> expand_permissions(role_def)
    end
  end

  @doc """
  Get all available roles.
  """
  @spec available_roles() :: [role()]
  def available_roles do
    Map.keys(@roles)
  end

  # ---------------------------------------------------------------------------
  # Internal Helpers (public for use by sibling modules)
  # ---------------------------------------------------------------------------

  @doc false
  @spec expand_permissions(map()) :: [atom()]
  def expand_permissions(role_def) do
    direct = role_def.permissions

    inherited =
      Enum.flat_map(role_def.inherits, fn parent_role ->
        case Map.get(@roles, parent_role) do
          nil -> []
          parent_def -> expand_permissions(parent_def)
        end
      end)

    Enum.uniq(direct ++ inherited)
  end

  @doc false
  @spec has_inherited_role?([role()], role()) :: boolean()
  def has_inherited_role?(user_roles, target_role) do
    Enum.any?(user_roles, fn role ->
      case Map.get(@roles, role) do
        nil ->
          false

        role_def ->
          target_role in role_def.inherits ||
            Enum.any?(role_def.inherits, &has_inherited_role?([&1], target_role))
      end
    end)
  end
end
