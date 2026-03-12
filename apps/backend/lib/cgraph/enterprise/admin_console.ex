defmodule CGraph.Enterprise.AdminConsole do
  @moduledoc """
  Enterprise admin console context.

  Thin facade delegating to sub-modules for admin user management,
  audit logging, and platform statistics.
  """

  alias CGraph.Enterprise.AdminConsole.{Admins, Auditing}

  # Admin user management
  defdelegate list_admin_users(opts \\ []), to: Admins
  defdelegate get_admin_user(id), to: Admins
  defdelegate get_admin_user_by_user_id(user_id), to: Admins
  defdelegate create_admin_user(attrs), to: Admins
  defdelegate update_admin_user(admin_user, attrs), to: Admins
  defdelegate delete_admin_user(admin_user), to: Admins
  defdelegate record_login(admin_user), to: Admins

  # Role management
  defdelegate list_roles(), to: Admins
  defdelegate get_role(id), to: Admins
  defdelegate create_role(attrs), to: Admins

  # Enterprise audit logging
  defdelegate log_action(admin, action, resource_type, attrs), to: Auditing
  defdelegate list_audit_entries(opts \\ []), to: Auditing
  defdelegate get_audit_entry(id), to: Auditing
  defdelegate export_audit_entries(opts), to: Auditing

  # Platform statistics
  defdelegate platform_stats(), to: Admins
end
