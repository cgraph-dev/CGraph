defmodule CGraph.Forums.Core.Listing do
  @moduledoc """
  Forum listing, retrieval, and membership status checks.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete
  alias CGraph.Forums.{Forum, ForumMember, Subscription}
  alias CGraph.Repo

  @doc "List forums accessible to a user (or all public forums if user is nil)."
  @spec list_forums_for_user(struct() | nil, keyword()) :: {[struct()], map()}
  def list_forums_for_user(user, opts) do
    base_query = from f in Forum,
      where: not_deleted(f),
      preload: [:categories, :owner]

    query = case user do
      nil ->
        from f in base_query, where: f.is_public == true
      %{id: user_id} ->
        from f in base_query,
          left_join: m in assoc(f, :memberships),
          where: f.is_public == true or (f.is_public == false and m.user_id == ^user_id),
          distinct: true
    end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :member_count,
      sort_direction: :desc,
      default_limit: 20
    )

    {forums, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    forums = batch_add_membership_status(forums, user)
    {forums, page_info}
  end

  @doc "Add membership and subscription status to a forum struct."
  @spec add_membership_status(struct(), struct() | nil) :: struct()
  def add_membership_status(forum, nil) do
    forum |> Map.put(:is_member, false) |> Map.put(:is_subscribed, false)
  end
  def add_membership_status(forum, user) do
    forum
    |> Map.put(:is_member, forum_member?(user, forum))
    |> Map.put(:is_subscribed, forum_subscribed?(user, forum))
  end

  # Batch-add membership and subscription status to a list of forums (avoids N+1).
  defp batch_add_membership_status(forums, nil) do
    Enum.map(forums, fn forum ->
      forum |> Map.put(:is_member, false) |> Map.put(:is_subscribed, false)
    end)
  end
  defp batch_add_membership_status(forums, user) do
    forum_ids = Enum.map(forums, & &1.id)

    member_set =
      from(m in ForumMember, where: m.user_id == ^user.id and m.forum_id in ^forum_ids, select: m.forum_id)
      |> Repo.all()
      |> MapSet.new()

    subscription_set =
      from(s in Subscription, where: s.user_id == ^user.id and s.forum_id in ^forum_ids, select: s.forum_id)
      |> Repo.all()
      |> MapSet.new()

    Enum.map(forums, fn forum ->
      is_member = forum.owner_id == user.id or MapSet.member?(member_set, forum.id)
      forum
      |> Map.put(:is_member, is_member)
      |> Map.put(:is_subscribed, MapSet.member?(subscription_set, forum.id))
    end)
  end

  @doc "Check if a user is subscribed to a forum."
  @spec forum_subscribed?(struct() | nil, struct()) :: boolean()
  def forum_subscribed?(nil, _forum), do: false
  def forum_subscribed?(user, forum) do
    from(s in Subscription, where: s.user_id == ^user.id and s.forum_id == ^forum.id, select: count(s.id))
    |> Repo.one() |> Kernel.>(0)
  end

  @doc "Check if a user is a member of a forum."
  @spec forum_member?(struct() | nil, struct()) :: boolean()
  def forum_member?(nil, _forum), do: false
  def forum_member?(user, forum) do
    if forum.owner_id == user.id do
      true
    else
      from(m in ForumMember, where: m.user_id == ^user.id and m.forum_id == ^forum.id, select: count(m.id))
      |> Repo.one() |> Kernel.>(0)
    end
  end

  @doc """
  List public forums for the explore/discovery page.

  Returns public forums filtered by optional category, query, and sort.
  Does not require a user context — intended for unauthenticated explore endpoints.
  """
  @spec list_public_forums(keyword()) :: {[struct()], map()}
  def list_public_forums(opts \\ []) do
    category = Keyword.get(opts, :category)
    query_str = Keyword.get(opts, :query)
    sort = Keyword.get(opts, :sort, :popular)
    limit = Keyword.get(opts, :limit, 20)

    base = from f in Forum,
      where: not_deleted(f),
      where: f.is_public == true,
      preload: [:owner]

    base = if category && category != "",
      do: from(f in base, where: f.category == ^category),
      else: base

    base = if query_str && query_str != "",
      do: from(f in base, where: ilike(f.name, ^"%%#{query_str}%%")),
      else: base

    sorted = case sort do
      :newest -> from f in base, order_by: [desc: f.inserted_at]
      :alphabetical -> from f in base, order_by: [asc: f.name]
      _ -> from f in base, order_by: [desc: f.member_count]
    end

    pagination_opts = CGraph.Pagination.parse_params(
      %{limit: limit},
      sort_field: :member_count,
      sort_direction: :desc,
      default_limit: limit
    )

    CGraph.Pagination.paginate(sorted, pagination_opts)
  end

  @doc "Get a single forum by ID."
  @spec get_forum(binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_forum(id) do
    query = from f in Forum, where: f.id == ^id, preload: [:categories, :owner]
    case Repo.one(query) do
      nil -> {:error, :not_found}
      forum -> {:ok, forum}
    end
  end

  @doc "Get a forum by slug."
  @spec get_forum_by_slug(String.t()) :: {:ok, struct()} | {:error, :not_found}
  def get_forum_by_slug(slug) do
    query = from f in Forum, where: f.slug == ^slug, preload: [:categories, :owner]
    case Repo.one(query) do
      nil -> {:error, :not_found}
      forum -> {:ok, forum}
    end
  end
end
