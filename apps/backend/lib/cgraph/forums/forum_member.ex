defmodule Cgraph.Forums.ForumMember do
  @moduledoc """
  ForumMember schema representing a user's membership in a specific forum.
  
  Each forum maintains its own member list with forum-specific data like:
  - Display name (can differ from platform username)
  - Custom title
  - Signature
  - Forum-specific avatar
  - Post/thread counts for this forum
  - Reputation within this forum
  - Ban status
  
  This allows users to have different identities/personas in different forums.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :display_name, :title, :avatar_url, :post_count, :thread_count,
    :reputation, :role, :is_banned, :joined_at, :last_visit_at
  ]}

  @roles ["member", "moderator", "admin", "owner"]

  schema "forum_members" do
    # Forum-specific profile
    field :display_name, :string
    field :title, :string
    field :signature, :string
    field :signature_html, :string
    field :avatar_url, :string
    
    # Stats
    field :post_count, :integer, default: 0
    field :thread_count, :integer, default: 0
    field :reputation, :integer, default: 0
    field :reputation_positive, :integer, default: 0
    field :reputation_negative, :integer, default: 0
    field :warnings, :integer, default: 0
    field :warning_points, :integer, default: 0
    
    # Role and status
    field :role, :string, default: "member"
    field :is_banned, :boolean, default: false
    field :ban_reason, :string
    field :ban_expires_at, :utc_datetime
    field :banned_by_id, :binary_id
    
    # Activity
    field :last_visit_at, :utc_datetime
    field :last_post_at, :utc_datetime
    field :joined_at, :utc_datetime
    
    # Settings
    field :receive_notifications, :boolean, default: true
    field :show_signature, :boolean, default: true
    field :posts_per_page, :integer, default: 20

    belongs_to :forum, Cgraph.Forums.Forum
    belongs_to :user, Cgraph.Accounts.User
    belongs_to :user_group, Cgraph.Forums.ForumUserGroup

    timestamps()
  end

  @doc """
  Changeset for creating a new forum membership.
  """
  def changeset(member, attrs) do
    now = DateTime.utc_now()
    
    member
    |> cast(attrs, [
      :display_name, :title, :signature, :avatar_url,
      :role, :forum_id, :user_id, :user_group_id
    ])
    |> validate_required([:forum_id, :user_id])
    |> validate_inclusion(:role, @roles)
    |> put_change(:joined_at, now)
    |> put_change(:last_visit_at, now)
    |> unique_constraint([:forum_id, :user_id])
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:user_group_id)
  end

  @doc """
  Changeset for updating profile information.
  """
  def profile_changeset(member, attrs) do
    member
    |> cast(attrs, [
      :display_name, :title, :signature, :signature_html, :avatar_url,
      :receive_notifications, :show_signature, :posts_per_page
    ])
    |> validate_length(:display_name, max: 50)
    |> validate_length(:title, max: 100)
    |> validate_length(:signature, max: 1000)
    |> validate_number(:posts_per_page, greater_than: 0, less_than_or_equal_to: 50)
  end

  @doc """
  Changeset for updating stats.
  """
  def stats_changeset(member, attrs) do
    member
    |> cast(attrs, [
      :post_count, :thread_count, :reputation, 
      :reputation_positive, :reputation_negative,
      :warnings, :warning_points, :last_post_at, :last_visit_at
    ])
  end

  @doc """
  Changeset for moderation actions (ban, role change, etc.).
  """
  def moderation_changeset(member, attrs) do
    member
    |> cast(attrs, [
      :role, :is_banned, :ban_reason, :ban_expires_at, :banned_by_id,
      :user_group_id, :warnings, :warning_points
    ])
    |> validate_inclusion(:role, @roles)
  end

  @doc """
  Check if user is banned.
  """
  def banned?(member) do
    member.is_banned && 
      (is_nil(member.ban_expires_at) || DateTime.compare(member.ban_expires_at, DateTime.utc_now()) == :gt)
  end

  @doc """
  Check if user is staff (moderator, admin, or owner).
  """
  def staff?(member) do
    member.role in ["moderator", "admin", "owner"]
  end

  @doc """
  Check if user is admin or owner.
  """
  def admin?(member) do
    member.role in ["admin", "owner"]
  end
end
