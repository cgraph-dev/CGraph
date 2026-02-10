defmodule CGraph.Accounts.Search do
  @moduledoc """
  User search functionality.

  Handles searching users by various criteria including username, email, UID, etc.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.Repo
  alias CGraph.ReadRepo

  @doc """
  Search users by username, display name, email, or UID (random 10-digit like #4829173650).
  """
  def search_users(query, opts \\ []) do
    search_term = "%#{query}%"

    # Check if query is a UID format (10-digit string or legacy numeric)
    uid_query = parse_uid_query(query)
    legacy_user_id = parse_legacy_user_id(query)

    # Build base query with text-based search conditions
    base_conditions = dynamic([u],
      ilike(u.username, ^search_term) or
      ilike(u.display_name, ^search_term) or
      ilike(u.email, ^search_term)
    )

    # Add UID condition if a valid UID was parsed
    conditions = if uid_query do
      dynamic([u], ^base_conditions or u.uid == ^uid_query)
    else
      base_conditions
    end

    # Add legacy user_id condition if a valid legacy ID was parsed
    conditions = if legacy_user_id do
      dynamic([u], ^conditions or u.user_id == ^legacy_user_id)
    else
      conditions
    end

    db_query = from u in User,
      where: ^conditions

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :username,
      sort_direction: :asc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(db_query, pagination_opts)
  end

  @doc """
  Get user suggestions for autocomplete.
  """
  def get_user_suggestions(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)
    search_term = "#{query}%"

    from(u in User,
      where: ilike(u.username, ^search_term),
      order_by: [asc: u.username],
      limit: ^limit
    )
    |> ReadRepo.all()
  end

  @doc """
  Get recent searches (placeholder for future implementation).
  """
  def get_recent_searches(_user, _opts \\ []) do
    []
  end

  @doc """
  Clear search history (placeholder for future implementation).
  """
  def clear_search_history(_user) do
    :ok
  end

  # Parse UID query - handles formats like #4829173650 or 4829173650 (10-digit string)
  defp parse_uid_query(query) when is_binary(query) do
    cleaned = query |> String.replace("#", "") |> String.trim()
    # Only match if it looks like a 10-digit UID
    if Regex.match?(~r/^\d{10}$/, cleaned) do
      cleaned
    else
      nil
    end
  end
  defp parse_uid_query(_), do: nil

  # Parse legacy user_id for backward compatibility (numeric 1-4 digit IDs)
  defp parse_legacy_user_id(query) when is_binary(query) do
    cleaned = query |> String.replace("#", "") |> String.trim()
    case Integer.parse(cleaned) do
      {num, ""} when num > 0 and num < 10_000 -> num  # Legacy IDs are 1-9999
      _ -> nil
    end
  end
  defp parse_legacy_user_id(_), do: nil
end
