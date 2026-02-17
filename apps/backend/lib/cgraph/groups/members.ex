defmodule CGraph.Groups.Members do
  @moduledoc """
  Member operations for groups.

  Handles member CRUD, muting, role assignment, hierarchy comparison, and bans.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.{GroupBan, Member}
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
    query = from(m in Member,
      where: m.id == ^member_id,
      where: m.group_id == ^group.id,
      preload: [:user, :roles]
    )

    case Repo.one(query) do
      nil -> {:error, :not_found}
      member -> {:ok, member}
    end
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
  def mute_member(member, duration_or_until) do
    muted_until = case duration_or_until do
      seconds when is_integer(seconds) ->
        DateTime.utc_now()
        |> DateTime.add(seconds, :second)
        |> DateTime.truncate(:second)
      %DateTime{} = dt -> dt
    end

    member
    |> Ecto.Changeset.change(is_muted: true, muted_until: muted_until)
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

  @doc "Ban a member from a group. Removes membership and creates a ban record."
  @spec ban_member(struct(), struct(), binary() | nil) :: {:ok, map()} | {:error, any()}
  def ban_member(group, user, reason \\ nil) do
    member = get_member_by_user(group, user.id)

    Repo.transaction(fn ->
      # Remove membership if exists
      if member, do: Repo.delete(member)

      # Create ban record
      ban_attrs = %{
        user_id: user.id,
        group_id: group.id,
        reason: reason
      }

      case %GroupBan{}
           |> GroupBan.changeset(ban_attrs)
           |> Repo.insert(on_conflict: :replace_all, conflict_target: [:user_id, :group_id]) do
        {:ok, ban} -> ban
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  @doc "Ban a member with the banning moderator tracked."
  @spec ban_member(struct(), struct(), binary() | nil, binary()) :: {:ok, map()} | {:error, any()}
  def ban_member(group, user, reason, banned_by_id) do
    member = get_member_by_user(group, user.id)

    Repo.transaction(fn ->
      if member, do: Repo.delete(member)

      ban_attrs = %{
        user_id: user.id,
        group_id: group.id,
        reason: reason,
        banned_by_id: banned_by_id
      }

      case %GroupBan{}
           |> GroupBan.changeset(ban_attrs)
           |> Repo.insert(on_conflict: :replace_all, conflict_target: [:user_id, :group_id]) do
        {:ok, ban} -> ban
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  @doc "Unban a user from a group."
  @spec unban_user(struct(), binary()) :: {:ok, :unbanned} | {:error, :not_found}
  def unban_user(group, user_id) do
    case Repo.get_by(GroupBan, user_id: user_id, group_id: group.id) do
      nil -> {:error, :not_found}
      ban ->
        Repo.delete(ban)
        {:ok, :unbanned}
    end
  end

  @doc "List banned users in a group (active bans only)."
  @spec list_bans(struct()) :: list()
  def list_bans(group) do
    from(b in GroupBan,
      where: b.group_id == ^group.id,
      where: is_nil(b.expires_at) or b.expires_at > ^DateTime.utc_now(),
      preload: [:user, :banned_by],
      order_by: [desc: b.inserted_at]
    )
    |> Repo.all()
  end

  @doc "Get a specific ban record for a user in a group."
  @spec get_ban(struct(), binary()) :: map() | nil
  def get_ban(group, user_id) do
    from(b in GroupBan,
      where: b.group_id == ^group.id,
      where: b.user_id == ^user_id,
      where: is_nil(b.expires_at) or b.expires_at > ^DateTime.utc_now(),
      preload: [:user, :banned_by]
    )
    |> Repo.one()
  end

  @doc "Check if a user is currently banned from a group."
  @spec banned?(struct(), binary()) :: boolean()
  def banned?(group, user_id) do
    get_ban(group, user_id) != nil
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
