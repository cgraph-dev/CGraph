defmodule Cgraph.Moderation.UserRestriction do
  @moduledoc """
  Schema for user account restrictions (suspensions/bans).

  Tracks when users have restricted access due to moderation actions.
  Restrictions can be temporary (suspension) or permanent (ban).
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @restriction_types ~w(suspended banned)a

  schema "user_restrictions" do
    field :type, Ecto.Enum, values: @restriction_types
    field :reason, :string
    field :expires_at, :utc_datetime
    field :active, :boolean, default: true

    belongs_to :user, Cgraph.Accounts.User

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(user_id type)a
  @optional_fields ~w(reason expires_at active)a

  @doc false
  def changeset(restriction, attrs) do
    restriction
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:type, @restriction_types)
    |> validate_length(:reason, max: 1000)
    |> validate_expiration()
    |> foreign_key_constraint(:user_id)
  end

  # Suspensions must have expiration, bans must not
  defp validate_expiration(changeset) do
    type = get_field(changeset, :type)
    expires_at = get_field(changeset, :expires_at)

    cond do
      type == :suspended and is_nil(expires_at) ->
        add_error(changeset, :expires_at, "is required for suspensions")
      type == :banned and not is_nil(expires_at) ->
        add_error(changeset, :expires_at, "should not be set for permanent bans")
      true ->
        changeset
    end
  end
end
