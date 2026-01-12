defmodule Cgraph.Reputation do
  @moduledoc """
  Context for Reputation system.
  Handles user reputation giving, receiving, and tracking.
  Uses existing reputation_entries table with columns:
  from_user_id, to_user_id, value, post_id, forum_id, comment
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Reputation.ReputationEntry
  alias Cgraph.Accounts.User

  # ========================================
  # QUERIES
  # ========================================

  @doc """
  Get user reputation with pagination.
  """
  def get_user_reputation(user_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    offset = (page - 1) * per_page
    type = Keyword.get(opts, :type)

    base_query =
      from r in ReputationEntry,
        where: r.to_user_id == ^user_id,
        order_by: [desc: r.inserted_at],
        preload: [:from_user, :post]

    base_query =
      case type do
        "positive" -> from r in base_query, where: r.value > 0
        "negative" -> from r in base_query, where: r.value < 0
        _ -> base_query
      end

    total_count = Repo.aggregate(base_query, :count, :id)

    entries =
      base_query
      |> limit(^per_page)
      |> offset(^offset)
      |> Repo.all()

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: max(1, ceil(total_count / per_page))
    }

    summary = get_reputation_summary(user_id)

    {entries, pagination, summary}
  end

  @doc """
  Get reputation summary for a user.
  """
  def get_reputation_summary(user_id) do
    positive =
      from(r in ReputationEntry, where: r.to_user_id == ^user_id and r.value > 0)
      |> Repo.aggregate(:sum, :value) || 0

    negative =
      from(r in ReputationEntry, where: r.to_user_id == ^user_id and r.value < 0)
      |> Repo.aggregate(:sum, :value) || 0

    positive_count =
      from(r in ReputationEntry, where: r.to_user_id == ^user_id and r.value > 0)
      |> Repo.aggregate(:count, :id)

    negative_count =
      from(r in ReputationEntry, where: r.to_user_id == ^user_id and r.value < 0)
      |> Repo.aggregate(:count, :id)

    %{
      total: (positive || 0) + (negative || 0),
      positive: positive || 0,
      negative: negative || 0,
      positive_count: positive_count,
      negative_count: negative_count
    }
  end

  # ========================================
  # GIVING REPUTATION
  # ========================================

  @doc """
  Give reputation to a user.
  """
  def give_reputation(attrs) do
    # Map external field names to database column names
    db_attrs = %{
      from_user_id: attrs[:from_user_id] || attrs[:giver_id],
      to_user_id: attrs[:to_user_id] || attrs[:receiver_id],
      value: attrs[:value] || attrs[:points] || 1,
      post_id: attrs[:post_id],
      forum_id: attrs[:forum_id],
      comment: attrs[:comment]
    }

    with :ok <- validate_can_give(db_attrs.from_user_id, db_attrs.to_user_id) do
      %ReputationEntry{}
      |> ReputationEntry.changeset(db_attrs)
      |> Repo.insert()
      |> case do
        {:ok, entry} ->
          update_user_reputation(db_attrs.to_user_id)
          {:ok, Repo.preload(entry, [:from_user, :post])}
        error -> error
      end
    end
  end

  defp validate_can_give(giver_id, receiver_id) do
    # Can't give rep to yourself
    if giver_id == receiver_id do
      {:error, :cannot_rep_self}
    else
      # Check if giver already gave rep to this user today
      today = Date.utc_today()
      start_of_day = DateTime.new!(today, ~T[00:00:00], "Etc/UTC")

      existing =
        from(r in ReputationEntry,
          where: r.from_user_id == ^giver_id and r.to_user_id == ^receiver_id,
          where: r.inserted_at >= ^start_of_day
        )
        |> Repo.exists?()

      if existing do
        {:error, :already_given_today}
      else
        :ok
      end
    end
  end

  defp update_user_reputation(user_id) do
    summary = get_reputation_summary(user_id)

    from(u in User, where: u.id == ^user_id)
    |> Repo.update_all(set: [reputation: summary.total])
  end
end
