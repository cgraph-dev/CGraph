defmodule CGraph.Calendar.EventRSVP do
  @moduledoc """
  Schema for event RSVPs.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Accounts.User
  alias CGraph.Calendar.Event

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "calendar_event_rsvps" do
    field :status, :string, default: "going"
    field :note, :string

    belongs_to :event, Event
    belongs_to :user, User

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(event_id user_id)a
  @optional_fields ~w(status note)a

  @valid_statuses ~w(going maybe not_going interested)

  def changeset(rsvp, attrs) do
    rsvp
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, @valid_statuses)
    |> validate_length(:note, max: 500)
    |> foreign_key_constraint(:event_id)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint([:event_id, :user_id])
  end
end
