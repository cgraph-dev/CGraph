defmodule CGraph.Explore do
  @moduledoc """
  Community discovery context.

  Aggregates discoverable groups and public forums into a unified
  explore feed for the community discovery page. Supports filtering
  by category, search query, and sort order.
  """

  alias CGraph.Groups.Repositories.GroupRepository
  alias CGraph.Forums

  @type sort :: :popular | :newest | :alphabetical
  @type opts :: [
          category: String.t() | nil,
          sort: sort(),
          query: String.t() | nil,
          limit: pos_integer(),
          offset: non_neg_integer()
        ]

  @categories ~w(gaming technology art music education programming science social sports entertainment)

  @doc """
  Returns a combined list of discoverable groups and public forums,
  sorted and filtered for the explore page.
  """
  @spec discover(keyword()) :: %{communities: list(map()), categories: list(String.t()), total: non_neg_integer()}
  def discover(opts \\ []) do
    category = Keyword.get(opts, :category)
    sort = Keyword.get(opts, :sort, :popular)
    query = Keyword.get(opts, :query)
    limit = Keyword.get(opts, :limit, 20)
    offset = Keyword.get(opts, :offset, 0)

    groups = fetch_groups(category, query, sort, limit, offset)
    forums = fetch_forums(category, query, sort, limit, offset)

    combined =
      Enum.map(groups, &to_community(&1, :group)) ++
        Enum.map(forums, &to_community(&1, :forum))

    sorted =
      combined
      |> sort_communities(sort)
      |> Enum.drop(0)
      |> Enum.take(limit)

    %{communities: sorted, categories: @categories, total: length(sorted)}
  end

  @doc "Returns the list of pre-defined community categories."
  @spec categories() :: list(String.t())
  def categories, do: @categories

  # ── Private ──────────────────────────────────────────────────────────

  defp fetch_groups(category, query, sort, limit, _offset) do
    opts =
      [sort: sort, limit: limit]
      |> maybe_put(:category, category)
      |> maybe_put(:query, query)

    case GroupRepository.list_discoverable(opts) do
      {groups, _meta} -> groups
      groups when is_list(groups) -> groups
    end
  end

  defp fetch_forums(category, query, sort, limit, _offset) do
    opts =
      [sort: sort, limit: limit]
      |> maybe_put(:category, category)
      |> maybe_put(:query, query)

    case Forums.list_public_forums(opts) do
      {forums, _meta} -> forums
      forums when is_list(forums) -> forums
    end
  end

  defp to_community(group, :group) do
    %{
      id: group.id,
      type: :group,
      name: group.name,
      description: Map.get(group, :description),
      member_count: Map.get(group, :member_count, 0),
      avatar_url: Map.get(group, :icon_url),
      category: Map.get(group, :category),
      created_at: group.inserted_at,
      is_verified: Map.get(group, :is_verified, false)
    }
  end

  defp to_community(forum, :forum) do
    %{
      id: forum.id,
      type: :forum,
      name: forum.name,
      description: Map.get(forum, :description),
      member_count: Map.get(forum, :member_count, 0),
      avatar_url: Map.get(forum, :logo_url) || Map.get(forum, :icon_url),
      category: Map.get(forum, :category),
      created_at: forum.inserted_at,
      is_verified: Map.get(forum, :is_verified, false)
    }
  end

  defp sort_communities(communities, :popular),
    do: Enum.sort_by(communities, & &1.member_count, :desc)

  defp sort_communities(communities, :newest),
    do: Enum.sort_by(communities, & &1.created_at, {:desc, DateTime})

  defp sort_communities(communities, :alphabetical),
    do: Enum.sort_by(communities, & &1.name)

  defp sort_communities(communities, _), do: communities

  defp maybe_put(opts, _key, nil), do: opts
  defp maybe_put(opts, _key, ""), do: opts
  defp maybe_put(opts, key, value), do: Keyword.put(opts, key, value)
end
