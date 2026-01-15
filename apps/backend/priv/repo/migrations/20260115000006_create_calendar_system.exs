defmodule Cgraph.Repo.Migrations.CreateCalendarSystem do
  @moduledoc """
  Creates tables for the Calendar and Events system.
  
  Tables created:
  - calendar_event_categories: Event categories with colors
  - calendar_events: The actual calendar events
  - calendar_event_rsvps: RSVPs for events
  """
  use Ecto.Migration

  def change do
    # Event Categories
    create table(:calendar_event_categories, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :text
      add :color, :string, default: "#6366f1"
      add :icon, :string
      add :order, :integer, default: 0

      timestamps(type: :utc_datetime)
    end

    create unique_index(:calendar_event_categories, [:name])

    # Calendar Events
    create table(:calendar_events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :author_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :category_id, references(:calendar_event_categories, type: :binary_id, on_delete: :nilify_all)
      add :forum_id, references(:forums, type: :binary_id, on_delete: :nilify_all)
      add :title, :string, null: false
      add :description, :text
      add :start_date, :utc_datetime, null: false
      add :end_date, :utc_datetime
      add :all_day, :boolean, default: false
      add :timezone, :string, default: "UTC"
      add :event_type, :string, default: "single"
      add :is_recurring, :boolean, default: false
      add :recurrence_pattern, :map
      add :recurrence_end_date, :utc_datetime
      add :location, :string
      add :location_url, :string
      add :visibility, :string, default: "public"
      add :rsvp_enabled, :boolean, default: false
      add :rsvp_deadline, :utc_datetime
      add :max_attendees, :integer

      timestamps(type: :utc_datetime)
    end

    create index(:calendar_events, [:author_id])
    create index(:calendar_events, [:category_id])
    create index(:calendar_events, [:forum_id])
    create index(:calendar_events, [:start_date])
    create index(:calendar_events, [:visibility])
    create index(:calendar_events, [:start_date, :end_date])

    # Event RSVPs
    create table(:calendar_event_rsvps, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :event_id, references(:calendar_events, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :status, :string, default: "going"
      add :note, :string

      timestamps(type: :utc_datetime)
    end

    create index(:calendar_event_rsvps, [:event_id])
    create index(:calendar_event_rsvps, [:user_id])
    create unique_index(:calendar_event_rsvps, [:event_id, :user_id])
  end
end
