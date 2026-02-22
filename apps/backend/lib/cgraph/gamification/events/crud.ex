defmodule CGraph.Gamification.Events.Crud do
  @moduledoc """
  CRUD operations and state management for seasonal events.

  Handles creating, reading, updating, and deleting events,
  as well as lifecycle transitions (start, pause, resume, end).
  """

  import Ecto.Query, warn: false
  require Logger

  alias CGraph.Gamification.SeasonalEvent
  alias CGraph.Repo

  # ============================================================================
  # Event CRUD Operations
  # ============================================================================

  @doc """
  List events with pagination and filtering.
  """
  @spec list_events_paginated(map(), keyword()) :: {:ok, map()} | {:error, term()}
  def list_events_paginated(filters \\ %{}, opts \\ []) do
    base_query = from(e in SeasonalEvent)

    query = base_query
    |> filter_by_status(filters[:status])
    |> filter_by_type(filters[:event_type])
    |> filter_by_active(Keyword.get(opts, :include_inactive, false))

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :starts_at,
      sort_direction: :desc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  defp filter_by_status(query, nil), do: query
  defp filter_by_status(query, status) when is_binary(status) do
    from(e in query, where: e.status == ^status)
  end

  defp filter_by_type(query, nil), do: query
  defp filter_by_type(query, type) when is_binary(type) do
    from(e in query, where: e.event_type == ^type)
  end

  defp filter_by_active(query, true), do: query
  defp filter_by_active(query, false) do
    from(e in query, where: e.is_active == true)
  end

  @doc """
  Get a single event by ID.
  """
  @spec get_event(String.t()) :: {:ok, SeasonalEvent.t()} | {:error, :not_found}
  def get_event(id) do
    case Repo.get(SeasonalEvent, id) do
      nil -> {:error, :not_found}
      event -> {:ok, event}
    end
  end

  @doc """
  Get event by slug.
  """
  @spec get_event_by_slug(String.t()) :: {:ok, SeasonalEvent.t()} | {:error, :not_found}
  def get_event_by_slug(slug) do
    case Repo.get_by(SeasonalEvent, slug: slug) do
      nil -> {:error, :not_found}
      event -> {:ok, event}
    end
  end

  @doc """
  Get event with analytics data.
  """
  @spec get_event_with_analytics(String.t()) :: {:ok, map()} | {:error, :not_found}
  def get_event_with_analytics(id) do
    case Repo.get(SeasonalEvent, id) do
      nil ->
        {:error, :not_found}
      event ->
        analytics = CGraph.Gamification.Events.Participation.calculate_event_analytics(id)
        {:ok, %{event: event, analytics: analytics}}
    end
  end

  @doc """
  Create a new event.
  """
  @spec create_event(map(), keyword()) :: {:ok, SeasonalEvent.t()} | {:error, Ecto.Changeset.t()}
  def create_event(attrs, opts \\ []) do
    created_by = Keyword.get(opts, :created_by)
    Logger.info("events_creating_event_by", attrs: inspect(attrs), created_by: inspect(created_by))

    changeset = %SeasonalEvent{} |> SeasonalEvent.changeset(attrs)

    case Repo.insert(changeset) do
      {:ok, event} ->
        Logger.info("events_created_event", event_id: event.id, event_name: event.name)
        {:ok, event}
      {:error, changeset} ->
        Logger.warning("events_failed_to_create_event", changeset_errors: inspect(changeset.errors))
        {:error, changeset}
    end
  end

  @doc """
  Update an existing event.
  """
  @spec update_event(SeasonalEvent.t() | String.t(), map()) ::
          {:ok, SeasonalEvent.t()} | {:error, term()}
  def update_event(%SeasonalEvent{} = event, attrs) do
    changeset = SeasonalEvent.changeset(event, attrs)

    case Repo.update(changeset) do
      {:ok, updated} ->
        Logger.info("events_updated_event", updated_id: updated.id)
        {:ok, updated}
      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def update_event(event_id, attrs) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> update_event(event, attrs)
      error -> error
    end
  end

  @doc """
  Delete an event (soft delete).
  """
  @spec delete_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  def delete_event(%SeasonalEvent{} = event) do
    update_event(event, %{is_active: false})
  end

  def delete_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> delete_event(event)
      error -> error
    end
  end

  # ============================================================================
  # Event State Management
  # ============================================================================

  @doc """
  Start an event.
  """
  @spec start_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  def start_event(%SeasonalEvent{} = event) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    attrs = %{status: "active", starts_at: min_datetime(event.starts_at, now)}
    update_event(event, attrs)
  end

  def start_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> start_event(event)
      error -> error
    end
  end

  defp min_datetime(a, b) do
    if DateTime.compare(a, b) == :lt, do: a, else: b
  end

  @doc """
  Pause an active event.
  """
  @spec pause_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  def pause_event(%SeasonalEvent{} = event) do
    update_event(event, %{status: "upcoming"})
  end

  def pause_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> pause_event(event)
      error -> error
    end
  end

  @doc """
  Resume a paused event.
  """
  @spec resume_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  def resume_event(%SeasonalEvent{} = event) do
    update_event(event, %{status: "active"})
  end

  def resume_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> resume_event(event)
      error -> error
    end
  end

  @doc """
  End an event.
  """
  @spec end_event(SeasonalEvent.t() | String.t()) :: {:ok, SeasonalEvent.t()} | {:error, term()}
  def end_event(%SeasonalEvent{} = event) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    attrs = %{status: "ended", ends_at: min_datetime(event.ends_at, now)}
    update_event(event, attrs)
  end

  def end_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> end_event(event)
      error -> error
    end
  end
end
