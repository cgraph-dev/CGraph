defmodule CGraph.Accounts.Search do
  @moduledoc """
  User search functionality.

  Handles searching users by various criteria including username, email, UID, etc.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.{ReadRepo, Repo}

  @doc """
  Search users by username, display name, email, or UID (random 10-digit like #4829173650).
  """
  @spec search_users(String.t(), keyword()) :: {[struct()], map()}
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
  @spec get_user_suggestions(String.t(), keyword()) :: [struct()]
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
  Record a search query for a user's search history.
  Deduplicates by upserting on (user_id, query).
  """
  @spec record_search(String.t(), String.t(), non_neg_integer()) :: :ok
  def record_search(user_id, query_text, result_count \\ 0) when is_binary(query_text) do
    cleaned = String.trim(query_text)
    if String.length(cleaned) >= 2 do
      now = DateTime.truncate(DateTime.utc_now(), :second)

      Repo.insert_all("search_history",
        [%{
          id: Ecto.UUID.generate(),
          user_id: user_id,
          query: cleaned,
          result_count: result_count,
          inserted_at: now
        }],
        on_conflict: {:replace, [:result_count, :inserted_at]},
        conflict_target: [:user_id, :query]
      )
    end

    :ok
  end

  @doc """
  Get recent searches for a user, most recent first.
  """
  @spec get_recent_searches(map() | String.t(), keyword()) :: [map()]
  def get_recent_searches(user, opts \\ []) do
    user_id = extract_user_id(user)
    limit = Keyword.get(opts, :limit, 10)

    from(s in "search_history",
      where: s.user_id == type(^user_id, :binary_id),
      order_by: [desc: s.inserted_at],
      limit: ^limit,
      select: %{
        query: s.query,
        result_count: s.result_count,
        searched_at: s.inserted_at
      }
    )
    |> Repo.all()
  end

  @doc """
  Clear search history for a user.
  """
  @spec clear_search_history(map() | String.t()) :: :ok
  def clear_search_history(user) do
    user_id = extract_user_id(user)

    from(s in "search_history", where: s.user_id == type(^user_id, :binary_id))
    |> Repo.delete_all()

    :ok
  end

  defp extract_user_id(%{id: id}), do: id
  defp extract_user_id(id) when is_binary(id), do: id

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
