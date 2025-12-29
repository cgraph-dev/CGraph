defmodule Cgraph.Groups.Group do
  @moduledoc """
  Group schema for Discord-style server/community.
  
  Groups contain channels, members with roles, and moderation features.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :name, :slug, :description, :icon_url, :banner_url,
    :is_public, :member_count, :inserted_at
  ]}

  schema "groups" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :icon_url, :string
    field :banner_url, :string

    # Privacy settings
    field :is_public, :boolean, default: true
    field :is_discoverable, :boolean, default: true
    field :require_approval, :boolean, default: false

    # Stats (denormalized for performance)
    field :member_count, :integer, default: 1
    field :channel_count, :integer, default: 0

    # Moderation settings
    field :slow_mode_seconds, :integer, default: 0
    field :default_role_id, :binary_id

    # Soft delete
    field :deleted_at, :utc_datetime

    # Associations
    belongs_to :owner, Cgraph.Accounts.User
    has_many :channels, Cgraph.Groups.Channel
    has_many :members, Cgraph.Groups.Member
    has_many :roles, Cgraph.Groups.Role
    has_many :invites, Cgraph.Groups.Invite
    has_many :audit_logs, Cgraph.Groups.AuditLog
    has_many :emojis, Cgraph.Groups.CustomEmoji

    timestamps()
  end

  @doc """
  Create a new group.
  """
  def changeset(group, attrs) do
    group
    |> cast(attrs, [
      :name, :description, :icon_url, :banner_url, :owner_id,
      :is_public, :is_discoverable, :require_approval, :slow_mode_seconds
    ])
    |> validate_required([:name, :owner_id])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_length(:description, max: 1000)
    |> validate_number(:slow_mode_seconds, greater_than_or_equal_to: 0, less_than_or_equal_to: 21600)
    |> generate_slug()
    |> unique_constraint(:slug)
    |> foreign_key_constraint(:owner_id)
  end

  @doc """
  Update group settings.
  """
  def update_changeset(group, attrs) do
    group
    |> cast(attrs, [
      :name, :description, :icon_url, :banner_url,
      :is_public, :is_discoverable, :require_approval, :slow_mode_seconds
    ])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_length(:description, max: 1000)
  end

  @doc """
  Transfer ownership.
  """
  def transfer_ownership_changeset(group, new_owner_id) do
    change(group, owner_id: new_owner_id)
  end

  defp generate_slug(changeset) do
    case get_change(changeset, :name) do
      nil -> changeset
      name ->
        base_slug = Slug.slugify(name, lowercase: true)
        unique_suffix = :crypto.strong_rand_bytes(4) |> Base.encode16(case: :lower)
        put_change(changeset, :slug, "#{base_slug}-#{unique_suffix}")
    end
  end
end
