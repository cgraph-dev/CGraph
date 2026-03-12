defmodule CGraph.Enterprise.AdminConsole.Admins do
  @moduledoc """
  Admin user and role management operations.
  """

  import Ecto.Query, warn: false

  alias CGraph.Enterprise.{AdminUser, AdminRole}
  alias CGraph.Repo

  @doc "List admin users with optional pagination."
  @spec list_admin_users(keyword()) :: {list(), map()}
  def list_admin_users(opts \\ []) do
    query =
      from(a in AdminUser,
        preload: [:role],
        order_by: [desc: a.inserted_at]
      )

    pagination_opts =
      CGraph.Pagination.parse_params(
        Enum.into(opts, %{}),
        sort_field: :inserted_at,
        sort_direction: :desc,
        default_limit: 50
      )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Get a single admin user by ID."
  @spec get_admin_user(binary()) :: {:ok, AdminUser.t()} | {:error, :not_found}
  def get_admin_user(id) do
    case Repo.get(AdminUser, id) |> Repo.preload(:role) do
      nil -> {:error, :not_found}
      admin -> {:ok, admin}
    end
  end

  @doc "Get admin user by linked user ID."
  @spec get_admin_user_by_user_id(binary()) :: AdminUser.t() | nil
  def get_admin_user_by_user_id(user_id) do
    Repo.get_by(AdminUser, user_id: user_id) |> Repo.preload(:role)
  end

  @doc "Create a new admin user."
  @spec create_admin_user(map()) :: {:ok, AdminUser.t()} | {:error, Ecto.Changeset.t()}
  def create_admin_user(attrs) do
    %AdminUser{}
    |> AdminUser.changeset(attrs)
    |> Repo.insert()
  end

  @doc "Update an admin user."
  @spec update_admin_user(AdminUser.t(), map()) :: {:ok, AdminUser.t()} | {:error, Ecto.Changeset.t()}
  def update_admin_user(%AdminUser{} = admin_user, attrs) do
    admin_user
    |> AdminUser.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete an admin user."
  @spec delete_admin_user(AdminUser.t()) :: {:ok, AdminUser.t()} | {:error, Ecto.Changeset.t()}
  def delete_admin_user(%AdminUser{} = admin_user) do
    Repo.delete(admin_user)
  end

  @doc "Record an admin login."
  @spec record_login(AdminUser.t()) :: {:ok, AdminUser.t()} | {:error, Ecto.Changeset.t()}
  def record_login(%AdminUser{} = admin_user) do
    admin_user
    |> AdminUser.login_changeset()
    |> Repo.update()
  end

  # ============================================================================
  # Roles
  # ============================================================================

  @doc "List all admin roles."
  @spec list_roles() :: list(AdminRole.t())
  def list_roles do
    Repo.all(from(r in AdminRole, order_by: r.name))
  end

  @doc "Get a role by ID."
  @spec get_role(binary()) :: {:ok, AdminRole.t()} | {:error, :not_found}
  def get_role(id) do
    case Repo.get(AdminRole, id) do
      nil -> {:error, :not_found}
      role -> {:ok, role}
    end
  end

  @doc "Create a new admin role."
  @spec create_role(map()) :: {:ok, AdminRole.t()} | {:error, Ecto.Changeset.t()}
  def create_role(attrs) do
    %AdminRole{}
    |> AdminRole.changeset(attrs)
    |> Repo.insert()
  end

  # ============================================================================
  # Platform Stats
  # ============================================================================

  @doc "Get platform-wide statistics."
  @spec platform_stats() :: map()
  def platform_stats do
    %{
      admin_count: Repo.aggregate(AdminUser, :count),
      role_count: Repo.aggregate(AdminRole, :count)
    }
  end
end
