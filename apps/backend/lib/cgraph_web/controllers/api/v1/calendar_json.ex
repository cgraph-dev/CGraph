defmodule CgraphWeb.API.V1.CalendarJSON do
  @moduledoc """
  JSON rendering for Calendar endpoints.
  """

  alias Cgraph.Calendar.{Event, EventCategory, EventRSVP}

  # ========================================
  # EVENTS
  # ========================================

  def events(%{events: events, pagination: pagination}) do
    %{
      data: for(event <- events, do: event_data(event)),
      pagination: pagination_data(pagination)
    }
  end

  def event(%{event: event}) do
    %{data: event_data(event)}
  end

  defp event_data(%Event{} = event) do
    %{
      id: event.id,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      all_day: event.all_day,
      timezone: event.timezone,
      event_type: event.event_type,
      is_recurring: event.is_recurring,
      recurrence_pattern: event.recurrence_pattern,
      recurrence_end_date: event.recurrence_end_date,
      location: event.location,
      location_url: event.location_url,
      category_id: event.category_id,
      category: maybe_category(event.category),
      visibility: event.visibility,
      forum_id: event.forum_id,
      rsvp_enabled: event.rsvp_enabled,
      rsvp_deadline: event.rsvp_deadline,
      max_attendees: event.max_attendees,
      attendee_count: Map.get(event, :attendee_count, 0),
      author: author_data(event.author),
      inserted_at: event.inserted_at,
      updated_at: event.updated_at
    }
  end
  defp event_data(event) when is_map(event) do
    %{
      id: event[:id] || event["id"],
      title: event[:title] || event["title"],
      description: event[:description] || event["description"],
      start_date: event[:start_date] || event["start_date"],
      end_date: event[:end_date] || event["end_date"],
      all_day: event[:all_day] || event["all_day"],
      timezone: event[:timezone] || event["timezone"],
      event_type: event[:event_type] || event["event_type"],
      visibility: event[:visibility] || event["visibility"],
      category_id: event[:category_id] || event["category_id"]
    }
  end

  defp author_data(nil), do: nil
  defp author_data(author) do
    %{
      id: author.id,
      username: author.username,
      display_name: author.display_name,
      avatar: author.avatar
    }
  end

  defp maybe_category(nil), do: nil
  defp maybe_category(%Ecto.Association.NotLoaded{}), do: nil
  defp maybe_category(category), do: category_data(category)

  # ========================================
  # CATEGORIES
  # ========================================

  def categories(%{categories: categories}) do
    %{data: for(cat <- categories, do: category_data(cat))}
  end

  def category(%{category: category}) do
    %{data: category_data(category)}
  end

  defp category_data(%EventCategory{} = cat) do
    %{
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      description: cat.description,
      order: cat.order,
      event_count: Map.get(cat, :event_count, 0)
    }
  end
  defp category_data(cat) when is_map(cat) do
    %{
      id: cat[:id] || cat["id"],
      name: cat[:name] || cat["name"],
      color: cat[:color] || cat["color"],
      icon: cat[:icon] || cat["icon"]
    }
  end

  # ========================================
  # RSVP
  # ========================================

  def rsvps(%{rsvps: rsvps}) do
    %{data: for(rsvp <- rsvps, do: rsvp_data(rsvp))}
  end

  def rsvp(%{rsvp: rsvp}) do
    %{data: rsvp_data(rsvp)}
  end

  defp rsvp_data(%EventRSVP{} = rsvp) do
    %{
      id: rsvp.id,
      event_id: rsvp.event_id,
      user: rsvp_user_data(rsvp.user),
      status: rsvp.status,
      note: rsvp.note,
      responded_at: rsvp.inserted_at
    }
  end
  defp rsvp_data(rsvp) when is_map(rsvp) do
    %{
      id: rsvp[:id] || rsvp["id"],
      event_id: rsvp[:event_id] || rsvp["event_id"],
      status: rsvp[:status] || rsvp["status"],
      note: rsvp[:note] || rsvp["note"]
    }
  end

  defp rsvp_user_data(nil), do: nil
  defp rsvp_user_data(%Ecto.Association.NotLoaded{}), do: nil
  defp rsvp_user_data(user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar
    }
  end

  # ========================================
  # HELPERS
  # ========================================

  defp pagination_data(nil), do: nil
  defp pagination_data(pagination) do
    %{
      page: pagination[:page] || pagination["page"],
      per_page: pagination[:per_page] || pagination["per_page"],
      total_count: pagination[:total_count] || pagination["total_count"],
      total_pages: pagination[:total_pages] || pagination["total_pages"]
    }
  end
end
