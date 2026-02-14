defmodule CGraph.Calendar do
  @moduledoc """
  Context for Calendar and Events system.
  Handles event management, categories, and RSVPs.

  ## Features
  - Event CRUD with rich metadata
  - Event categories
  - RSVP management
  - Recurring events
  - Privacy controls
  """

  import Ecto.Query, warn: false
  alias CGraph.Calendar.{Event, EventCategory, EventRSVP}
  alias CGraph.Repo

  # ========================================
  # EVENTS
  # ========================================

  @doc """
  List events with filtering.
  """
  def list_events(user, opts \\ []) do
    user_id = extract_user_id(user)
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    offset = (page - 1) * per_page

    year = Keyword.get(opts, :year)
    month = Keyword.get(opts, :month)
    category_id = Keyword.get(opts, :category_id)
    visibility = Keyword.get(opts, :visibility)
    forum_id = Keyword.get(opts, :forum_id)

    base_query =
      from e in Event,
        left_join: c in assoc(e, :category),
        left_join: a in assoc(e, :author),
        where: e.visibility == "public" or e.author_id == ^user_id,
        order_by: [asc: e.start_date],
        preload: [:category, :author]

    base_query =
      if year && month do
        start_of_month = Date.new!(year, month, 1)
        end_of_month = Date.end_of_month(start_of_month)

        from e in base_query,
          where: fragment("?::date >= ? AND ?::date <= ?", e.start_date, ^start_of_month, e.start_date, ^end_of_month)
      else
        base_query
      end

    base_query =
      if category_id do
        from e in base_query, where: e.category_id == ^category_id
      else
        base_query
      end

    base_query =
      if visibility do
        from e in base_query, where: e.visibility == ^visibility
      else
        base_query
      end

    base_query =
      if forum_id do
        from e in base_query, where: e.forum_id == ^forum_id
      else
        base_query
      end

    total_count = Repo.aggregate(base_query, :count, :id)

    events =
      base_query
      |> limit(^per_page)
      |> offset(^offset)
      |> Repo.all()

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: ceil(total_count / per_page)
    }

    {events, pagination}
  end

  @doc """
  Get a single event.
  """
  def get_event(id, user) do
    user_id = extract_user_id(user)

    query =
      from e in Event,
        where: e.id == ^id,
        where: e.visibility == "public" or e.author_id == ^user_id,
        preload: [:category, :author]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      event -> {:ok, add_attendee_count(event)}
    end
  end

  defp add_attendee_count(event) do
    count =
      from(r in EventRSVP, where: r.event_id == ^event.id and r.status == "going")
      |> Repo.aggregate(:count, :id)

    Map.put(event, :attendee_count, count)
  end

  @doc """
  Create an event.
  """
  def create_event(attrs) do
    %Event{}
    |> Event.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update an event.
  """
  def update_event(%Event{} = event, attrs) do
    event
    |> Event.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete an event.
  """
  def delete_event(%Event{} = event) do
    Repo.delete(event)
  end

  # ========================================
  # CATEGORIES
  # ========================================

  @doc """
  List all event categories.
  """
  def list_categories do
    from(c in EventCategory, order_by: [asc: c.order, asc: c.name])
    |> Repo.all()
    |> Enum.map(&add_event_count/1)
  end

  defp add_event_count(category) do
    count =
      from(e in Event, where: e.category_id == ^category.id)
      |> Repo.aggregate(:count, :id)

    Map.put(category, :event_count, count)
  end

  @doc """
  Get a category by ID.
  """
  def get_category(id) do
    case Repo.get(EventCategory, id) do
      nil -> {:error, :not_found}
      category -> {:ok, category}
    end
  end

  @doc """
  Create a category.
  """
  def create_category(attrs) do
    %EventCategory{}
    |> EventCategory.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a category.
  """
  def update_category(%EventCategory{} = category, attrs) do
    category
    |> EventCategory.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a category.
  """
  def delete_category(%EventCategory{} = category) do
    # Optionally remove category from events first
    from(e in Event, where: e.category_id == ^category.id)
    |> Repo.update_all(set: [category_id: nil])

    Repo.delete(category)
  end

  # ========================================
  # RSVP
  # ========================================

  @doc """
  List RSVPs for an event.
  """
  def list_event_rsvps(event_id) do
    from(r in EventRSVP,
      where: r.event_id == ^event_id,
      order_by: [asc: r.inserted_at],
      preload: [:user]
    )
    |> Repo.all()
  end

  @doc """
  Create or update RSVP.
  """
  def create_or_update_rsvp(attrs) do
    case Repo.get_by(EventRSVP, event_id: attrs.event_id, user_id: attrs.user_id) do
      nil ->
        %EventRSVP{}
        |> EventRSVP.changeset(attrs)
        |> Repo.insert()

      existing ->
        existing
        |> EventRSVP.changeset(attrs)
        |> Repo.update()
    end
  end

  @doc """
  Cancel RSVP.
  """
  def cancel_rsvp(event_id, user_id) do
    case Repo.get_by(EventRSVP, event_id: event_id, user_id: user_id) do
      nil -> {:error, :not_found}
      rsvp -> Repo.delete(rsvp)
    end
  end

  @doc """
  Get RSVP counts for an event.
  """
  def get_rsvp_counts(event_id) do
    query =
      from r in EventRSVP,
        where: r.event_id == ^event_id,
        group_by: r.status,
        select: {r.status, count(r.id)}

    Repo.all(query)
    |> Enum.into(%{})
  end

  defp extract_user_id(%{id: id}), do: id
  defp extract_user_id(id) when is_binary(id), do: id
end
