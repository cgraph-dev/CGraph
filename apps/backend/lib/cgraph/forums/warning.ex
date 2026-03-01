defmodule CGraph.Forums.Warning do
  @moduledoc """
  Forum warning schema — tracks warnings/strikes issued to users.

  Warnings accumulate points; auto-action thresholds:
  - 3 pts → temp mute (24h)
  - 6 pts → temp ban (7d)
  - 10 pts → permanent ban
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_warnings" do
    field :reason, :string
    field :points, :integer, default: 1
    field :expires_at, :utc_datetime_usec
    field :acknowledged, :boolean, default: false
    field :revoked, :boolean, default: false

    belongs_to :forum, CGraph.Forums.Forum
    belongs_to :user, CGraph.Accounts.User
    belongs_to :issued_by, CGraph.Accounts.User
    belongs_to :revoked_by, CGraph.Accounts.User

    timestamps()
  end

  @doc "Builds a changeset for warning creation."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(warning, attrs) do
    warning
    |> cast(attrs, [
      :forum_id, :user_id, :issued_by_id, :reason, :points,
      :expires_at, :acknowledged, :revoked, :revoked_by_id
    ])
    |> validate_required([:forum_id, :user_id, :issued_by_id, :reason, :points])
    |> validate_number(:points, greater_than: 0, less_than_or_equal_to: 5)
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:issued_by_id)
  end

  @doc "Builds a changeset for revoking a warning."
  @spec revoke_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def revoke_changeset(warning, attrs) do
    warning
    |> cast(attrs, [:revoked, :revoked_by_id])
    |> put_change(:revoked, true)
    |> validate_required([:revoked_by_id])
  end
end
