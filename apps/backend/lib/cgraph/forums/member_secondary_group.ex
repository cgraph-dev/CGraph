defmodule CGraph.Forums.MemberSecondaryGroup do
  @moduledoc """
  MemberSecondaryGroup schema for secondary group memberships.

  Allows users to belong to multiple groups within a forum:
  - Primary group (user_group_id in ForumMember) - Used for display
  - Secondary groups (this table) - Additional permissions

  ## Permission Stacking
  Permissions from all groups are combined (OR logic):
  - If ANY group grants a permission, user has it
  - Higher priority groups take precedence for conflicts

  ## Temporary Memberships
  Groups can have an expiration date for:
  - Trial periods
  - Temporary promotions
  - Event-based access
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [:id, :expires_at, :reason, :inserted_at]}

  schema "member_secondary_groups" do
    field :expires_at, :utc_datetime
    field :reason, :string

    belongs_to :member, CGraph.Forums.ForumMember
    belongs_to :user_group, CGraph.Forums.ForumUserGroup
    belongs_to :granted_by, CGraph.Accounts.User

    timestamps()
  end

  @doc """
  Changeset for adding a secondary group.
  """
  def changeset(membership, attrs) do
    membership
    |> cast(attrs, [:member_id, :user_group_id, :expires_at, :reason, :granted_by_id])
    |> validate_required([:member_id, :user_group_id])
    |> validate_expiration()
    |> unique_constraint([:member_id, :user_group_id])
    |> foreign_key_constraint(:member_id)
    |> foreign_key_constraint(:user_group_id)
    |> foreign_key_constraint(:granted_by_id)
  end

  defp validate_expiration(changeset) do
    case get_change(changeset, :expires_at) do
      nil -> changeset
      expires_at ->
        if DateTime.compare(expires_at, DateTime.utc_now()) == :lt do
          add_error(changeset, :expires_at, "must be in the future")
        else
          changeset
        end
    end
  end

  # =============================================================================
  # QUERIES
  # =============================================================================

  @doc """
  Query for all secondary groups of a member.
  """
  def for_member_query(member_id) do
    from msg in __MODULE__,
      where: msg.member_id == ^member_id,
      where: is_nil(msg.expires_at) or msg.expires_at > ^DateTime.utc_now(),
      preload: [:user_group]
  end

  @doc """
  Query for all members in a secondary group.
  """
  def for_group_query(group_id) do
    from msg in __MODULE__,
      where: msg.user_group_id == ^group_id,
      where: is_nil(msg.expires_at) or msg.expires_at > ^DateTime.utc_now(),
      preload: [:member]
  end

  @doc """
  Query for expired secondary group memberships.
  """
  def expired_query do
    from msg in __MODULE__,
      where: not is_nil(msg.expires_at) and msg.expires_at < ^DateTime.utc_now()
  end

  @doc """
  Query to check if member has a specific secondary group.
  """
  def has_group_query(member_id, group_id) do
    from msg in __MODULE__,
      where: msg.member_id == ^member_id and msg.user_group_id == ^group_id,
      where: is_nil(msg.expires_at) or msg.expires_at > ^DateTime.utc_now()
  end

  # =============================================================================
  # OPERATIONS
  # =============================================================================

  @doc """
  Add a secondary group to a member.
  """
  def add_group(member_id, group_id, opts \\ []) do
    attrs = %{
      member_id: member_id,
      user_group_id: group_id,
      expires_at: Keyword.get(opts, :expires_at),
      reason: Keyword.get(opts, :reason),
      granted_by_id: Keyword.get(opts, :granted_by_id)
    }

    %__MODULE__{}
    |> changeset(attrs)
  end

  @doc """
  Remove a secondary group from a member.
  """
  def remove_group_query(member_id, group_id) do
    from msg in __MODULE__,
      where: msg.member_id == ^member_id and msg.user_group_id == ^group_id
  end

  @doc """
  Extend the expiration of a secondary group membership.
  """
  def extend_changeset(membership, new_expires_at) do
    membership
    |> cast(%{expires_at: new_expires_at}, [:expires_at])
    |> validate_expiration()
  end

  @doc """
  Get all group IDs for a member (primary + secondary).
  """
  def all_group_ids(member, repo) do
    secondary_ids =
      for_member_query(member.id)
      |> repo.all()
      |> Enum.map(& &1.user_group_id)

    [member.user_group_id | secondary_ids]
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  @doc """
  Check if any permission is granted across all member groups.
  Uses OR logic - if any group grants, permission is granted.
  """
  def has_permission?(member, permission, repo) do
    group_ids = all_group_ids(member, repo)

    from(g in CGraph.Forums.ForumUserGroup,
      where: g.id in ^group_ids,
      select: field(g, ^permission)
    )
    |> repo.all()
    |> Enum.any?(& &1 == true)
  end

  @doc """
  Get stacked permissions from all groups.
  Returns a map of permission => boolean.
  """
  def stacked_permissions(member, repo) do
    group_ids = all_group_ids(member, repo)

    groups =
      from(g in CGraph.Forums.ForumUserGroup,
        where: g.id in ^group_ids,
        order_by: [desc: g.permission_priority]
      )
      |> repo.all()

    CGraph.Forums.ForumUserGroup.permission_fields()
    |> Enum.map(fn field ->
      value = Enum.any?(groups, fn g -> Map.get(g, field) == true end)
      {field, value}
    end)
    |> Map.new()
  end
end
