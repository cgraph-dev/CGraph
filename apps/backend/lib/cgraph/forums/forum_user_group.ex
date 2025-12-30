defmodule Cgraph.Forums.ForumUserGroup do
  @moduledoc """
  ForumUserGroup schema for MyBB-style permission groups.
  
  User groups define granular permissions for forum members. Each forum can have
  multiple user groups (e.g., Members, VIP, Moderators, Admins) with different
  permission sets.
  
  ## Permission Categories
  - View: What users can see
  - Posting: Creating threads, replies, editing
  - Features: Attachments, signatures, polls
  - Social: Reputation, private messages
  - Moderation: Moderator actions
  - Admin: Administrative actions
  
  ## Limits
  - Attachment sizes and counts
  - Signature length
  - Flood protection (time between posts)
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :name, :description, :color, :icon, :is_staff, :is_default, :position
  ]}

  schema "forum_user_groups" do
    field :name, :string
    field :description, :string
    field :color, :string
    field :icon, :string
    field :is_staff, :boolean, default: false
    field :is_default, :boolean, default: false
    field :position, :integer, default: 0
    
    # View permissions
    field :can_view_boards, :boolean, default: true
    field :can_view_profiles, :boolean, default: true
    field :can_view_hidden_boards, :boolean, default: false
    
    # Posting permissions
    field :can_create_threads, :boolean, default: true
    field :can_reply, :boolean, default: true
    field :can_edit_own_posts, :boolean, default: true
    field :can_delete_own_posts, :boolean, default: false
    field :can_edit_own_threads, :boolean, default: true
    field :can_delete_own_threads, :boolean, default: false
    
    # Feature permissions
    field :can_upload_attachments, :boolean, default: true
    field :can_use_signature, :boolean, default: true
    field :can_use_bbcode, :boolean, default: true
    field :can_use_images, :boolean, default: true
    field :can_create_polls, :boolean, default: true
    field :can_vote_polls, :boolean, default: true
    
    # Social permissions
    field :can_give_reputation, :boolean, default: true
    field :can_receive_reputation, :boolean, default: true
    field :can_send_pm, :boolean, default: true
    field :can_receive_pm, :boolean, default: true
    
    # Moderation permissions
    field :can_moderate, :boolean, default: false
    field :can_edit_posts, :boolean, default: false
    field :can_delete_posts, :boolean, default: false
    field :can_move_threads, :boolean, default: false
    field :can_merge_threads, :boolean, default: false
    field :can_split_threads, :boolean, default: false
    field :can_lock_threads, :boolean, default: false
    field :can_pin_threads, :boolean, default: false
    field :can_hide_posts, :boolean, default: false
    field :can_approve_posts, :boolean, default: false
    
    # Admin permissions
    field :can_manage_users, :boolean, default: false
    field :can_ban_users, :boolean, default: false
    field :can_warn_users, :boolean, default: false
    field :can_manage_groups, :boolean, default: false
    field :can_manage_boards, :boolean, default: false
    field :can_manage_settings, :boolean, default: false
    field :can_manage_themes, :boolean, default: false
    field :can_manage_plugins, :boolean, default: false
    field :is_admin, :boolean, default: false
    
    # Limits
    field :max_attachments_per_post, :integer, default: 5
    field :max_attachment_size_kb, :integer, default: 2048
    field :max_signature_length, :integer, default: 500
    field :max_signature_lines, :integer, default: 5
    field :post_flood_limit_seconds, :integer, default: 30
    field :search_flood_limit_seconds, :integer, default: 10

    belongs_to :forum, Cgraph.Forums.Forum
    has_many :members, Cgraph.Forums.ForumMember, foreign_key: :user_group_id

    timestamps()
  end

  @doc """
  Changeset for creating a new user group.
  """
  def changeset(group, attrs) do
    group
    |> cast(attrs, [
      :name, :description, :color, :icon, :is_staff, :is_default, :position,
      :forum_id
    ] ++ permission_fields() ++ limit_fields())
    |> validate_required([:name, :forum_id])
    |> validate_length(:name, min: 1, max: 50)
    |> unique_constraint([:forum_id, :name])
    |> foreign_key_constraint(:forum_id)
  end

  @doc """
  List of all permission fields.
  """
  def permission_fields do
    [
      :can_view_boards, :can_view_profiles, :can_view_hidden_boards,
      :can_create_threads, :can_reply, :can_edit_own_posts, :can_delete_own_posts,
      :can_edit_own_threads, :can_delete_own_threads,
      :can_upload_attachments, :can_use_signature, :can_use_bbcode, :can_use_images,
      :can_create_polls, :can_vote_polls,
      :can_give_reputation, :can_receive_reputation, :can_send_pm, :can_receive_pm,
      :can_moderate, :can_edit_posts, :can_delete_posts, :can_move_threads,
      :can_merge_threads, :can_split_threads, :can_lock_threads, :can_pin_threads,
      :can_hide_posts, :can_approve_posts,
      :can_manage_users, :can_ban_users, :can_warn_users, :can_manage_groups,
      :can_manage_boards, :can_manage_settings, :can_manage_themes, :can_manage_plugins,
      :is_admin
    ]
  end

  @doc """
  List of limit fields.
  """
  def limit_fields do
    [
      :max_attachments_per_post, :max_attachment_size_kb,
      :max_signature_length, :max_signature_lines,
      :post_flood_limit_seconds, :search_flood_limit_seconds
    ]
  end

  @doc """
  Create default user groups for a new forum.
  Returns a list of group attrs.
  """
  def default_groups do
    [
      %{
        name: "Members",
        description: "Regular forum members",
        is_default: true,
        position: 0
      },
      %{
        name: "Moderators",
        description: "Forum moderators",
        color: "#00AA00",
        is_staff: true,
        position: 1,
        can_moderate: true,
        can_edit_posts: true,
        can_delete_posts: true,
        can_move_threads: true,
        can_lock_threads: true,
        can_pin_threads: true,
        can_hide_posts: true,
        can_approve_posts: true,
        can_warn_users: true
      },
      %{
        name: "Administrators",
        description: "Forum administrators",
        color: "#FF0000",
        is_staff: true,
        position: 2,
        can_moderate: true,
        can_edit_posts: true,
        can_delete_posts: true,
        can_move_threads: true,
        can_merge_threads: true,
        can_split_threads: true,
        can_lock_threads: true,
        can_pin_threads: true,
        can_hide_posts: true,
        can_approve_posts: true,
        can_manage_users: true,
        can_ban_users: true,
        can_warn_users: true,
        can_manage_groups: true,
        can_manage_boards: true,
        can_manage_settings: true,
        can_manage_themes: true,
        can_manage_plugins: true,
        is_admin: true
      }
    ]
  end
end
