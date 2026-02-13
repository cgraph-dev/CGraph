defmodule CGraph.Groups.Repositories.GroupRepository do
  @moduledoc """
  Repository for Group entity data access.
  """

  import Ecto.Query, warn: false, except: [update: 2]

  alias CGraph.Cache
  alias CGraph.Groups.Group
  alias CGraph.Groups.Member
  alias CGraph.Repo

  @cache_ttl :timer.minutes(10)

  @doc """
  Get a group by ID.
  """
  @spec get(String.t(), list()) :: Group.t() | nil
  def get(id, preloads \\ []) do
    cache_key = "group:#{id}"

    Cache.fetch(cache_key, fn ->
      Group |> Repo.get(id)
    end, ttl: @cache_ttl)
    |> maybe_preload(preloads)
  end

  @doc """
  Get a group by ID, raising if not found.
  """
  @spec get!(String.t(), list()) :: Group.t()
  def get!(id, preloads \\ []) do
    case get(id, preloads) do
      nil -> raise Ecto.NoResultsError, queryable: Group
      group -> group
    end
  end

  @doc """
  Find a group by vanity URL.
  """
  @spec find_by_vanity_url(String.t()) :: Group.t() | nil
  def find_by_vanity_url(vanity_url) do
    from(g in Group, where: g.vanity_url == ^vanity_url)
    |> Repo.one()
  end

  @doc """
  List groups for a user.
  """
  @spec list_for_user(String.t(), keyword()) :: {list(Group.t()), map()}
  def list_for_user(user_id, opts \\ []) do
    query =
      from g in Group,
        join: m in Member,
        on: m.group_id == g.id,
        where: m.user_id == ^user_id,
        where: is_nil(m.left_at),
        preload: [:owner]

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 50
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  List public/discoverable groups.
  """
  @spec list_discoverable(keyword()) :: {list(Group.t()), map()}
  def list_discoverable(opts \\ []) do
    sort = Keyword.get(opts, :sort, :popular)

    base_query =
      from g in Group,
        where: g.is_public == true,
        where: g.is_discoverable == true,
        preload: [:owner]

    # Apply sort-specific ordering before pagination
    query =
      case sort do
        :popular ->
          from g in base_query, order_by: [desc: g.member_count]
        :newest ->
          from g in base_query, order_by: [desc: g.inserted_at]
        :name ->
          from g in base_query, order_by: [asc: g.name]
        _ ->
          from g in base_query, order_by: [desc: g.member_count]
      end

    sort_field = case sort do
      :newest -> :inserted_at
      :name -> :name
      _ -> :member_count
    end

    sort_dir = if sort == :name, do: :asc, else: :desc

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: sort_field,
      sort_direction: sort_dir,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  Create a new group.
  """
  @spec create(map()) :: {:ok, Group.t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    %Group{}
    |> Group.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a group.
  """
  @spec update(Group.t(), map()) :: {:ok, Group.t()} | {:error, Ecto.Changeset.t()}
  def update(%Group{} = group, attrs) do
    result =
      group
      |> Group.changeset(attrs)
      |> Repo.update()

    case result do
      {:ok, updated} ->
        Cache.delete("group:#{updated.id}")
        {:ok, updated}
      error ->
        error
    end
  end

  @doc """
  Increment member count.
  """
  @spec increment_member_count(String.t()) :: {:ok, Group.t()} | {:error, term()}
  def increment_member_count(group_id) do
    from(g in Group, where: g.id == ^group_id)
    |> Repo.update_all(inc: [member_count: 1])

    Cache.delete("group:#{group_id}")
    {:ok, get!(group_id)}
  end

  @doc """
  Decrement member count.
  """
  @spec decrement_member_count(String.t()) :: {:ok, Group.t()} | {:error, term()}
  def decrement_member_count(group_id) do
    from(g in Group, where: g.id == ^group_id, where: g.member_count > 0)
    |> Repo.update_all(inc: [member_count: -1])

    Cache.delete("group:#{group_id}")
    {:ok, get!(group_id)}
  end

  @doc """
  Search groups by name.
  """
  @spec search(String.t(), keyword()) :: list(Group.t())
  def search(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    search_query = "%#{query}%"

    from(g in Group,
      where: g.is_public == true,
      where: ilike(g.name, ^search_query) or ilike(g.description, ^search_query),
      order_by: [desc: g.member_count],
      limit: ^limit,
      preload: [:owner]
    )
    |> Repo.all()
  end

  # Private helpers

  defp maybe_preload(nil, _), do: nil
  defp maybe_preload(record, []), do: record
  defp maybe_preload(record, preloads), do: Repo.preload(record, preloads)
end
