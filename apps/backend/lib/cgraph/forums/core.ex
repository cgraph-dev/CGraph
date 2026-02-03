defmodule CGraph.Forums.Core do
  @moduledoc """
  Core forum operations - CRUD for forums.
  
  Extracted from the main Forums module to reduce complexity.
  """
  
  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Forums.{Forum, ForumMember, Subscription, Category}

  @doc """
  Lists all forums with optional filters.
  """
  def list_forums(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    
    query =
      from(f in Forum,
        where: f.is_public == true,
        order_by: [desc: f.member_count, desc: f.inserted_at],
        preload: [:owner]
      )
    
    query
    |> maybe_filter_by_category(opts[:category_id])
    |> Repo.paginate(page: page, page_size: per_page)
  end
  
  @doc """
  Gets a single forum by ID.
  """
  def get_forum(id) do
    case Repo.get(Forum, id) do
      nil -> {:error, :not_found}
      forum -> {:ok, Repo.preload(forum, [:owner, :categories])}
    end
  end
  
  @doc """
  Gets a forum by its slug.
  """
  def get_forum_by_slug(slug) do
    case Repo.get_by(Forum, slug: slug) do
      nil -> {:error, :not_found}
      forum -> {:ok, Repo.preload(forum, [:owner, :categories])}
    end
  end
  
  @doc """
  Creates a new forum.
  """
  def create_forum(user, attrs) do
    %Forum{}
    |> Forum.changeset(attrs)
    |> Ecto.Changeset.put_assoc(:owner, user)
    |> Repo.insert()
    |> case do
      {:ok, forum} ->
        # Auto-join creator as member
        add_member(forum, user, "owner")
        {:ok, Repo.preload(forum, [:owner])}
      error ->
        error
    end
  end
  
  @doc """
  Updates a forum.
  """
  def update_forum(forum, attrs) do
    forum
    |> Forum.changeset(attrs)
    |> Repo.update()
  end
  
  @doc """
  Deletes a forum.
  """
  def delete_forum(forum) do
    Repo.delete(forum)
  end
  
  @doc """
  Adds a member to a forum.
  """
  def add_member(forum, user, role \\ "member") do
    %ForumMember{}
    |> ForumMember.changeset(%{
      forum_id: forum.id,
      user_id: user.id,
      role: role
    })
    |> Repo.insert(on_conflict: :nothing)
  end
  
  @doc """
  Checks if a user is a member of a forum.
  """
  def member?(forum_id, user_id) do
    Repo.exists?(
      from(m in ForumMember,
        where: m.forum_id == ^forum_id and m.user_id == ^user_id
      )
    )
  end
  
  @doc """
  Subscribes a user to a forum.
  """
  def subscribe(forum, user) do
    %Subscription{}
    |> Subscription.changeset(%{
      forum_id: forum.id,
      user_id: user.id
    })
    |> Repo.insert(on_conflict: :nothing)
  end
  
  @doc """
  Unsubscribes a user from a forum.
  """
  def unsubscribe(forum, user) do
    Repo.delete_all(
      from(s in Subscription,
        where: s.forum_id == ^forum.id and s.user_id == ^user.id
      )
    )
    :ok
  end
  
  # Private helpers
  
  defp maybe_filter_by_category(query, nil), do: query
  defp maybe_filter_by_category(query, category_id) do
    from(f in query, where: f.category_id == ^category_id)
  end
end
