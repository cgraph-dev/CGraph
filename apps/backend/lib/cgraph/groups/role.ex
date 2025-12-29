defmodule Cgraph.Groups.Role do
  @moduledoc """
  Roles for group permission management.
  
  Each group has a default @everyone role, plus custom roles.
  Roles have a permission bitmask for granular access control.
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Bitwise

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :name, :color, :position, :is_mentionable, :is_hoisted,
    :permissions, :group_id
  ]}

  # Permission bits (Discord-style)
  @permissions %{
    view_channels: 1 <<< 0,
    send_messages: 1 <<< 1,
    send_files: 1 <<< 2,
    embed_links: 1 <<< 3,
    add_reactions: 1 <<< 4,
    use_external_emojis: 1 <<< 5,
    mention_everyone: 1 <<< 6,
    manage_messages: 1 <<< 7,
    read_message_history: 1 <<< 8,
    connect_voice: 1 <<< 9,
    speak_voice: 1 <<< 10,
    mute_members: 1 <<< 11,
    deafen_members: 1 <<< 12,
    move_members: 1 <<< 13,
    manage_channels: 1 <<< 14,
    manage_roles: 1 <<< 15,
    manage_group: 1 <<< 16,
    kick_members: 1 <<< 17,
    ban_members: 1 <<< 18,
    create_invites: 1 <<< 19,
    change_nickname: 1 <<< 20,
    manage_nicknames: 1 <<< 21,
    manage_emojis: 1 <<< 22,
    administrator: 1 <<< 31
  }

  # Default permissions for @everyone
  @default_permissions (
    @permissions.view_channels |||
    @permissions.send_messages |||
    @permissions.send_files |||
    @permissions.embed_links |||
    @permissions.add_reactions |||
    @permissions.read_message_history |||
    @permissions.connect_voice |||
    @permissions.speak_voice |||
    @permissions.change_nickname |||
    @permissions.create_invites
  )

  schema "roles" do
    field :name, :string
    field :color, :string, default: "#99AAB5"  # Hex color
    field :position, :integer, default: 0
    field :permissions, :integer, default: 0
    field :is_default, :boolean, default: false
    field :is_mentionable, :boolean, default: false
    field :is_hoisted, :boolean, default: false  # Show separately in member list

    belongs_to :group, Cgraph.Groups.Group
    many_to_many :members, Cgraph.Groups.Member, join_through: "member_roles"

    timestamps()
  end

  @doc """
  Create a new role.
  """
  def changeset(role, attrs) do
    role
    |> cast(attrs, [:name, :color, :position, :permissions, :is_mentionable, :is_hoisted, :group_id])
    |> validate_required([:name, :group_id])
    |> validate_length(:name, min: 1, max: 100)
    |> validate_format(:color, ~r/^#[0-9A-Fa-f]{6}$/, message: "must be a valid hex color")
    |> validate_number(:permissions, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:group_id)
  end

  @doc """
  Create the default @everyone role for a group.
  """
  def default_changeset(group_id) do
    %__MODULE__{}
    |> change(
      name: "@everyone",
      group_id: group_id,
      is_default: true,
      permissions: @default_permissions,
      position: 0
    )
  end

  @doc """
  Check if a role has a specific permission.
  """
  def has_permission?(%__MODULE__{permissions: perms}, permission_name) when is_atom(permission_name) do
    case Map.get(@permissions, permission_name) do
      nil -> false
      bit -> (perms &&& bit) != 0 or (perms &&& @permissions.administrator) != 0
    end
  end

  @doc """
  Add a permission to a role.
  """
  def add_permission(role, permission_name) when is_atom(permission_name) do
    case Map.get(@permissions, permission_name) do
      nil -> role
      bit -> %{role | permissions: role.permissions ||| bit}
    end
  end

  @doc """
  Remove a permission from a role.
  """
  def remove_permission(role, permission_name) when is_atom(permission_name) do
    case Map.get(@permissions, permission_name) do
      nil -> role
      bit -> %{role | permissions: role.permissions &&& bnot(bit)}
    end
  end

  @doc """
  Get the permission map.
  """
  def permissions_map, do: @permissions

  @doc """
  Get default permissions value.
  """
  def default_permissions, do: @default_permissions
end
