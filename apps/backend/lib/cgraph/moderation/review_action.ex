defmodule Cgraph.Moderation.ReviewAction do
  @moduledoc """
  Schema for moderation actions taken on reports.

  Records what action was taken, by whom, and when.
  Used for audit trails and appeal processing.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @actions ~w(dismiss warn remove_content suspend ban)a

  schema "review_actions" do
    field :action, Ecto.Enum, values: @actions
    field :notes, :string
    field :duration_hours, :integer  # For suspensions

    belongs_to :report, Cgraph.Moderation.Report
    belongs_to :reviewer, Cgraph.Accounts.User
    has_one :appeal, Cgraph.Moderation.Appeal

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(report_id reviewer_id action)a
  @optional_fields ~w(notes duration_hours)a

  @doc false
  def changeset(action, attrs) do
    action
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:action, @actions)
    |> validate_length(:notes, max: 5000)
    |> validate_number(:duration_hours, greater_than: 0, less_than_or_equal_to: 8760)  # Max 1 year
    |> validate_suspension_duration()
    |> foreign_key_constraint(:report_id)
    |> foreign_key_constraint(:reviewer_id)
  end

  defp validate_suspension_duration(changeset) do
    action = get_field(changeset, :action)
    duration = get_field(changeset, :duration_hours)

    if action == :suspend and is_nil(duration) do
      add_error(changeset, :duration_hours, "is required for suspensions")
    else
      changeset
    end
  end
end
