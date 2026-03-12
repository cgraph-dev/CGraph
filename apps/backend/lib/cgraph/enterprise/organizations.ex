defmodule CGraph.Enterprise.Organizations do
  @moduledoc """
  Enterprise organizations context.

  Manages organization CRUD, membership, settings, and ownership transfer.
  Organizations group users under a shared subscription tier.
  """

  import Ecto.Query, warn: false

  alias CGraph.Enterprise.{Organization, OrgMembership, OrgSettings}
  alias CGraph.Repo

  require Logger

  # ============================================================================
  # Organization CRUD
  # ============================================================================

  @doc "Create a new organization with default settings."
  @spec create_org(binary(), map()) :: {:ok, Organization.t()} | {:error, Ecto.Changeset.t()}
  def create_org(owner_id, attrs) do
    Repo.transaction(fn ->
      org_attrs = Map.put(attrs, "owner_id", owner_id)

      with {:ok, org} <- %Organization{} |> Organization.changeset(org_attrs) |> Repo.insert(),
           {:ok, _settings} <-
             %OrgSettings{} |> OrgSettings.changeset(%{org_id: org.id}) |> Repo.insert(),
           {:ok, _membership} <-
             %OrgMembership{}
             |> OrgMembership.changeset(%{org_id: org.id, user_id: owner_id, role: :owner})
             |> Repo.insert() do
        Repo.preload(org, [:settings, :memberships])
      else
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  @doc "Update an organization."
  @spec update_org(Organization.t(), map()) ::
          {:ok, Organization.t()} | {:error, Ecto.Changeset.t()}
  def update_org(%Organization{} = org, attrs) do
    org
    |> Organization.update_changeset(attrs)
    |> Repo.update()
  end

  @doc "Soft-delete an organization."
  @spec delete_org(Organization.t()) :: {:ok, Organization.t()} | {:error, Ecto.Changeset.t()}
  def delete_org(%Organization{} = org) do
    org
    |> Ecto.Changeset.change(deleted_at: DateTime.utc_now())
    |> Repo.update()
  end

  @doc "Get an organization by ID."
  @spec get_org(binary()) :: {:ok, Organization.t()} | {:error, :not_found}
  def get_org(id) do
    case Repo.get(Organization, id) |> Repo.preload([:settings, :memberships]) do
      nil -> {:error, :not_found}
      %Organization{deleted_at: deleted} when not is_nil(deleted) -> {:error, :not_found}
      org -> {:ok, org}
    end
  end

  @doc "Get an organization by slug."
  @spec get_org_by_slug(String.t()) :: {:ok, Organization.t()} | {:error, :not_found}
  def get_org_by_slug(slug) do
    query =
      from(o in Organization,
        where: o.slug == ^slug and is_nil(o.deleted_at),
        preload: [:settings, :memberships]
      )

    case Repo.one(query) do
      nil -> {:error, :not_found}
      org -> {:ok, org}
    end
  end

  @doc "List all organizations with pagination."
  @spec list_orgs(keyword()) :: {list(), map()}
  def list_orgs(opts \\ []) do
    query =
      from(o in Organization,
        where: is_nil(o.deleted_at),
        preload: [:settings],
        order_by: [desc: o.inserted_at]
      )

    pagination_opts =
      CGraph.Pagination.parse_params(
        Enum.into(opts, %{}),
        sort_field: :inserted_at,
        sort_direction: :desc,
        default_limit: 20
      )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  # ============================================================================
  # Membership Management
  # ============================================================================

  @doc "Add a user to an organization with a role."
  @spec add_member(binary(), binary(), atom()) ::
          {:ok, OrgMembership.t()} | {:error, Ecto.Changeset.t()}
  def add_member(org_id, user_id, role \\ :member) do
    %OrgMembership{}
    |> OrgMembership.changeset(%{org_id: org_id, user_id: user_id, role: role})
    |> Repo.insert()
  end

  @doc "Remove a user from an organization."
  @spec remove_member(binary(), binary()) :: {:ok, OrgMembership.t()} | {:error, :not_found}
  def remove_member(org_id, user_id) do
    query =
      from(m in OrgMembership,
        where: m.org_id == ^org_id and m.user_id == ^user_id
      )

    case Repo.one(query) do
      nil -> {:error, :not_found}
      membership -> Repo.delete(membership)
    end
  end

  @doc "List members of an organization with cursor pagination."
  @spec list_members(binary(), keyword()) :: {list(), map()}
  def list_members(org_id, opts \\ []) do
    query =
      from(m in OrgMembership,
        where: m.org_id == ^org_id,
        preload: [:user],
        order_by: [asc: m.joined_at]
      )

    pagination_opts =
      CGraph.Pagination.parse_params(
        Enum.into(opts, %{}),
        sort_field: :joined_at,
        sort_direction: :asc,
        default_limit: 50
      )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Transfer organization ownership to a new user."
  @spec transfer_ownership(Organization.t(), binary(), binary()) ::
          {:ok, Organization.t()} | {:error, atom()}
  def transfer_ownership(%Organization{} = org, current_owner_id, new_owner_id) do
    if org.owner_id != current_owner_id do
      {:error, :unauthorized}
    else
      Repo.transaction(fn ->
        # Update old owner membership to admin
        from(m in OrgMembership,
          where: m.org_id == ^org.id and m.user_id == ^current_owner_id
        )
        |> Repo.one()
        |> case do
          nil -> :ok
          membership -> membership |> Ecto.Changeset.change(role: :admin) |> Repo.update!()
        end

        # Update new owner membership to owner (or create if not member)
        case Repo.one(
               from(m in OrgMembership,
                 where: m.org_id == ^org.id and m.user_id == ^new_owner_id
               )
             ) do
          nil ->
            %OrgMembership{}
            |> OrgMembership.changeset(%{org_id: org.id, user_id: new_owner_id, role: :owner})
            |> Repo.insert!()

          membership ->
            membership |> Ecto.Changeset.change(role: :owner) |> Repo.update!()
        end

        # Update org owner
        org
        |> Organization.transfer_ownership_changeset(new_owner_id)
        |> Repo.update!()
      end)
    end
  end

  # ============================================================================
  # Settings
  # ============================================================================

  @doc "Update organization settings."
  @spec update_settings(binary(), map()) ::
          {:ok, OrgSettings.t()} | {:error, Ecto.Changeset.t() | :not_found}
  def update_settings(org_id, attrs) do
    case Repo.get_by(OrgSettings, org_id: org_id) do
      nil ->
        {:error, :not_found}

      settings ->
        settings
        |> OrgSettings.changeset(attrs)
        |> Repo.update()
    end
  end
end
