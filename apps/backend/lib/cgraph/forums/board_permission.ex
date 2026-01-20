defmodule CGraph.Forums.BoardPermission do
  @moduledoc """
  BoardPermission schema for granular board-level permission overrides.

  Permissions can be set to:
  - "inherit" - Use the user group's default permission
  - "allow" - Grant permission regardless of group default
  - "deny" - Revoke permission regardless of group default

  Permissions are checked in order:
  1. Board-level permission for user's group
  2. Forum-level permission for user's group
  3. User group default permission

  ## Usage

      # Check if user can create threads in a board
      BoardPermission.can?(:can_create_threads, user, board)

      # Get effective permissions for a user in a board
      BoardPermission.effective_permissions(user, board)
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
    :id, :board_id, :user_group_id, :applies_to,
    :can_view, :can_view_threads, :can_create_threads, :can_reply,
    :can_edit_own_posts, :can_delete_own_posts, :can_upload_attachments,
    :can_create_polls, :can_vote_polls, :can_moderate, :can_edit_posts,
    :can_delete_posts, :can_move_threads, :can_lock_threads, :can_pin_threads
  ]}

  schema "board_permissions" do
    field :applies_to, :string, default: "group"

    # View permissions
    field :can_view, :string, default: "inherit"
    field :can_view_threads, :string, default: "inherit"

    # Posting permissions
    field :can_create_threads, :string, default: "inherit"
    field :can_reply, :string, default: "inherit"
    field :can_edit_own_posts, :string, default: "inherit"
    field :can_delete_own_posts, :string, default: "inherit"

    # Feature permissions
    field :can_upload_attachments, :string, default: "inherit"
    field :can_create_polls, :string, default: "inherit"
    field :can_vote_polls, :string, default: "inherit"

    # Moderation permissions
    field :can_moderate, :string, default: "inherit"
    field :can_edit_posts, :string, default: "inherit"
    field :can_delete_posts, :string, default: "inherit"
    field :can_move_threads, :string, default: "inherit"
    field :can_lock_threads, :string, default: "inherit"
    field :can_pin_threads, :string, default: "inherit"

    belongs_to :board, CGraph.Forums.Board
    belongs_to :user_group, CGraph.Forums.ForumUserGroup

    timestamps()
  end

  @doc """
  List of all permission fields.
  """
  def permission_fields do
    [
      :can_view, :can_view_threads, :can_create_threads, :can_reply,
      :can_edit_own_posts, :can_delete_own_posts, :can_upload_attachments,
      :can_create_polls, :can_vote_polls, :can_moderate, :can_edit_posts,
      :can_delete_posts, :can_move_threads, :can_lock_threads, :can_pin_threads
    ]
  end

  @doc """
  Create or update board permissions.
  """
  def changeset(permission, attrs) do
    permission
    |> cast(attrs, [:board_id, :user_group_id, :applies_to] ++ permission_fields())
    |> validate_required([:board_id])
    |> validate_inclusion(:applies_to, @applies_to_values)
    |> validate_permissions()
    |> foreign_key_constraint(:board_id)
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
  Check if a user has a specific permission on a board.
  Returns true/false.
  """
  def can?(permission, user, board, repo) when is_atom(permission) do
    effective = get_effective_permission(permission, user, board, repo)
    effective == true
  end

  @doc """
  Get the effective value of a permission for a user on a board.
  Returns true, false, or nil (if not set).
  """
  def get_effective_permission(permission, nil, board, repo) do
    # Anonymous user - check guest permissions
    get_guest_permission(permission, board, repo)
  end

  def get_effective_permission(permission, user, board, repo) do
    # Get user's group in this forum
    member = get_forum_member(user.id, board.forum_id, repo)

    if is_nil(member) do
      # Not a member, check guest permissions
      get_guest_permission(permission, board, repo)
    else
      # Check board-level permission first
      board_perm = get_board_group_permission(permission, board.id, member.user_group_id, repo)

      case board_perm do
        "allow" -> true
        "deny" -> false
        "inherit" ->
          # Check forum-level permission
          forum_perm = get_forum_group_permission(permission, board.forum_id, member.user_group_id, repo)

          case forum_perm do
            "allow" -> true
            "deny" -> false
            "inherit" ->
              # Fall back to user group default
              get_group_default_permission(permission, member.user_group_id, repo)
            nil ->
              get_group_default_permission(permission, member.user_group_id, repo)
          end
        nil ->
          # No board-level override, check forum-level
          forum_perm = get_forum_group_permission(permission, board.forum_id, member.user_group_id, repo)

          case forum_perm do
            "allow" -> true
            "deny" -> false
            _ -> get_group_default_permission(permission, member.user_group_id, repo)
          end
      end
    end
  end

  @doc """
  Get all effective permissions for a user on a board.
  Returns a map of permission => boolean.
  """
  def effective_permissions(user, board, repo) do
    permission_fields()
    |> Enum.map(fn field ->
      {field, get_effective_permission(field, user, board, repo)}
    end)
    |> Map.new()
  end

  # =============================================================================
  # QUERIES
  # =============================================================================

  @doc """
  Query for permissions of a specific board.
  """
  def for_board_query(board_id) do
    from bp in __MODULE__,
      where: bp.board_id == ^board_id,
      preload: [:user_group]
  end

  @doc """
  Query for permissions of a specific group across all boards.
  """
  def for_group_query(group_id) do
    from bp in __MODULE__,
      where: bp.user_group_id == ^group_id,
      preload: [:board]
  end

  @doc """
  Query for guest permissions.
  """
  def guest_permissions_query(board_id) do
    from bp in __MODULE__,
      where: bp.board_id == ^board_id and bp.applies_to == "guest"
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

  defp get_board_group_permission(permission, board_id, group_id, repo) do
    from(bp in __MODULE__,
      where: bp.board_id == ^board_id and bp.user_group_id == ^group_id,
      select: field(bp, ^permission)
    )
    |> repo.one()
  end

  defp get_forum_group_permission(permission, forum_id, group_id, repo) do
    from(fp in CGraph.Forums.ForumPermission,
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

  defp get_guest_permission(permission, board, repo) do
    # Check board-level guest permission
    board_perm =
      from(bp in __MODULE__,
        where: bp.board_id == ^board.id and bp.applies_to == "guest",
        select: field(bp, ^permission)
      )
      |> repo.one()

    case board_perm do
      "allow" -> true
      "deny" -> false
      _ ->
        # Check forum-level guest permission
        forum_perm =
          from(fp in CGraph.Forums.ForumPermission,
            where: fp.forum_id == ^board.forum_id and fp.applies_to == "guest",
            select: field(fp, ^permission)
          )
          |> repo.one()

        case forum_perm do
          "allow" -> true
          _ -> false  # Default deny for guests
        end
    end
  end
end
