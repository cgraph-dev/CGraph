defmodule CGraph.Groups.Repositories.MemberRepository do
  @moduledoc """
  Repository for Member entity data access.
  """

  import Ecto.Query, warn: false, except: [update: 2]

  alias CGraph.Cache
  alias CGraph.Groups.Member
  alias CGraph.Repo

  @cache_ttl :timer.minutes(5)

  @doc """
  Get a member by user and group ID.
  """
  @spec get(String.t(), String.t()) :: Member.t() | nil
  def get(group_id, user_id) do
    cache_key = "member:#{group_id}:#{user_id}"

    Cache.fetch(cache_key, fn ->
      from(m in Member,
        where: m.group_id == ^group_id and m.user_id == ^user_id,
        where: is_nil(m.left_at)
      )
      |> Repo.one()
    end, ttl: @cache_ttl)
  end

  @doc """
  Check if a user is a member of a group.
  """
  @spec member?(String.t(), String.t()) :: boolean()
  def member?(group_id, user_id) do
    get(group_id, user_id) != nil
  end

  @doc """
  List members for a group with pagination.
  """
  @spec list_for_group(String.t(), keyword()) :: {list(Member.t()), map()}
  def list_for_group(group_id, opts \\ []) do
    role_id = Keyword.get(opts, :role_id)

    base_query =
      from m in Member,
        where: m.group_id == ^group_id,
        where: is_nil(m.left_at),
        preload: [:user, :roles]

    query =
      if role_id do
        from m in base_query,
          join: r in assoc(m, :roles),
          where: r.id == ^role_id
      else
        base_query
      end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :asc,
      default_limit: 50
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  Create a new member.
  """
  @spec create(map()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    result =
      %Member{}
      |> Member.changeset(attrs)
      |> Repo.insert()

    case result do
      {:ok, member} ->
        invalidate_member_cache(member.group_id, member.user_id)
        {:ok, Repo.preload(member, [:user, :roles])}
      error ->
        error
    end
  end

  @doc """
  Update a member.
  """
  @spec update(Member.t(), map()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def update(%Member{} = member, attrs) do
    result =
      member
      |> Member.changeset(attrs)
      |> Repo.update()

    case result do
      {:ok, updated} ->
        invalidate_member_cache(updated.group_id, updated.user_id)
        {:ok, updated}
      error ->
        error
    end
  end

  @doc """
  Remove a member (soft delete).
  """
  @spec remove(Member.t()) :: {:ok, Member.t()} | {:error, Ecto.Changeset.t()}
  def remove(%Member{} = member) do
    update(member, %{left_at: DateTime.utc_now()})
  end

  @doc """
  Add role to member.
  """
  @spec add_role(Member.t(), String.t()) :: {:ok, Member.t()} | {:error, term()}
  def add_role(%Member{} = member, role_id) do
    member = Repo.preload(member, :roles)
    new_roles = Enum.uniq([role_id | Enum.map(member.roles, & &1.id)])

    member
    |> Member.changeset(%{role_ids: new_roles})
    |> Repo.update()
    |> case do
      {:ok, updated} ->
        invalidate_member_cache(updated.group_id, updated.user_id)
        {:ok, Repo.preload(updated, :roles)}
      error ->
        error
    end
  end

  @doc """
  Remove role from member.
  """
  @spec remove_role(Member.t(), String.t()) :: {:ok, Member.t()} | {:error, term()}
  def remove_role(%Member{} = member, role_id) do
    member = Repo.preload(member, :roles)
    new_roles = member.roles |> Enum.map(& &1.id) |> Enum.reject(&(&1 == role_id))

    member
    |> Member.changeset(%{role_ids: new_roles})
    |> Repo.update()
    |> case do
      {:ok, updated} ->
        invalidate_member_cache(updated.group_id, updated.user_id)
        {:ok, Repo.preload(updated, :roles)}
      error ->
        error
    end
  end

  @doc """
  Get member count for a group.
  """
  @spec count(String.t()) :: integer()
  def count(group_id) do
    from(m in Member,
      where: m.group_id == ^group_id and is_nil(m.left_at),
      select: count(m.id)
    )
    |> Repo.one()
  end

  # Private helpers

  defp invalidate_member_cache(group_id, user_id) do
    Cache.delete("member:#{group_id}:#{user_id}")
  end
end
