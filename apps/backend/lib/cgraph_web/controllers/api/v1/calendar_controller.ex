defmodule CgraphWeb.API.V1.CalendarController do
  @moduledoc """
  Controller for Calendar and Events system.
  Implements MyBB-style calendar with events, categories, and RSVP.

  ## Features
  - Event CRUD
  - Event categories
  - RSVP functionality
  - Recurring events
  - Privacy controls
  """
  use CgraphWeb, :controller

  import CgraphWeb.Helpers.ParamParser

  alias Cgraph.Calendar
  alias Cgraph.Calendar.{Event, EventCategory, EventRSVP}

  action_fallback CgraphWeb.FallbackController

  @max_per_page 100

  # ========================================
  # EVENTS
  # ========================================

  @doc """
  List events with optional filtering.
  """
  def list_events(conn, params) do
    user = conn.assigns.current_user

    opts = [
      year: parse_int(params["year"], nil),
      month: parse_int(params["month"], nil),
      category_id: Map.get(params, "category_id"),
      visibility: Map.get(params, "visibility"),
      forum_id: Map.get(params, "forum_id"),
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 50), @max_per_page)
    ]

    {events, pagination} = Calendar.list_events(user, opts)
    render(conn, :events, events: events, pagination: pagination)
  end

  @doc """
  Get a single event.
  """
  def show_event(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, event} <- Calendar.get_event(id, user) do
      render(conn, :event, event: event)
    end
  end

  @doc """
  Create a new event.
  """
  def create_event(conn, params) do
    user = conn.assigns.current_user

    attrs = %{
      author_id: user.id,
      title: params["title"],
      description: params["description"],
      start_date: parse_datetime(params["start_date"]),
      end_date: parse_datetime(params["end_date"]),
      all_day: parse_bool(params["all_day"], false),
      timezone: params["timezone"] || "UTC",
      event_type: params["event_type"] || params["type"] || "single",
      is_recurring: parse_bool(params["is_recurring"], false),
      recurrence_pattern: params["recurrence_pattern"],
      recurrence_end_date: parse_datetime(params["recurrence_end_date"]),
      location: params["location"],
      location_url: params["location_url"],
      category_id: params["category_id"],
      visibility: params["visibility"] || "public",
      forum_id: params["forum_id"],
      rsvp_enabled: parse_bool(params["rsvp_enabled"], false),
      rsvp_deadline: parse_datetime(params["rsvp_deadline"]),
      max_attendees: parse_int(params["max_attendees"], nil)
    }

    with {:ok, %Event{} = event} <- Calendar.create_event(attrs) do
      conn
      |> put_status(:created)
      |> render(:event, event: event)
    end
  end

  @doc """
  Update an event.
  """
  def update_event(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, event} <- Calendar.get_event(id, user),
         :ok <- authorize_modify(event, user),
         {:ok, updated} <- Calendar.update_event(event, params) do
      render(conn, :event, event: updated)
    end
  end

  @doc """
  Delete an event.
  """
  def delete_event(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, event} <- Calendar.get_event(id, user),
         :ok <- authorize_modify(event, user),
         {:ok, _} <- Calendar.delete_event(event) do
      send_resp(conn, :no_content, "")
    end
  end

  # ========================================
  # CATEGORIES
  # ========================================

  @doc """
  List event categories.
  """
  def list_categories(conn, _params) do
    categories = Calendar.list_categories()
    render(conn, :categories, categories: categories)
  end

  @doc """
  Create a category (admin only).
  """
  def create_category(conn, params) do
    user = conn.assigns.current_user

    with :ok <- authorize_admin(user) do
      attrs = %{
        name: params["name"],
        color: params["color"] || "#6366f1",
        icon: params["icon"],
        description: params["description"],
        order: parse_int(params["order"], 0)
      }

      with {:ok, %EventCategory{} = category} <- Calendar.create_category(attrs) do
        conn
        |> put_status(:created)
        |> render(:category, category: category)
      end
    end
  end

  @doc """
  Update a category (admin only).
  """
  def update_category(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    with :ok <- authorize_admin(user),
         {:ok, category} <- Calendar.get_category(id),
         {:ok, updated} <- Calendar.update_category(category, params) do
      render(conn, :category, category: updated)
    end
  end

  @doc """
  Delete a category (admin only).
  """
  def delete_category(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with :ok <- authorize_admin(user),
         {:ok, category} <- Calendar.get_category(id),
         {:ok, _} <- Calendar.delete_category(category) do
      send_resp(conn, :no_content, "")
    end
  end

  # ========================================
  # RSVP
  # ========================================

  @doc """
  List RSVPs for an event.
  """
  def list_rsvps(conn, %{"id" => event_id}) do
    user = conn.assigns.current_user

    with {:ok, event} <- Calendar.get_event(event_id, user) do
      rsvps = Calendar.list_event_rsvps(event.id)
      render(conn, :rsvps, rsvps: rsvps)
    end
  end

  @doc """
  RSVP to an event.
  """
  def rsvp(conn, %{"id" => event_id} = params) do
    user = conn.assigns.current_user

    with {:ok, event} <- Calendar.get_event(event_id, user) do
      attrs = %{
        event_id: event.id,
        user_id: user.id,
        status: params["status"] || "going",
        note: params["note"]
      }

      with {:ok, %EventRSVP{} = rsvp} <- Calendar.create_or_update_rsvp(attrs) do
        render(conn, :rsvp, rsvp: rsvp)
      end
    end
  end

  @doc """
  Cancel RSVP.
  """
  def cancel_rsvp(conn, %{"id" => event_id}) do
    user = conn.assigns.current_user

    with {:ok, event} <- Calendar.get_event(event_id, user),
         {:ok, _} <- Calendar.cancel_rsvp(event.id, user.id) do
      send_resp(conn, :no_content, "")
    end
  end

  # ========================================
  # HELPERS
  # ========================================

  defp authorize_modify(%Event{author_id: author_id}, %{id: user_id})
       when author_id == user_id do
    :ok
  end
  defp authorize_modify(_event, user) do
    if user.is_admin || user.is_moderator do
      :ok
    else
      {:error, :forbidden}
    end
  end

  defp authorize_admin(user) do
    if user.is_admin do
      :ok
    else
      {:error, :forbidden}
    end
  end

  defp parse_datetime(nil), do: nil
  defp parse_datetime(val) when is_binary(val) do
    case DateTime.from_iso8601(val) do
      {:ok, dt, _offset} -> dt
      {:error, _} ->
        case NaiveDateTime.from_iso8601(val) do
          {:ok, ndt} -> DateTime.from_naive!(ndt, "Etc/UTC")
          {:error, _} -> nil
        end
    end
  end
  defp parse_datetime(%DateTime{} = dt), do: dt
  defp parse_datetime(_), do: nil
end
