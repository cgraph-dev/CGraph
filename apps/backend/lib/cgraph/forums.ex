defmodule Cgraph.Forums do
  @moduledoc """
  The Forums context.
  
  Handles forums, posts, comments, categories, and voting.
  Reddit-style discussion functionality.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Forums.{Forum, Post, Comment, Category, Vote, Moderator, Subscription}

  # ============================================================================
  # Forums
  # ============================================================================

  @doc """
  List all public forums.
  """
  def list_forums(opts \\ []) do
    list_forums_for_user(nil, opts)
  end

  @doc """
  List forums accessible to a user.
  """
  def list_forums_for_user(_user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    # Filter out deleted forums (no is_archived field in schema)
    query = from f in Forum,
      where: is_nil(f.deleted_at),
      order_by: [desc: f.member_count],
      preload: [:categories, :owner]

    total = Repo.aggregate(query, :count, :id)
    
    forums = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {forums, meta}
  end

  @doc """
  Get a forum by ID.
  """
  def get_forum(id) do
    query = from f in Forum,
      where: f.id == ^id,
      preload: [:categories, :owner]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      forum -> {:ok, forum}
    end
  end

  @doc """
  Get a forum by slug.
  """
  def get_forum_by_slug(slug) do
    query = from f in Forum,
      where: f.slug == ^slug,
      preload: [:categories, :owner]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      forum -> {:ok, forum}
    end
  end

  @doc """
  Authorize an action on a forum.
  Actions: :view, :vote, :comment, :create_post, :moderate, :delete
  """
  def authorize_action(user, forum, action) do
    cond do
      action == :view && forum.is_public -> :ok
      forum.owner_id == user.id -> :ok
      is_moderator?(forum, user) -> :ok
      action in [:view, :vote, :comment, :create_post] -> :ok
      true -> {:error, :insufficient_permissions}
    end
  end

  @doc """
  Check if user is a moderator of a forum.
  
  Returns true if the user is either:
  - The forum owner
  - Listed as a moderator
  """
  def is_moderator?(forum, user) do
    # Check if user is forum owner or in moderators list
    forum.owner_id == user.id || is_in_moderators?(forum, user)
  end
  
  defp is_in_moderators?(forum, user) do
    # Check moderators association if loaded
    case forum.moderators do
      %Ecto.Association.NotLoaded{} ->
        # Query the database
        query = from m in Moderator,
          where: m.forum_id == ^forum.id,
          where: m.user_id == ^user.id,
          limit: 1
        Repo.exists?(query)
      moderators when is_list(moderators) ->
        Enum.any?(moderators, fn mod -> mod.user_id == user.id end)
    end
  end

  @doc """
  Add a moderator to a forum.
  """
  def add_moderator(forum, user, opts \\ []) do
    permissions = Keyword.get(opts, :permissions, [])
    added_by_id = Keyword.get(opts, :added_by_id)
    notes = Keyword.get(opts, :notes)
    
    %Moderator{}
    |> Moderator.changeset(%{
      forum_id: forum.id,
      user_id: user.id,
      permissions: permissions,
      added_by_id: added_by_id,
      notes: notes
    })
    |> Repo.insert()
  end

  @doc """
  Remove a moderator from a forum.
  """
  def remove_moderator(forum, user) do
    query = from m in Moderator,
      where: m.forum_id == ^forum.id,
      where: m.user_id == ^user.id
    
    case Repo.one(query) do
      nil -> {:error, :not_found}
      moderator -> Repo.delete(moderator)
    end
  end

  @doc """
  Create a forum.
  """
  def create_forum(user, attrs) do
    # Convert to string keys for consistency
    attrs = attrs |> stringify_keys() |> Map.put("owner_id", user.id)
    
    %Forum{}
    |> Forum.changeset(attrs)
    |> Repo.insert()
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  @doc """
  Update a forum.
  """
  def update_forum(forum, attrs) do
    forum
    |> Forum.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a forum.
  """
  def delete_forum(forum) do
    Repo.delete(forum)
  end

  @doc """
  Get forum statistics.
  """
  def get_forum_stats(forum) do
    post_count = Repo.aggregate(from(p in Post, where: p.forum_id == ^forum.id), :count, :id)
    comment_count = Repo.aggregate(
      from(c in Comment,
        join: p in Post, on: c.post_id == p.id,
        where: p.forum_id == ^forum.id
      ),
      :count,
      :id
    )

    %{
      post_count: post_count,
      comment_count: comment_count,
      member_count: forum.member_count || 0
    }
  end

  @doc """
  Get moderation queue.
  """
  def get_mod_queue(_forum, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    _filter = Keyword.get(opts, :filter, "all")

    # TODO: Implement moderation queue
    {[], %{page: page, per_page: per_page, total: 0}}
  end

  @doc """
  Subscribe to forum.
  """
  def subscribe_to_forum(user, forum) do
    %Subscription{}
    |> Subscription.changeset(%{
      forum_id: forum.id,
      user_id: user.id
    })
    |> Repo.insert(on_conflict: :nothing, conflict_target: [:forum_id, :user_id])
    |> case do
      {:ok, subscription} -> {:ok, subscription}
      {:error, changeset} -> {:error, changeset}
    end
  end

  @doc """
  Subscribe to forum (alias).
  """
  def subscribe(forum, user), do: subscribe_to_forum(user, forum)

  @doc """
  Unsubscribe from forum.
  """
  def unsubscribe_from_forum(user, forum) do
    query = from s in Subscription,
      where: s.forum_id == ^forum.id,
      where: s.user_id == ^user.id

    case Repo.delete_all(query) do
      {count, _} when count > 0 -> {:ok, :unsubscribed}
      {0, _} -> {:ok, :not_subscribed}
    end
  end

  @doc """
  Unsubscribe from forum (alias).
  """
  def unsubscribe(forum, user), do: unsubscribe_from_forum(user, forum)

  @doc """
  Check if user is subscribed to forum.
  """
  def is_subscribed?(forum, user) do
    query = from s in Subscription,
      where: s.forum_id == ^forum.id,
      where: s.user_id == ^user.id

    Repo.exists?(query)
  end

  # ============================================================================
  # Posts
  # ============================================================================

  @doc """
  List posts in a forum.
  """
  def list_posts(forum, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    sort = Keyword.get(opts, :sort, "hot")
    category_id = Keyword.get(opts, :category_id)
    user_id = Keyword.get(opts, :user_id)

    query = from p in Post,
      where: p.forum_id == ^forum.id,
      preload: [:author, :category]

    query = if category_id do
      from p in query, where: p.category_id == ^category_id
    else
      query
    end

    query = case sort do
      "new" -> from p in query, order_by: [desc: p.inserted_at]
      "top" -> from p in query, order_by: [desc: p.score]
      "controversial" -> from p in query, order_by: [desc: fragment("? + ?", p.upvotes, p.downvotes)]
      _ -> from p in query, order_by: [desc: fragment("? / POWER(EXTRACT(EPOCH FROM (NOW() - ?))/3600 + 2, 1.8)", p.score, p.inserted_at)]
    end

    total = Repo.aggregate(from(p in Post, where: p.forum_id == ^forum.id), :count, :id)
    
    posts = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()
      |> maybe_add_user_votes(user_id)

    meta = %{page: page, per_page: per_page, total: total}
    {posts, meta}
  end

  @doc """
  Get a post by ID.
  """
  def get_post(forum, post_id, opts \\ []) do
    user_id = Keyword.get(opts, :user_id)

    query = from p in Post,
      where: p.id == ^post_id,
      where: p.forum_id == ^forum.id,
      preload: [:author, :category]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      post -> {:ok, maybe_add_user_vote(post, user_id)}
    end
  end

  @doc """
  Create a post.
  
  The post is created with score=0, then the author automatically upvotes it,
  resulting in score=1. This ensures the vote record exists for the author.
  """
  def create_post(forum, user, attrs) do
    # Ensure consistent string keys and use author_id (not user_id)
    # Start with score=0, upvotes=0 - the auto-upvote will set these to 1
    post_attrs = attrs
      |> stringify_keys()
      |> Map.put("forum_id", forum.id)
      |> Map.put("author_id", user.id)
      |> Map.put("score", 0)
      |> Map.put("upvotes", 0)

    result = %Post{}
      |> Post.changeset(post_attrs)
      |> Repo.insert()

    case result do
      {:ok, post} ->
        # Auto-upvote by author - this sets score=1, upvotes=1
        vote_on_post(user, post, :up)
        # Reload to get updated score after auto-upvote
        {:ok, Repo.preload(Repo.get!(Post, post.id), [:author, :category])}
      error -> error
    end
  end

  @doc """
  Update a post.
  
  Uses Post.edit_changeset/2 which:
  - Allows updating content, is_nsfw, is_spoiler, flair_text, flair_color
  - Automatically sets is_edited to true
  """
  def update_post(post, attrs) do
    post
    |> Post.edit_changeset(stringify_keys(attrs))
    |> Repo.update()
  end

  @doc """
  Delete a post (soft delete).
  Sets deleted_at timestamp rather than removing the record.
  """
  def delete_post(post) do
    post
    |> Ecto.Changeset.change(deleted_at: DateTime.utc_now() |> DateTime.truncate(:second))
    |> Repo.update()
  end

  @doc """
  Increment post view count.
  """
  def increment_post_views(post) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(inc: [view_count: 1])
  end

  @doc """
  Increment post view count (alias).
  """
  def increment_views(post), do: increment_post_views(post)

  @doc """
  Vote on a post.
  
  Vote types: :up or :down
  Internally stored as value: 1 (upvote) or -1 (downvote)
  """
  def vote_on_post(user, post, vote_type) do
    existing = Repo.get_by(Vote, user_id: user.id, post_id: post.id)
    expected_value = if vote_type == :up, do: 1, else: -1

    case existing do
      nil ->
        # New vote
        create_vote(user, post, vote_type)

      %{value: ^expected_value} ->
        # Same vote, return existing
        {:ok, existing}

      _ ->
        # Changing vote
        update_vote(existing, post, vote_type)
    end
  end

  defp create_vote(user, post, vote_type) do
    # Vote schema expects 'value' field with 1 (upvote) or -1 (downvote)
    vote_value = if vote_type == :up, do: 1, else: -1
    
    result = %Vote{}
      |> Vote.changeset(%{
        user_id: user.id,
        post_id: post.id,
        value: vote_value
      })
      |> Repo.insert()
      
    case result do
      {:ok, vote} ->
        # Update post score
        {inc_up, inc_down} = if vote_type == :up, do: {1, 0}, else: {0, 1}
        from(p in Post, where: p.id == ^post.id)
        |> Repo.update_all(inc: [upvotes: inc_up, downvotes: inc_down, score: vote_value])

        {:ok, vote}
        
      error -> error
    end
  end

  defp update_vote(existing, post, new_type) do
    # Vote schema uses 'value' field (1 or -1), not 'vote_type'
    new_value = if new_type == :up, do: 1, else: -1
    
    {:ok, vote} = existing
      |> Ecto.Changeset.change(value: new_value)
      |> Repo.update()

    # Adjust score (swing of 2: reversing a vote means +2 or -2)
    score_change = if new_type == :up, do: 2, else: -2
    upvote_change = if new_type == :up, do: 1, else: -1
    downvote_change = if new_type == :down, do: 1, else: -1

    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(inc: [upvotes: upvote_change, downvotes: downvote_change, score: score_change])

    {:ok, vote}
  end

  @doc """
  Remove vote from a post.
  """
  def remove_vote(user, post) do
    case Repo.get_by(Vote, user_id: user.id, post_id: post.id) do
      nil -> {:ok, :no_vote}
      vote ->
        # Adjust score
        score_change = if vote.vote_type == "up", do: -1, else: 1
        upvote_change = if vote.vote_type == "up", do: -1, else: 0
        downvote_change = if vote.vote_type == "down", do: -1, else: 0

        from(p in Post, where: p.id == ^post.id)
        |> Repo.update_all(inc: [upvotes: upvote_change, downvotes: downvote_change, score: score_change])

        Repo.delete(vote)
    end
  end

  @doc """
  Pin a post.
  """
  def pin_post(post) do
    post
    |> Ecto.Changeset.change(is_pinned: true)
    |> Repo.update()
  end

  @doc """
  Unpin a post.
  """
  def unpin_post(post) do
    post
    |> Ecto.Changeset.change(is_pinned: false)
    |> Repo.update()
  end

  @doc """
  Lock a post.
  """
  def lock_post(post) do
    post
    |> Ecto.Changeset.change(is_locked: true)
    |> Repo.update()
  end

  @doc """
  Unlock a post.
  """
  def unlock_post(post) do
    post
    |> Ecto.Changeset.change(is_locked: false)
    |> Repo.update()
  end

  @doc """
  Toggle pin status on a post.
  """
  def toggle_pin(post) do
    if post.is_pinned do
      unpin_post(post)
    else
      pin_post(post)
    end
  end

  @doc """
  Toggle lock status on a post.
  """
  def toggle_lock(post) do
    if post.is_locked do
      unlock_post(post)
    else
      lock_post(post)
    end
  end

  @doc """
  Vote on a post.
  
  Accepts flexible argument order for compatibility:
  - vote_post(user, post, vote_type)
  - vote_post(post, user, vote_type)
  
  Vote type can be :up, :down, "up", or "down"
  """
  def vote_post(%Cgraph.Accounts.User{} = user, %Post{} = post, vote_type) do
    vote_on_post(user, post, normalize_vote_type(vote_type))
  end
  
  def vote_post(%Post{} = post, %Cgraph.Accounts.User{} = user, vote_type) do
    vote_on_post(user, post, normalize_vote_type(vote_type))
  end
  
  defp normalize_vote_type("up"), do: :up
  defp normalize_vote_type("down"), do: :down
  defp normalize_vote_type(:up), do: :up
  defp normalize_vote_type(:down), do: :down

  @doc """
  Report a post.
  """
  def report_post(_user, _post, _reason) do
    # TODO: Implement reporting
    {:ok, %{id: Ecto.UUID.generate(), status: "pending"}}
  end

  @doc """
  Check post rate limit.
  """
  def check_post_rate_limit(_user) do
    # TODO: Implement rate limiting
    :ok
  end

  defp maybe_add_user_votes(posts, nil), do: posts
  defp maybe_add_user_votes(posts, user_id) do
    post_ids = Enum.map(posts, & &1.id)
    
    votes = from(v in Vote,
      where: v.user_id == ^user_id,
      where: v.post_id in ^post_ids
    )
    |> Repo.all()
    |> Map.new(fn v -> 
      vote_type = if v.value == 1, do: :up, else: :down
      {v.post_id, vote_type}
    end)

    Enum.map(posts, fn post ->
      Map.put(post, :user_vote, Map.get(votes, post.id))
    end)
  end

  defp maybe_add_user_vote(post, nil), do: post
  defp maybe_add_user_vote(post, user_id) do
    vote = Repo.get_by(Vote, user_id: user_id, post_id: post.id)
    user_vote = if vote do
      if vote.value == 1, do: :up, else: :down
    else
      nil
    end
    Map.put(post, :user_vote, user_vote)
  end

  # ============================================================================
  # Comments
  # ============================================================================

  @doc """
  List comments on a post.
  """
  def list_comments(post, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    sort = Keyword.get(opts, :sort, "best")
    parent_id = Keyword.get(opts, :parent_id)
    user_id = Keyword.get(opts, :user_id)

    query = from c in Comment,
      where: c.post_id == ^post.id,
      preload: [:author]

    query = if parent_id do
      from c in query, where: c.parent_id == ^parent_id
    else
      from c in query, where: is_nil(c.parent_id)
    end

    query = case sort do
      "new" -> from c in query, order_by: [desc: c.inserted_at]
      "old" -> from c in query, order_by: [asc: c.inserted_at]
      "controversial" -> from c in query, order_by: [desc: fragment("? + ?", c.upvotes, c.downvotes)]
      _ -> from c in query, order_by: [desc: c.score]
    end

    total = Repo.aggregate(query, :count, :id)
    
    comments = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()
      |> load_replies(user_id)
      |> maybe_add_comment_votes(user_id)

    meta = %{page: page, per_page: per_page, total: total}
    {comments, meta}
  end

  defp load_replies(comments, user_id) do
    comment_ids = Enum.map(comments, & &1.id)
    
    replies_query = from c in Comment,
      where: c.parent_id in ^comment_ids,
      order_by: [desc: c.score],
      preload: [:author]

    replies = Repo.all(replies_query)
      |> maybe_add_comment_votes(user_id)
      |> Enum.group_by(& &1.parent_id)

    Enum.map(comments, fn comment ->
      comment_replies = Map.get(replies, comment.id, [])
      Map.put(comment, :replies, comment_replies)
      |> Map.put(:reply_count, length(comment_replies))
    end)
  end

  @doc """
  Get a comment by ID.
  """
  def get_comment(post, comment_id, opts \\ []) do
    user_id = Keyword.get(opts, :user_id)

    query = from c in Comment,
      where: c.id == ^comment_id,
      where: c.post_id == ^post.id,
      preload: [:author]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      comment -> {:ok, maybe_add_comment_vote(comment, user_id)}
    end
  end

  @doc """
  Create a comment.
  """
  def create_comment(post, user, attrs) do
    # Comment schema uses author_id, not user_id
    comment_attrs = attrs
      |> stringify_keys()
      |> Map.put("post_id", post.id)
      |> Map.put("author_id", user.id)
      |> Map.put("score", 1)
      |> Map.put("upvotes", 1)

    result = %Comment{}
      |> Comment.changeset(comment_attrs)
      |> Repo.insert()

    case result do
      {:ok, comment} ->
        # Update post comment count
        from(p in Post, where: p.id == ^post.id)
        |> Repo.update_all(inc: [comment_count: 1])
        
        {:ok, Repo.preload(comment, [:author])}
      error -> error
    end
  end

  @doc """
  Update a comment.
  
  Uses Comment.edit_changeset/2 which:
  - Allows updating content only
  - Automatically sets is_edited to true
  """
  def update_comment(comment, attrs) do
    comment
    |> Comment.edit_changeset(stringify_keys(attrs))
    |> Repo.update()
  end

  @doc """
  Delete a comment (soft delete).
  
  Sets deleted_at timestamp and replaces content with [deleted].
  Uses DateTime.truncate(:second) for :utc_datetime field compatibility.
  """
  def delete_comment(comment) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    comment
    |> Ecto.Changeset.change(deleted_at: now, content: "[deleted]")
    |> Repo.update()
  end

  @doc """
  Vote on a comment.
  """
  def vote_on_comment(user, comment, vote_type) do
    existing = Repo.get_by(Vote, user_id: user.id, comment_id: comment.id)

    case existing do
      nil ->
        {:ok, vote} = %Vote{}
          |> Vote.changeset(%{
            user_id: user.id,
            comment_id: comment.id,
            vote_type: to_string(vote_type)
          })
          |> Repo.insert()

        {inc_up, inc_down} = if vote_type == :up, do: {1, 0}, else: {0, 1}
        from(c in Comment, where: c.id == ^comment.id)
        |> Repo.update_all(inc: [upvotes: inc_up, downvotes: inc_down, score: if(vote_type == :up, do: 1, else: -1)])

        {:ok, vote}

      %{vote_type: ^vote_type} ->
        {:ok, existing}

      _ ->
        {:ok, vote} = existing
          |> Ecto.Changeset.change(vote_type: to_string(vote_type))
          |> Repo.update()

        score_change = if vote_type == :up, do: 2, else: -2
        from(c in Comment, where: c.id == ^comment.id)
        |> Repo.update_all(inc: [score: score_change])

        {:ok, vote}
    end
  end

  @doc """
  Remove vote from a comment.
  """
  def remove_comment_vote(user, comment) do
    case Repo.get_by(Vote, user_id: user.id, comment_id: comment.id) do
      nil -> {:ok, :no_vote}
      vote ->
        score_change = if vote.vote_type == "up", do: -1, else: 1
        from(c in Comment, where: c.id == ^comment.id)
        |> Repo.update_all(inc: [score: score_change])
        Repo.delete(vote)
    end
  end

  @doc """
  Report a comment.
  """
  def report_comment(_user, _comment, _reason) do
    {:ok, %{id: Ecto.UUID.generate(), status: "pending"}}
  end

  @doc """
  Check comment rate limit.
  """
  def check_comment_rate_limit(_user) do
    :ok
  end

  @doc """
  Notify about a new comment.
  """
  def notify_comment(_comment) do
    # TODO: Implement notifications
    :ok
  end

  defp maybe_add_comment_votes(comments, nil), do: comments
  defp maybe_add_comment_votes(comments, user_id) do
    comment_ids = Enum.map(comments, & &1.id)
    
    votes = from(v in Vote,
      where: v.user_id == ^user_id,
      where: v.comment_id in ^comment_ids
    )
    |> Repo.all()
    |> Map.new(& {&1.comment_id, String.to_atom(&1.vote_type)})

    Enum.map(comments, fn comment ->
      Map.put(comment, :user_vote, Map.get(votes, comment.id))
    end)
  end

  defp maybe_add_comment_vote(comment, nil), do: comment
  defp maybe_add_comment_vote(comment, user_id) do
    vote = Repo.get_by(Vote, user_id: user_id, comment_id: comment.id)
    user_vote = if vote, do: String.to_atom(vote.vote_type), else: nil
    Map.put(comment, :user_vote, user_vote)
  end

  # ============================================================================
  # Categories
  # ============================================================================

  @doc """
  List categories in a forum.
  """
  def list_categories(forum) do
    from(c in Category,
      where: c.forum_id == ^forum.id,
      order_by: [asc: c.position]
    )
    |> Repo.all()
  end

  @doc """
  Get a category.
  """
  def get_category(forum, category_id) do
    query = from c in Category,
      where: c.id == ^category_id,
      where: c.forum_id == ^forum.id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      category -> {:ok, category}
    end
  end

  @doc """
  Create a category.
  """
  def create_category(forum, attrs) do
    %Category{}
    |> Category.changeset(Map.put(attrs, "forum_id", forum.id))
    |> Repo.insert()
  end

  @doc """
  Update a category.
  """
  def update_category(category, attrs) do
    category
    |> Category.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a category.
  """
  def delete_category(category) do
    Repo.delete(category)
  end

  @doc """
  Reorder categories.
  """
  def reorder_categories(forum, category_ids) do
    Enum.with_index(category_ids)
    |> Enum.each(fn {category_id, index} ->
      from(c in Category, where: c.id == ^category_id and c.forum_id == ^forum.id)
      |> Repo.update_all(set: [position: index])
    end)

    {:ok, list_categories(forum)}
  end

  # ============================================================================
  # Search
  # ============================================================================

  @doc """
  Search posts by title or content.
  Supports filtering by forum and sorting by relevance, date, or score.
  """
  def search_posts(query, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    forum_id = Keyword.get(opts, :forum_id)
    sort = Keyword.get(opts, :sort, "relevance")
    search_term = "%#{query}%"

    db_query = from p in Post,
      where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
      preload: [:author, :forum]

    db_query = if forum_id do
      from p in db_query, where: p.forum_id == ^forum_id
    else
      db_query
    end

    db_query = case sort do
      "new" -> from p in db_query, order_by: [desc: p.inserted_at]
      "top" -> from p in db_query, order_by: [desc: p.score]
      _ -> db_query
    end

    total = Repo.aggregate(db_query, :count, :id)
    
    posts = db_query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {posts, meta}
  end
end
