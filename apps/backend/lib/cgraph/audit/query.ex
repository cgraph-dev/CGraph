defmodule CGraph.Audit.Query do
  @moduledoc """
  Query filter and aggregation helpers for audit log entries.

  Provides functions to filter, paginate, and aggregate audit entries
  by category, event type, actor, target, and date range.
  """

  @type audit_entry :: %{
          id: String.t(),
          category: atom(),
          event_type: atom(),
          actor_id: String.t() | nil,
          actor_type: :user | :system | :admin,
          target_id: String.t() | nil,
          target_type: atom() | nil,
          metadata: map(),
          ip_address: String.t() | nil,
          user_agent: String.t() | nil,
          session_id: String.t() | nil,
          request_id: String.t() | nil,
          timestamp: DateTime.t(),
          checksum: String.t()
        }

  @doc """
  Filters audit entries based on the given options.

  ## Options

  - `:category` - Filter by event category
  - `:event_type` - Filter by event type
  - `:actor_id` - Filter by actor ID
  - `:target_id` - Filter by target ID
  - `:from` - Start date (inclusive)
  - `:to` - End date (inclusive)
  - `:limit` - Maximum number of entries (default: 100)
  - `:offset` - Pagination offset (default: 0)
  """
  @spec filter_entries([audit_entry()], keyword()) :: [audit_entry()]
  def filter_entries(entries, opts) do
    entries
    |> maybe_filter_category(opts[:category])
    |> maybe_filter_event_type(opts[:event_type])
    |> maybe_filter_actor(opts[:actor_id])
    |> maybe_filter_target(opts[:target_id])
    |> maybe_filter_date_range(opts[:from], opts[:to])
    |> limit_entries(opts[:limit] || 100, opts[:offset] || 0)
  end

  @doc """
  Filters entries by category. Returns all entries if category is `nil`.
  """
  @spec maybe_filter_category([audit_entry()], atom() | nil) :: [audit_entry()]
  def maybe_filter_category(entries, nil), do: entries

  def maybe_filter_category(entries, category) do
    Enum.filter(entries, &(&1.category == category))
  end

  @doc """
  Filters entries by event type. Returns all entries if event_type is `nil`.
  """
  @spec maybe_filter_event_type([audit_entry()], atom() | nil) :: [audit_entry()]
  def maybe_filter_event_type(entries, nil), do: entries

  def maybe_filter_event_type(entries, event_type) do
    Enum.filter(entries, &(&1.event_type == event_type))
  end

  @doc """
  Filters entries by actor ID. Returns all entries if actor_id is `nil`.
  """
  @spec maybe_filter_actor([audit_entry()], String.t() | nil) :: [audit_entry()]
  def maybe_filter_actor(entries, nil), do: entries

  def maybe_filter_actor(entries, actor_id) do
    Enum.filter(entries, &(&1.actor_id == actor_id))
  end

  @doc """
  Filters entries by target ID. Returns all entries if target_id is `nil`.
  """
  @spec maybe_filter_target([audit_entry()], String.t() | nil) :: [audit_entry()]
  def maybe_filter_target(entries, nil), do: entries

  def maybe_filter_target(entries, target_id) do
    Enum.filter(entries, &(&1.target_id == target_id))
  end

  @doc """
  Filters entries by date range. Returns all entries if both `from` and `to` are `nil`.
  """
  @spec maybe_filter_date_range([audit_entry()], Date.t() | nil, Date.t() | nil) ::
          [audit_entry()]
  def maybe_filter_date_range(entries, nil, nil), do: entries

  def maybe_filter_date_range(entries, from, to) do
    Enum.filter(entries, fn entry ->
      (from == nil or Date.compare(DateTime.to_date(entry.timestamp), from) != :lt) and
        (to == nil or Date.compare(DateTime.to_date(entry.timestamp), to) != :gt)
    end)
  end

  @doc """
  Applies limit and offset pagination to a list of entries.
  """
  @spec limit_entries([audit_entry()], non_neg_integer(), non_neg_integer()) :: [audit_entry()]
  def limit_entries(entries, limit, offset) do
    entries
    |> Enum.drop(offset)
    |> Enum.take(limit)
  end

  @doc """
  Counts entries grouped by category.
  """
  @spec count_by_category([audit_entry()]) :: %{atom() => non_neg_integer()}
  def count_by_category(entries) do
    Enum.frequencies_by(entries, & &1.category)
  end

  @doc """
  Counts entries grouped by `{category, event_type}` tuple.
  """
  @spec count_by_event([audit_entry()]) :: %{{atom(), atom()} => non_neg_integer()}
  def count_by_event(entries) do
    Enum.frequencies_by(entries, fn entry ->
      {entry.category, entry.event_type}
    end)
  end
end
