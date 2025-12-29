defmodule Cgraph.Groups.PermissionOverwrite do
  @moduledoc """
  Schema for channel permission overwrites.
  
  Allows fine-grained permission control per role or member in a channel.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "channel_permission_overwrites" do
    belongs_to :channel, Cgraph.Groups.Channel
    belongs_to :role, Cgraph.Groups.Role
    belongs_to :member, Cgraph.Groups.Member

    # Permissions that are explicitly allowed
    field :allow, :integer, default: 0
    # Permissions that are explicitly denied
    field :deny, :integer, default: 0
    # Type of overwrite: "role" or "member"
    field :type, :string
    
    timestamps()
  end

  def changeset(overwrite, attrs) do
    overwrite
    |> cast(attrs, [:channel_id, :role_id, :member_id, :allow, :deny, :type])
    |> validate_required([:channel_id, :type])
    |> validate_inclusion(:type, ["role", "member"])
    |> validate_target()
    |> unique_constraint([:channel_id, :role_id], name: :channel_permission_overwrites_role_index)
    |> unique_constraint([:channel_id, :member_id], name: :channel_permission_overwrites_member_index)
    |> foreign_key_constraint(:channel_id)
  end

  defp validate_target(changeset) do
    type = get_field(changeset, :type)
    role_id = get_field(changeset, :role_id)
    member_id = get_field(changeset, :member_id)

    case type do
      "role" when is_nil(role_id) ->
        add_error(changeset, :role_id, "is required for role overwrites")
      "member" when is_nil(member_id) ->
        add_error(changeset, :member_id, "is required for member overwrites")
      _ ->
        changeset
    end
  end
end
