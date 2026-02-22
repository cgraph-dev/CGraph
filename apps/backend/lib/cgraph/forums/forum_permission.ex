defmodule CGraph.Forums.ForumPermission do
  @moduledoc """
  ForumPermission schema for forum-level permission overrides.

  Works with the forum hierarchy system to provide inheritance:
  - Child forums can inherit permissions from parent forums
  - Forum permissions override user group defaults
  - Board permissions can further override forum permissions

  ## Permission Resolution Order
  1. Board-level permission (if checking board access)
  2. Forum-level permission
  3. Parent forum permission (if inherit_permissions is true)
  4. User group default permission
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @permission_values ["inherit", "allow", "deny"]
  @applies_to_values ["group", "guest", "all_members"]

  @derive {Jason.Encoder, only: [
    :id, :forum_id, :user_group_id, :applies_to,
    :can_view, :can_view_boards, :can_create_threads, :can_reply,
    :can_manage_boards, :can_manage_groups, :can_manage_settings
  ]}

  schema "forum_permissions" do
    field :applies_to, :string, default: "group"

    # View permissions
    field :can_view, :string, default: "inherit"
    field :can_view_boards, :string, default: "inherit"

    # Posting permissions
    field :can_create_threads, :string, default: "inherit"
    field :can_reply, :string, default: "inherit"

    # Admin permissions
    field :can_manage_boards, :string, default: "inherit"
    field :can_manage_groups, :string, default: "inherit"
    field :can_manage_settings, :string, default: "inherit"

    belongs_to :forum, CGraph.Forums.Forum
    belongs_to :user_group, CGraph.Forums.ForumUserGroup

    timestamps()
  end

  @doc """
  List of all permission fields.
  """
  @spec permission_fields() :: [atom()]
  def permission_fields do
    [
      :can_view, :can_view_boards, :can_create_threads, :can_reply,
      :can_manage_boards, :can_manage_groups, :can_manage_settings
    ]
  end

  @doc """
  Create or update forum permissions.
  """
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(permission, attrs) do
    permission
    |> cast(attrs, [:forum_id, :user_group_id, :applies_to] ++ permission_fields())
    |> validate_required([:forum_id])
    |> validate_inclusion(:applies_to, @applies_to_values)
    |> validate_permissions()
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:user_group_id)
  end

  defp validate_permissions(changeset) do
    Enum.reduce(permission_fields(), changeset, fn field, cs ->
      validate_inclusion(cs, field, @permission_values)
    end)
  end

  # =============================================================================
  # PERMISSION CHECKING
  # =============================================================================

  @doc """
  Check if a user has a specific permission on a forum.
  Returns true/false.
  """
  @spec can?(atom(), struct() | nil, struct(), module()) :: boolean()
  def can?(permission, user, forum, repo) when is_atom(permission) do
    effective = get_effective_permission(permission, user, forum, repo)
    effective == true
  end

  @doc """
  Get the effective value of a permission for a user on a forum.
  Handles permission inheritance from parent forums.
  """
  @spec get_effective_permission(atom(), struct() | nil, struct(), module()) :: boolean()
  def get_effective_permission(permission, nil, forum, repo) do
    # Anonymous user - check guest permissions
    get_guest_permission(permission, forum, repo)
  end

  def get_effective_permission(permission, user, forum, repo) do
    # Get user's group in this forum
    member = get_forum_member(user.id, forum.id, repo)

    if is_nil(member) do
      # Not a member, check guest permissions
      get_guest_permission(permission, forum, repo)
    else
      check_permission_with_inheritance(permission, forum, member.user_group_id, repo)
    end
  end

  defp check_permission_with_inheritance(permission, forum, group_id, repo) do
    # Check this forum's permission
    forum_perm = get_forum_group_permission(permission, forum.id, group_id, repo)

    case forum_perm do
      "allow" -> true
      "deny" -> false
      _ ->
        # Check if we should inherit from parent
        if forum.inherit_permissions && forum.parent_forum_id do
          parent_forum = repo.get(CGraph.Forums.Forum, forum.parent_forum_id)
          if parent_forum do
            check_permission_with_inheritance(permission, parent_forum, group_id, repo)
          else
            get_group_default_permission(permission, group_id, repo)
          end
        else
          get_group_default_permission(permission, group_id, repo)
        end
    end
  end

  @doc """
  Get all effective permissions for a user on a forum.
  Returns a map of permission => boolean.
  """
  @spec effective_permissions(struct() | nil, struct(), module()) :: %{atom() => boolean()}
  def effective_permissions(user, forum, repo) do
    permission_fields()
    |> Enum.map(fn field ->
      {field, get_effective_permission(field, user, forum, repo)}
    end)
    |> Map.new()
  end

  # =============================================================================
  # QUERIES
  # =============================================================================

  @doc """
  Query for permissions of a specific forum.
  """
  @spec for_forum_query(binary()) :: Ecto.Query.t()
  def for_forum_query(forum_id) do
    from fp in __MODULE__,
      where: fp.forum_id == ^forum_id,
      preload: [:user_group]
  end

  @doc """
  Query for permissions of a specific group across all forums.
  """
  @spec for_group_query(binary()) :: Ecto.Query.t()
  def for_group_query(group_id) do
    from fp in __MODULE__,
      where: fp.user_group_id == ^group_id,
      preload: [:forum]
  end

  @doc """
  Query for guest permissions on a forum.
  """
  @spec guest_permissions_query(binary()) :: Ecto.Query.t()
  def guest_permissions_query(forum_id) do
    from fp in __MODULE__,
      where: fp.forum_id == ^forum_id and fp.applies_to == "guest"
  end

  # =============================================================================
  # BULK OPERATIONS
  # =============================================================================

  @doc """
  Apply a permission template to a forum.
  """
  @spec apply_template(binary(), struct(), binary(), module()) :: {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t()}
  def apply_template(forum_id, template, group_id, repo) do
    attrs =
      Map.merge(
        %{forum_id: forum_id, user_group_id: group_id},
        template.permissions
      )

    # Upsert permission
    case get_existing(forum_id, group_id, repo) do
      nil ->
        %__MODULE__{}
        |> changeset(attrs)
        |> repo.insert()

      existing ->
        existing
        |> changeset(attrs)
        |> repo.update()
    end
  end

  defp get_existing(forum_id, group_id, repo) do
    from(fp in __MODULE__,
      where: fp.forum_id == ^forum_id and fp.user_group_id == ^group_id
    )
    |> repo.one()
  end

  @doc """
  Copy permissions from one forum to another.
  """
  @spec copy_permissions(binary(), binary(), module()) :: [term()]
  def copy_permissions(from_forum_id, to_forum_id, repo) do
    permissions =
      from(fp in __MODULE__, where: fp.forum_id == ^from_forum_id)
      |> repo.all()

    Enum.map(permissions, fn perm ->
      attrs =
        perm
        |> Map.from_struct()
        |> Map.drop([:id, :inserted_at, :updated_at, :forum_id, :__meta__])
        |> Map.put(:forum_id, to_forum_id)

      %__MODULE__{}
      |> changeset(attrs)
      |> repo.insert()
    end)
  end

  # =============================================================================
  # PRIVATE HELPERS
  # =============================================================================

  defp get_forum_member(user_id, forum_id, repo) do
    from(m in CGraph.Forums.ForumMember,
      where: m.user_id == ^user_id and m.forum_id == ^forum_id
    )
    |> repo.one()
  end

  defp get_forum_group_permission(permission, forum_id, group_id, repo) do
    from(fp in __MODULE__,
      where: fp.forum_id == ^forum_id and fp.user_group_id == ^group_id,
      select: field(fp, ^permission)
    )
    |> repo.one()
  end

  defp get_group_default_permission(permission, group_id, repo) do
    from(g in CGraph.Forums.ForumUserGroup,
      where: g.id == ^group_id,
      select: field(g, ^permission)
    )
    |> repo.one()
    |> case do
      true -> true
      false -> false
      nil -> false
    end
  end

  defp get_guest_permission(permission, forum, repo) do
    # Check forum-level guest permission
    forum_perm =
      from(fp in __MODULE__,
        where: fp.forum_id == ^forum.id and fp.applies_to == "guest",
        select: field(fp, ^permission)
      )
      |> repo.one()

    case forum_perm do
      "allow" -> true
      "deny" -> false
      _ ->
        # Check parent forum if inheriting
        if forum.inherit_permissions && forum.parent_forum_id do
          parent = repo.get(CGraph.Forums.Forum, forum.parent_forum_id)
          if parent, do: get_guest_permission(permission, parent, repo), else: false
        else
          false  # Default deny for guests
        end
    end
  end
end
