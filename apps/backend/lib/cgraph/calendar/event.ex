defmodule Cgraph.Calendar.Event do
  @moduledoc """
  Schema for calendar events.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias Cgraph.Accounts.User
  alias Cgraph.Calendar.{EventCategory, EventRSVP}
  alias Cgraph.Forums.Forum

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "calendar_events" do
    field :title, :string
    field :description, :string
    field :start_date, :utc_datetime
    field :end_date, :utc_datetime
    field :all_day, :boolean, default: false
    field :timezone, :string, default: "UTC"
    field :event_type, :string, default: "single"
    field :is_recurring, :boolean, default: false
    field :recurrence_pattern, :map
    field :recurrence_end_date, :utc_datetime
    field :location, :string
    field :location_url, :string
    field :visibility, :string, default: "public"
    field :rsvp_enabled, :boolean, default: false
    field :rsvp_deadline, :utc_datetime
    field :max_attendees, :integer

    belongs_to :author, User
    belongs_to :category, EventCategory
    belongs_to :forum, Forum

    has_many :rsvps, EventRSVP

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(title start_date author_id)a
  @optional_fields ~w(description end_date all_day timezone event_type is_recurring
                      recurrence_pattern recurrence_end_date location location_url
                      visibility category_id forum_id rsvp_enabled rsvp_deadline max_attendees)a

  @valid_visibilities ~w(public private forum)
  @valid_event_types ~w(single recurring birthday holiday)

  def changeset(event, attrs) do
    event
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:title, min: 1, max: 255)
    |> validate_length(:description, max: 10_000)
    |> validate_inclusion(:visibility, @valid_visibilities)
    |> validate_inclusion(:event_type, @valid_event_types)
    |> validate_dates()
    |> foreign_key_constraint(:author_id)
    |> foreign_key_constraint(:category_id)
    |> foreign_key_constraint(:forum_id)
  end

  defp validate_dates(changeset) do
    start_date = get_field(changeset, :start_date)
    end_date = get_field(changeset, :end_date)

    if start_date && end_date && DateTime.compare(end_date, start_date) == :lt do
      add_error(changeset, :end_date, "must be after start date")
    else
      changeset
    end
  end
end
