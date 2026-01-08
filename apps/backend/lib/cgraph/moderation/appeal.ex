defmodule Cgraph.Moderation.Appeal do
  @moduledoc """
  Schema for user appeals against moderation actions.

  Users can appeal suspensions and bans to have their case reviewed
  by a different moderator.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @statuses ~w(pending approved denied)a

  schema "appeals" do
    field :reason, :string
    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :reviewer_notes, :string
    field :reviewed_at, :utc_datetime

    belongs_to :user, Cgraph.Accounts.User
    belongs_to :review_action, Cgraph.Moderation.ReviewAction
    belongs_to :reviewer, Cgraph.Accounts.User

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(user_id review_action_id reason)a
  @optional_fields ~w(status reviewer_id reviewer_notes reviewed_at)a

  @doc false
  def changeset(appeal, attrs) do
    appeal
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:reason, min: 20, max: 2000)
    |> validate_length(:reviewer_notes, max: 2000)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:review_action_id)
    |> foreign_key_constraint(:reviewer_id)
    |> unique_constraint([:user_id, :review_action_id], 
        name: :appeals_user_id_review_action_id_index,
        message: "you have already appealed this action")
  end
end
