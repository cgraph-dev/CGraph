defmodule CGraph.Groups.Members do
  @moduledoc """
  Member operations for groups.

  Handles member CRUD, muting, role assignment, hierarchy comparison, and bans.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.Member
  alias CGraph.Repo

  # ============================================================================
  # Member CRUD
  # ============================================================================

  @doc "List members of a group with optional role filter and pagination."
  @spec list_group_members(struct(), keyword()) :: {list(), map()}
  def list_group_members(group, opts \\ []) do
    role_filter = Keyword.get(opts, :role)

    query = from m in Member,
      where: m.group_id == ^group.id,
      preload: [:user, :roles]

    query = if role_filter do
      from m in query,
        join: r in assoc(m, :roles),
        where: r.name == ^role_filter
    else
      query
    end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :asc,
      default_limit: 50
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Get a member by group and member ID."
  @spec get_member(struct(), binary()) :: Member.t() | nil
  def get_member(group, member_id) do
    from(m in Member,
      where: m.id == ^member_id,
      where: m.group_id == ^group.id,
      preload: [:user, :roles]
    )
    |> Repo.one()
  end

  @doc "Get a member by group and user ID."
  @spec get_member_by_user(struct(), binary()) :: Member.t() | nil
  def get_member_by_user(group, user_id) do
    from(m in Member,
      where: m.group_id == ^group.id,
      where: m.user_id == ^user_id,
      preload: [:user, :roles]
    )
    |> Repo.one()
  end

  @doc "Add a user to a group as a member with optional role IDs."
  @spec add_member(struct(), struct(), list()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def add_member(group, user, role_ids \\ []) do
    member_attrs = %{
      group_id: group.id,
      user_id: user.id
    }

    case %Member{} |> Member.changeset(member_attrs) |> Repo.insert() do
      {:ok, member} ->
        if role_ids != [] do
          alias CGraph.Groups.Role
          roles = Repo.all(from r in Role, where: r.id in ^role_ids)
          member
          |> Repo.preload(:roles)
          |> Ecto.Changeset.change()
          |> Ecto.Changeset.put_assoc(:roles, roles)
          |> Repo.update()
        else
          {:ok, Repo.preload(member, [:user, :roles])}
        end

      error -> error
    end
  end

  @doc "Update a member."
  @spec update_member(Member.t(), map()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def update_member(member, attrs) do
    member
    |> Member.changeset(attrs)
    |> Repo.update()
  end

  @doc "Update member notification settings."
  @spec update_member_notifications(Member.t(), map()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def update_member_notifications(member, attrs) do
    member
    |> Member.changeset(attrs)
    |> Repo.update()
  end

  @doc "Update member role assignments."
  @spec update_member_roles(Member.t(), list()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def update_member_roles(member, role_ids) do
    alias CGraph.Groups.Role
    roles = Repo.all(from r in Role, where: r.id in ^role_ids)

    member
    |> Repo.preload(:roles)
    |> Ecto.Changeset.change()
    |> Ecto.Changeset.put_assoc(:roles, roles)
    |> Repo.update()
  end

  @doc "Remove a member from a group."
  @spec remove_member(Member.t()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def remove_member(member) do
    Repo.delete!(member)
    {:ok, member}
  end

  # ============================================================================
  # Muting
  # ============================================================================

  @doc "Mute a member until a specified time."
  @spec mute_member(Member.t(), DateTime.t()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def mute_member(member, until) do
    member
    |> Ecto.Changeset.change(is_muted: true, muted_until: until)
    |> Repo.update()
  end

  @doc "Unmute a member."
  @spec unmute_member(Member.t()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def unmute_member(member) do
    member
    |> Ecto.Changeset.change(is_muted: false, muted_until: nil)
    |> Repo.update()
  end

  # ============================================================================
  # Hierarchy
  # ============================================================================

  @doc "Compare hierarchy of two members. Returns :higher, :lower, or :equal."
  @spec compare_hierarchy(Member.t(), Member.t()) :: :higher | :lower | :equal
  def compare_hierarchy(member_a, member_b) do
    pos_a = get_highest_role_position(member_a)
    pos_b = get_highest_role_position(member_b)

    cond do
      pos_a > pos_b -> :higher
      pos_a < pos_b -> :lower
      true -> :equal
    end
  end

  # ============================================================================
  # Bans
  # ============================================================================

  @doc "Ban a member from a group."
  @spec ban_member(struct(), struct(), binary() | nil) :: {:ok, map()} | {:error, any()}
  def ban_member(group, user, reason \\ nil) do
    member = get_member_by_user(group, user.id)

    if member do
      Repo.delete(member)

      {:ok, %{
        group_id: group.id,
        user_id: user.id,
        reason: reason,
        banned_at: DateTime.truncate(DateTime.utc_now(), :second)
      }}
    else
      {:error, :not_found}
    end
  end

  @doc "Unban a user from a group."
  @spec unban_user(struct(), binary()) :: {:ok, :unbanned}
  def unban_user(_group, _user_id) do
    # TODO: Implement ban table lookup and removal
    {:ok, :unbanned}
  end

  @doc "List banned users in a group."
  @spec list_bans(struct()) :: list()
  def list_bans(_group) do
    # TODO: Implement ban table query
    []
  end

  @doc "Get a specific ban."
  @spec get_ban(struct(), binary()) :: map() | nil
  def get_ban(_group, _user_id) do
    # TODO: Implement ban table lookup
    nil
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp get_highest_role_position(member) do
    case member.roles do
      [] -> 0
      roles -> Enum.max_by(roles, & &1.position).position
    end
  end
end
