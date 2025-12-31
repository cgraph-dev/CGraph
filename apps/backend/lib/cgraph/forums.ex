defmodule Cgraph.Forums do
  @moduledoc """
  The Forums context.
  
  Handles forums, posts, comments, categories, and voting.
  Reddit-style discussion functionality with forum competition.
  
  Also handles MyBB-style forum hosting with boards, threads, and posts.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Forums.{Forum, Post, Comment, Category, Vote, ForumVote, Moderator, Subscription}
  alias Cgraph.Forums.{Board, Thread, ThreadPost, ForumMember, ForumUserGroup}
  alias Cgraph.Forums.{ThreadVote, PostVote, ThreadPoll, PollVote, ForumPlugin}
  # Reserved for future features - these schemas exist but are not yet fully integrated
  alias Cgraph.Forums.ForumTheme, warn: false
  alias Cgraph.Forums.ForumAnnouncement, warn: false  
  alias Cgraph.Forums.ThreadAttachment, warn: false

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
  For anonymous users, only show public forums.
  For authenticated users, show public forums + private forums they're members of.
  """
  def list_forums_for_user(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    # Base query - exclude deleted forums
    base_query = from f in Forum,
      where: is_nil(f.deleted_at),
      order_by: [desc: f.member_count],
      preload: [:categories, :owner]

    # Apply visibility filter based on user
    query = case user do
      nil ->
        # Anonymous users only see public forums
        from f in base_query, where: f.is_public == true
      
      %{id: user_id} ->
        # Authenticated users see public forums + private forums they're members of
        from f in base_query,
          left_join: m in assoc(f, :memberships),
          where: f.is_public == true or (f.is_public == false and m.user_id == ^user_id),
          distinct: true
    end

    total = Repo.aggregate(query, :count, :id)
    
    forums = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()
      |> Enum.map(&add_membership_status(&1, user))

    meta = %{page: page, per_page: per_page, total: total}
    {forums, meta}
  end

  @doc """
  Add membership and subscription status to a forum struct.
  """
  def add_membership_status(forum, nil) do
    forum
    |> Map.put(:is_member, false)
    |> Map.put(:is_subscribed, false)
  end

  def add_membership_status(forum, user) do
    is_member = is_forum_member(user, forum)
    is_subscribed = is_forum_subscribed(user, forum)
    
    forum
    |> Map.put(:is_member, is_member)
    |> Map.put(:is_subscribed, is_subscribed)
  end

  @doc """
  Check if a user is subscribed to a forum.
  """
  def is_forum_subscribed(nil, _forum), do: false
  def is_forum_subscribed(user, forum) do
    from(s in Subscription,
      where: s.user_id == ^user.id and s.forum_id == ^forum.id,
      select: count(s.id)
    )
    |> Repo.one()
    |> Kernel.>(0)
  end

  @doc """
  Check if a user is a member of a forum.
  """
  def is_forum_member(nil, _forum), do: false
  def is_forum_member(user, forum) do
    # Check if user is owner, moderator, or has a membership
    cond do
      forum.owner_id == user.id -> true
      true ->
        from(m in ForumMember,
          where: m.user_id == ^user.id and m.forum_id == ^forum.id,
          select: count(m.id)
        )
        |> Repo.one()
        |> Kernel.>(0)
    end
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
  
  Authorization rules:
  - Anonymous users can only view public forums
  - Forum owners and moderators can do everything
  - For private forums, only members can view/interact
  - For public forums, anyone can view but must be member to post
  """
  def authorize_action(nil, forum, action) do
    # Anonymous users can only view public forums
    if action == :view && forum.is_public do
      :ok
    else
      {:error, :unauthorized}
    end
  end
  
  def authorize_action(user, forum, action) do
    cond do
      # Owners can do anything
      forum.owner_id == user.id -> :ok
      
      # Moderators can moderate but not manage (settings)
      is_moderator?(forum, user) && action in [:view, :vote, :comment, :create_post, :moderate] -> :ok
      
      # Manage/delete are owner-only (already handled above, this returns error for non-owners)
      action in [:manage, :delete] ->
        {:error, :owner_only}
      
      # Public forums: anyone can view
      action == :view && forum.is_public -> :ok
      
      # Private forums: only members can view
      action == :view && !forum.is_public ->
        if is_member?(forum.id, user.id), do: :ok, else: {:error, :not_a_member}
      
      # Interactive actions (post, vote, comment) require membership
      action in [:vote, :comment, :create_post] ->
        if is_member?(forum.id, user.id), do: :ok, else: {:error, :must_join_first}
      
      # Moderation actions require moderator status
      action == :moderate ->
        {:error, :insufficient_permissions}
      
      true -> {:error, :insufficient_permissions}
    end
  end
  
  @doc """
  Check if a user is a member of a forum.
  """
  def is_member?(forum_id, user_id) do
    query = from fm in ForumMember,
      where: fm.forum_id == ^forum_id,
      where: fm.user_id == ^user_id,
      limit: 1
    Repo.exists?(query)
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
  Count forums owned by a user.
  Used for tier-based forum limits.
  """
  def count_user_forums(user_id) do
    Repo.aggregate(
      from(f in Forum, where: f.owner_id == ^user_id and is_nil(f.deleted_at)),
      :count,
      :id
    )
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
  Subscribe to forum (also creates membership).
  This serves as the "Join" functionality - creates both subscription and membership.
  """
  def subscribe_to_forum(user, forum) do
    Repo.transaction(fn ->
      # Create subscription
      subscription_result = %Subscription{}
      |> Subscription.changeset(%{
        forum_id: forum.id,
        user_id: user.id
      })
      |> Repo.insert(on_conflict: :nothing, conflict_target: [:forum_id, :user_id])

      # Create membership if not exists
      case Repo.get_by(ForumMember, forum_id: forum.id, user_id: user.id) do
        nil ->
          %ForumMember{}
          |> ForumMember.changeset(%{
            forum_id: forum.id,
            user_id: user.id,
            joined_at: DateTime.utc_now() |> DateTime.truncate(:second)
          })
          |> Repo.insert()
        
        _member -> :ok
      end

      # Increment member count
      from(f in Forum, where: f.id == ^forum.id)
      |> Repo.update_all(inc: [member_count: 1])

      case subscription_result do
        {:ok, subscription} -> subscription
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end

  @doc """
  Subscribe to forum (alias).
  """
  def subscribe(forum, user), do: subscribe_to_forum(user, forum)

  @doc """
  Unsubscribe from forum (also removes membership).
  This serves as the "Leave" functionality - removes both subscription and membership.
  Note: Forum owners cannot unsubscribe from their own forum.
  """
  def unsubscribe_from_forum(user, forum) do
    # Prevent owner from leaving their own forum
    if forum.owner_id == user.id do
      {:error, :cannot_leave_own_forum}
    else
      Repo.transaction(fn ->
        # Remove subscription
        subscription_query = from s in Subscription,
          where: s.forum_id == ^forum.id,
          where: s.user_id == ^user.id
        
        subscription_deleted = case Repo.delete_all(subscription_query) do
          {count, _} when count > 0 -> true
          {0, _} -> false
        end

        # Remove membership
        member_query = from m in ForumMember,
          where: m.forum_id == ^forum.id,
          where: m.user_id == ^user.id
        
        Repo.delete_all(member_query)

        # Decrement member count if subscription was deleted
        if subscription_deleted do
          from(f in Forum, where: f.id == ^forum.id)
          |> Repo.update_all(inc: [member_count: -1])
        end

        :unsubscribed
      end)
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
  List public feed of posts from all public forums.
  Used for the main discovery page.
  """
  def list_public_feed(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 25)
    sort = Keyword.get(opts, :sort, "hot")
    time_range = Keyword.get(opts, :time_range, "day")
    user_id = Keyword.get(opts, :user_id)

    # Only posts from public forums
    query = from p in Post,
      join: f in Forum, on: p.forum_id == f.id,
      where: f.is_public == true,
      where: is_nil(f.deleted_at),
      preload: [:author, :category, forum: []]

    # Apply time filter for "top" sort
    query = if sort == "top" do
      time_filter = case time_range do
        "hour" -> DateTime.add(DateTime.utc_now(), -1, :hour)
        "day" -> DateTime.add(DateTime.utc_now(), -1, :day)
        "week" -> DateTime.add(DateTime.utc_now(), -7, :day)
        "month" -> DateTime.add(DateTime.utc_now(), -30, :day)
        "year" -> DateTime.add(DateTime.utc_now(), -365, :day)
        _ -> nil
      end
      if time_filter do
        from p in query, where: p.inserted_at >= ^time_filter
      else
        query
      end
    else
      query
    end

    # Apply sort
    query = case sort do
      "new" -> from p in query, order_by: [desc: p.inserted_at]
      "top" -> from p in query, order_by: [desc: p.score]
      "controversial" -> from p in query, order_by: [desc: fragment("? + ?", p.upvotes, p.downvotes)]
      _ -> from p in query, order_by: [desc: fragment("? / POWER(EXTRACT(EPOCH FROM (NOW() - ?))/3600 + 2, 1.8)", p.score, p.inserted_at)]
    end

    total = Repo.aggregate(from(p in Post, join: f in Forum, on: p.forum_id == f.id, where: f.is_public == true), :count, :id)
    
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

        # Update post author's karma (only for upvotes, downvotes subtract)
        if post.author_id && post.author_id != user.id do
          karma_change = vote_value
          from(u in Cgraph.Accounts.User, where: u.id == ^post.author_id)
          |> Repo.update_all(inc: [karma: karma_change])
        end

        {:ok, vote}
        
      error -> error
    end
  end

  defp update_vote(existing, post, new_type) do
    # Vote schema uses 'value' field (1 or -1), not 'vote_type'
    old_value = existing.value
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

    # Update post author's karma (karma swing is the difference between new and old vote)
    if post.author_id do
      karma_change = new_value - old_value
      from(u in Cgraph.Accounts.User, where: u.id == ^post.author_id)
      |> Repo.update_all(inc: [karma: karma_change])
    end

    {:ok, vote}
  end

  @doc """
  Remove vote from a post.
  """
  def remove_vote(user, post) do
    case Repo.get_by(Vote, user_id: user.id, post_id: post.id) do
      nil -> {:ok, :no_vote}
      vote ->
        # Adjust score - value is 1 (upvote) or -1 (downvote)
        score_change = -vote.value
        upvote_change = if vote.value == 1, do: -1, else: 0
        downvote_change = if vote.value == -1, do: -1, else: 0

        from(p in Post, where: p.id == ^post.id)
        |> Repo.update_all(inc: [upvotes: upvote_change, downvotes: downvote_change, score: score_change])

        # Remove karma from post author
        if post.author_id do
          karma_change = -vote.value  # Reverse the karma effect
          from(u in Cgraph.Accounts.User, where: u.id == ^post.author_id)
          |> Repo.update_all(inc: [karma: karma_change])
        end

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
    vote_value = if vote_type == :up, do: 1, else: -1

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
        |> Repo.update_all(inc: [upvotes: inc_up, downvotes: inc_down, score: vote_value])

        # Update comment author's karma
        if comment.author_id && comment.author_id != user.id do
          from(u in Cgraph.Accounts.User, where: u.id == ^comment.author_id)
          |> Repo.update_all(inc: [karma: vote_value])
        end

        {:ok, vote}

      %{vote_type: ^vote_type} ->
        {:ok, existing}

      _ ->
        old_vote_type = existing.vote_type
        {:ok, vote} = existing
          |> Ecto.Changeset.change(vote_type: to_string(vote_type))
          |> Repo.update()

        score_change = if vote_type == :up, do: 2, else: -2
        from(c in Comment, where: c.id == ^comment.id)
        |> Repo.update_all(inc: [score: score_change])

        # Update comment author's karma (swing from old to new)
        if comment.author_id do
          old_value = if old_vote_type == "up", do: 1, else: -1
          karma_change = vote_value - old_value
          from(u in Cgraph.Accounts.User, where: u.id == ^comment.author_id)
          |> Repo.update_all(inc: [karma: karma_change])
        end

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
        vote_value = if vote.vote_type == "up", do: 1, else: -1
        score_change = -vote_value
        from(c in Comment, where: c.id == ^comment.id)
        |> Repo.update_all(inc: [score: score_change])

        # Remove karma from comment author
        if comment.author_id do
          from(u in Cgraph.Accounts.User, where: u.id == ^comment.author_id)
          |> Repo.update_all(inc: [karma: -vote_value])
        end

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

  # ============================================================================
  # Forum Voting (Competition)
  # ============================================================================

  @doc """
  Vote on a forum. Users can upvote (1) or downvote (-1) forums.
  
  Changes vote if user already voted, removes if same vote.
  Returns {:ok, :upvoted | :downvoted | :removed} with updated forum.
  """
  def vote_forum(user, forum_id, value) when value in [1, -1] do
    Repo.transaction(fn ->
      case get_user_forum_vote(user.id, forum_id) do
        nil ->
          # New vote
          create_forum_vote(user.id, forum_id, value)
          update_forum_scores(forum_id, value, 0)
          if value == 1, do: :upvoted, else: :downvoted

        %ForumVote{value: ^value} = existing ->
          # Same vote - remove it
          Repo.delete!(existing)
          update_forum_scores(forum_id, 0, value)
          :removed

        existing ->
          # Different vote - change it
          old_value = existing.value
          existing
          |> ForumVote.changeset(%{value: value})
          |> Repo.update!()
          update_forum_scores(forum_id, value, old_value)
          if value == 1, do: :upvoted, else: :downvoted
      end
    end)
  end

  @doc """
  Get user's vote on a forum.
  """
  def get_user_forum_vote(user_id, forum_id) do
    Repo.one(
      from v in ForumVote,
        where: v.user_id == ^user_id and v.forum_id == ^forum_id
    )
  end

  defp create_forum_vote(user_id, forum_id, value) do
    %ForumVote{}
    |> ForumVote.changeset(%{user_id: user_id, forum_id: forum_id, value: value})
    |> Repo.insert!()
  end

  defp update_forum_scores(forum_id, new_value, old_value) do
    # Calculate deltas
    upvote_delta = (if new_value == 1, do: 1, else: 0) - (if old_value == 1, do: 1, else: 0)
    downvote_delta = (if new_value == -1, do: 1, else: 0) - (if old_value == -1, do: 1, else: 0)
    score_delta = new_value - old_value

    from(f in Forum, where: f.id == ^forum_id)
    |> Repo.update_all(
      inc: [
        upvotes: upvote_delta,
        downvotes: downvote_delta,
        score: score_delta,
        weekly_score: score_delta
      ]
    )

    # Recalculate hot score
    update_forum_hot_score(forum_id)
  end

  @doc """
  Calculate hot score using Reddit's algorithm.
  Combines score with time decay.
  """
  def update_forum_hot_score(forum_id) do
    forum = Repo.get!(Forum, forum_id)
    
    # Reddit-style hot ranking
    # score = sign(score) * log10(max(abs(score), 1)) + (created_at / 45000)
    score = forum.score
    sign = if score >= 0, do: 1, else: -1
    order = :math.log10(max(abs(score), 1))
    
    # Time factor: seconds since epoch, divided by 45000 (roughly 12.5 hours)
    seconds = DateTime.to_unix(forum.inserted_at)
    hot = sign * order + (seconds / 45000)

    from(f in Forum, where: f.id == ^forum_id)
    |> Repo.update_all(set: [hot_score: hot])
  end

  # ============================================================================
  # Leaderboard
  # ============================================================================

  @doc """
  Get forum leaderboard sorted by various criteria.
  
  Options:
  - sort: "hot" (default), "top", "new", "rising", "weekly"
  - page, per_page: pagination
  - featured_only: only show featured forums
  """
  def list_forum_leaderboard(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 25)
    sort = Keyword.get(opts, :sort, "hot")
    featured_only = Keyword.get(opts, :featured_only, false)

    query = from f in Forum,
      where: is_nil(f.deleted_at) and f.is_public == true,
      preload: [:owner]

    query = if featured_only do
      from f in query, where: f.featured == true
    else
      query
    end

    query = case sort do
      "hot" -> from f in query, order_by: [desc: f.hot_score]
      "top" -> from f in query, order_by: [desc: f.score]
      "new" -> from f in query, order_by: [desc: f.inserted_at]
      "rising" -> from f in query, order_by: [desc: f.weekly_score, desc: f.inserted_at]
      "weekly" -> from f in query, order_by: [desc: f.weekly_score]
      "members" -> from f in query, order_by: [desc: f.member_count]
      _ -> from f in query, order_by: [desc: f.hot_score]
    end

    total = Repo.aggregate(query, :count, :id)

    forums = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total, sort: sort}
    {forums, meta}
  end

  @doc """
  Get top N forums for a quick leaderboard display.
  """
  def get_top_forums(limit \\ 10, sort \\ "hot") do
    query = from f in Forum,
      where: is_nil(f.deleted_at) and f.is_public == true,
      preload: [:owner],
      limit: ^limit

    query = case sort do
      "hot" -> from f in query, order_by: [desc: f.hot_score]
      "top" -> from f in query, order_by: [desc: f.score]
      "weekly" -> from f in query, order_by: [desc: f.weekly_score]
      _ -> from f in query, order_by: [desc: f.hot_score]
    end

    Repo.all(query)
  end

  @doc """
  Get forum with user's vote status.
  """
  def get_forum_with_vote(forum_id, user_id) do
    case get_forum(forum_id) do
      {:ok, forum} ->
        vote = if user_id, do: get_user_forum_vote(user_id, forum_id), else: nil
        user_vote = if vote, do: vote.value, else: 0
        {:ok, Map.put(forum, :user_vote, user_vote)}
      
      error -> error
    end
  end

  @doc """
  Reset weekly scores (run via scheduler).
  """
  def reset_weekly_scores do
    from(f in Forum)
    |> Repo.update_all(set: [weekly_score: 0])
  end

  @doc """
  Set a forum as featured.
  """
  def set_forum_featured(forum_id, featured) when is_boolean(featured) do
    from(f in Forum, where: f.id == ^forum_id)
    |> Repo.update_all(set: [featured: featured])
  end

  # ============================================================================
  # Boards (MyBB-style sections/categories)
  # ============================================================================

  @doc """
  List boards for a forum.
  """
  def list_boards(forum_id, opts \\ []) do
    include_hidden = Keyword.get(opts, :include_hidden, false)
    parent_id = Keyword.get(opts, :parent_id, nil)

    query = from b in Board,
      where: b.forum_id == ^forum_id and is_nil(b.deleted_at),
      order_by: [asc: b.position, asc: b.name]

    query = if parent_id do
      from b in query, where: b.parent_board_id == ^parent_id
    else
      from b in query, where: is_nil(b.parent_board_id)
    end

    query = if include_hidden do
      query
    else
      from b in query, where: b.is_hidden == false
    end

    Repo.all(query)
  end

  @doc """
  Get a board by ID.
  """
  def get_board(id) do
    case Repo.get(Board, id) do
      nil -> {:error, :not_found}
      board -> {:ok, Repo.preload(board, [:forum])}
    end
  end

  @doc """
  Get a board by forum_id and slug.
  """
  def get_board_by_slug(forum_id, slug) do
    query = from b in Board,
      where: b.forum_id == ^forum_id and b.slug == ^slug and is_nil(b.deleted_at)

    case Repo.one(query) do
      nil -> {:error, :not_found}
      board -> {:ok, Repo.preload(board, [:forum])}
    end
  end

  @doc """
  Create a board.
  """
  def create_board(attrs \\ %{}) do
    %Board{}
    |> Board.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a board.
  """
  def update_board(%Board{} = board, attrs) do
    board
    |> Board.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a board (soft delete).
  """
  def delete_board(%Board{} = board) do
    board
    |> Ecto.Changeset.change(deleted_at: DateTime.utc_now())
    |> Repo.update()
  end

  # ============================================================================
  # Threads
  # ============================================================================

  @doc """
  List threads in a board.
  """
  def list_threads(board_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    sort = Keyword.get(opts, :sort, "latest")

    query = from t in Thread,
      where: t.board_id == ^board_id and is_nil(t.deleted_at) and t.is_hidden == false,
      preload: [:author, :last_poster]

    # Pinned threads always first
    query = case sort do
      "latest" ->
        from t in query, order_by: [desc: t.is_pinned, desc: t.last_post_at]
      "hot" ->
        from t in query, order_by: [desc: t.is_pinned, desc: t.hot_score]
      "top" ->
        from t in query, order_by: [desc: t.is_pinned, desc: t.score]
      "views" ->
        from t in query, order_by: [desc: t.is_pinned, desc: t.view_count]
      _ ->
        from t in query, order_by: [desc: t.is_pinned, desc: t.last_post_at]
    end

    total = Repo.aggregate(query, :count, :id)
    
    threads = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {threads, meta}
  end

  @doc """
  List all threads in a forum (across all boards).
  Used for "Recent Threads" view on forum homepage.
  """
  def list_forum_threads(forum_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    sort = Keyword.get(opts, :sort, "latest")

    # Get all board IDs for this forum
    board_ids = from(b in Board,
      where: b.forum_id == ^forum_id and is_nil(b.deleted_at),
      select: b.id
    ) |> Repo.all()

    query = from t in Thread,
      where: t.board_id in ^board_ids and is_nil(t.deleted_at) and t.is_hidden == false,
      preload: [:author, :last_poster, :board],
      limit: ^limit

    query = case sort do
      "latest" -> from t in query, order_by: [desc: t.is_pinned, desc: t.inserted_at]
      "hot" -> from t in query, order_by: [desc: t.is_pinned, desc: t.hot_score]
      "top" -> from t in query, order_by: [desc: t.is_pinned, desc: t.score]
      "active" -> from t in query, order_by: [desc: t.is_pinned, desc: t.last_post_at]
      _ -> from t in query, order_by: [desc: t.is_pinned, desc: t.inserted_at]
    end

    Repo.all(query)
  end

  @doc """
  Get a thread by ID.
  """
  def get_thread(id) do
    query = from t in Thread,
      where: t.id == ^id,
      preload: [:author, :board]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      thread -> {:ok, thread}
    end
  end

  @doc """
  Get a thread by board_id and slug.
  """
  def get_thread_by_slug(board_id, slug) do
    query = from t in Thread,
      where: t.board_id == ^board_id and t.slug == ^slug and is_nil(t.deleted_at)

    case Repo.one(query) do
      nil -> {:error, :not_found}
      thread -> {:ok, Repo.preload(thread, [:author, :board])}
    end
  end

  @doc """
  Create a thread.
  """
  def create_thread(attrs \\ %{}) do
    Repo.transaction(fn ->
      result = %Thread{}
        |> Thread.changeset(attrs)
        |> Repo.insert()
      
      case result do
        {:ok, thread} ->
          # Update board stats
          from(b in Board, where: b.id == ^thread.board_id)
          |> Repo.update_all(inc: [thread_count: 1])
          
          # Update forum stats
          board = Repo.get!(Board, thread.board_id)
          from(f in Forum, where: f.id == ^board.forum_id)
          |> Repo.update_all(inc: [thread_count: 1])
          
          Repo.preload(thread, [:author, :board])
        
        {:error, changeset} ->
          Repo.rollback(changeset)
      end
    end)
  end

  @doc """
  Update a thread.
  """
  def update_thread(%Thread{} = thread, attrs) do
    thread
    |> Thread.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a thread (soft delete).
  """
  def delete_thread(%Thread{} = thread) do
    thread
    |> Ecto.Changeset.change(deleted_at: DateTime.utc_now())
    |> Repo.update()
  end

  @doc """
  Increment thread view count.
  """
  def increment_thread_views(thread_id) do
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(inc: [view_count: 1])
  end

  @doc """
  Pin or unpin a thread.
  """
  def toggle_thread_pin(thread_id, pinned) when is_boolean(pinned) do
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(set: [is_pinned: pinned])
  end

  @doc """
  Lock or unlock a thread.
  """
  def toggle_thread_lock(thread_id, locked) when is_boolean(locked) do
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(set: [is_locked: locked])
  end

  # ============================================================================
  # Thread Posts (Replies)
  # ============================================================================

  @doc """
  List posts in a thread.
  """
  def list_thread_posts(thread_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from p in ThreadPost,
      where: p.thread_id == ^thread_id and is_nil(p.deleted_at) and p.is_hidden == false,
      order_by: [asc: p.position, asc: p.inserted_at],
      preload: [:author]

    total = Repo.aggregate(query, :count, :id)
    
    posts = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {posts, meta}
  end

  @doc """
  Get a thread post by ID.
  """
  def get_thread_post(id) do
    case Repo.get(ThreadPost, id) do
      nil -> {:error, :not_found}
      post -> {:ok, Repo.preload(post, [:author, :thread])}
    end
  end

  @doc """
  Create a thread post (reply).
  """
  def create_thread_post(attrs \\ %{}) do
    Repo.transaction(fn ->
      thread_id = attrs[:thread_id] || attrs["thread_id"]
      
      # Get position for new post
      last_position = from(p in ThreadPost, 
        where: p.thread_id == ^thread_id, 
        select: max(p.position))
        |> Repo.one() || 0

      attrs = Map.put(attrs, :position, last_position + 1)
      
      result = %ThreadPost{}
        |> ThreadPost.changeset(attrs)
        |> Repo.insert()
      
      case result do
        {:ok, post} ->
          # Update thread stats
          now = DateTime.utc_now()
          from(t in Thread, where: t.id == ^thread_id)
          |> Repo.update_all(
            inc: [reply_count: 1],
            set: [last_post_at: now, last_post_id: post.id, last_poster_id: post.author_id]
          )
          
          # Update board stats
          thread = Repo.get!(Thread, thread_id)
          from(b in Board, where: b.id == ^thread.board_id)
          |> Repo.update_all(
            inc: [post_count: 1],
            set: [last_post_at: now, last_post_id: post.id, last_thread_id: thread_id]
          )
          
          # Update forum stats
          board = Repo.get!(Board, thread.board_id)
          from(f in Forum, where: f.id == ^board.forum_id)
          |> Repo.update_all(inc: [post_count: 1])
          
          # Update member post count
          from(m in ForumMember, 
            where: m.forum_id == ^board.forum_id and m.user_id == ^post.author_id)
          |> Repo.update_all(inc: [post_count: 1], set: [last_post_at: now])
          
          Repo.preload(post, [:author])
        
        {:error, changeset} ->
          Repo.rollback(changeset)
      end
    end)
  end

  @doc """
  Update a thread post.
  """
  def update_thread_post(%ThreadPost{} = post, attrs, editor_id) do
    attrs = Map.merge(attrs, %{
      is_edited: true,
      edit_count: (post.edit_count || 0) + 1,
      edited_at: DateTime.utc_now(),
      edited_by_id: editor_id
    })

    post
    |> ThreadPost.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a thread post (soft delete).
  """
  def delete_thread_post(%ThreadPost{} = post) do
    post
    |> Ecto.Changeset.change(deleted_at: DateTime.utc_now())
    |> Repo.update()
  end

  # ============================================================================
  # Forum Members
  # ============================================================================

  @doc """
  Get or create forum membership for a user.
  """
  def get_or_create_member(forum_id, user_id) do
    case Repo.get_by(ForumMember, forum_id: forum_id, user_id: user_id) do
      nil ->
        %ForumMember{}
        |> ForumMember.changeset(%{
          forum_id: forum_id,
          user_id: user_id,
          joined_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })
        |> Repo.insert()
      
      member ->
        {:ok, member}
    end
  end

  @doc """
  Get forum member.
  """
  def get_forum_member(forum_id, user_id) do
    Repo.get_by(ForumMember, forum_id: forum_id, user_id: user_id)
  end

  @doc """
  List forum members.
  """
  def list_forum_members(forum_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    sort = Keyword.get(opts, :sort, "reputation")

    query = from m in ForumMember,
      where: m.forum_id == ^forum_id and m.is_banned == false,
      preload: [:user]

    query = case sort do
      "reputation" -> from m in query, order_by: [desc: m.reputation]
      "posts" -> from m in query, order_by: [desc: m.post_count]
      "joined" -> from m in query, order_by: [asc: m.joined_at]
      _ -> from m in query, order_by: [desc: m.reputation]
    end

    total = Repo.aggregate(query, :count, :id)
    
    members = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {members, meta}
  end

  @doc """
  Update forum member role.
  """
  def update_member_role(forum_id, user_id, role) when role in ["member", "moderator", "admin"] do
    case get_forum_member(forum_id, user_id) do
      nil -> {:error, :not_found}
      member ->
        member
        |> ForumMember.changeset(%{role: role})
        |> Repo.update()
    end
  end

  @doc """
  Ban a forum member.
  """
  def ban_forum_member(forum_id, user_id, reason, banned_by_id, expires_at \\ nil) do
    case get_forum_member(forum_id, user_id) do
      nil -> {:error, :not_found}
      member ->
        member
        |> ForumMember.changeset(%{
          is_banned: true,
          ban_reason: reason,
          banned_by_id: banned_by_id,
          ban_expires_at: expires_at
        })
        |> Repo.update()
    end
  end

  @doc """
  Unban a forum member.
  """
  def unban_forum_member(forum_id, user_id) do
    case get_forum_member(forum_id, user_id) do
      nil -> {:error, :not_found}
      member ->
        member
        |> ForumMember.changeset(%{
          is_banned: false,
          ban_reason: nil,
          banned_by_id: nil,
          ban_expires_at: nil
        })
        |> Repo.update()
    end
  end

  # ============================================================================
  # Thread Voting
  # ============================================================================

  @doc """
  Vote on a thread.
  """
  def vote_thread(user_id, thread_id, value) when value in [1, -1] do
    case Repo.get_by(ThreadVote, user_id: user_id, thread_id: thread_id) do
      nil ->
        # New vote
        result = %ThreadVote{}
          |> ThreadVote.changeset(%{user_id: user_id, thread_id: thread_id, value: value})
          |> Repo.insert()
        
        case result do
          {:ok, vote} ->
            update_thread_score(thread_id, value)
            {:ok, vote}
          error -> error
        end
      
      existing_vote when existing_vote.value == value ->
        # Same vote - remove it
        Repo.delete(existing_vote)
        update_thread_score(thread_id, -value)
        {:ok, :removed}
      
      existing_vote ->
        # Change vote
        old_value = existing_vote.value
        result = existing_vote
          |> ThreadVote.changeset(%{value: value})
          |> Repo.update()
        
        case result do
          {:ok, vote} ->
            update_thread_score(thread_id, value - old_value)
            {:ok, vote}
          error -> error
        end
    end
  end

  defp update_thread_score(thread_id, delta) do
    _thread = Repo.get!(Thread, thread_id)
    
    upvotes = if delta > 0, do: 1, else: 0
    downvotes = if delta < 0, do: 1, else: 0
    
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(
      inc: [score: delta, upvotes: upvotes, downvotes: downvotes]
    )
  end

  # ============================================================================
  # Post Voting (by IDs)
  # ============================================================================

  @doc """
  Vote on a post by user_id and post_id.
  Value must be 1 (upvote) or -1 (downvote).
  """
  def vote_post_by_id(user_id, post_id, value) when value in [1, -1] do
    case Repo.get_by(PostVote, user_id: user_id, post_id: post_id) do
      nil ->
        result = %PostVote{}
          |> PostVote.changeset(%{user_id: user_id, post_id: post_id, value: value})
          |> Repo.insert()
        
        case result do
          {:ok, vote} ->
            update_post_score(post_id, value)
            {:ok, vote}
          error -> error
        end
      
      existing_vote when existing_vote.value == value ->
        Repo.delete(existing_vote)
        update_post_score(post_id, -value)
        {:ok, :removed}
      
      existing_vote ->
        old_value = existing_vote.value
        result = existing_vote
          |> PostVote.changeset(%{value: value})
          |> Repo.update()
        
        case result do
          {:ok, vote} ->
            update_post_score(post_id, value - old_value)
            {:ok, vote}
          error -> error
        end
    end
  end

  defp update_post_score(post_id, delta) do
    upvotes = if delta > 0, do: 1, else: 0
    downvotes = if delta < 0, do: 1, else: 0
    
    from(p in ThreadPost, where: p.id == ^post_id)
    |> Repo.update_all(
      inc: [score: delta, upvotes: upvotes, downvotes: downvotes]
    )
  end

  # ============================================================================
  # Thread Polls
  # ============================================================================

  @doc """
  Create a poll for a thread.
  """
  def create_thread_poll(thread_id, attrs) do
    %ThreadPoll{}
    |> ThreadPoll.changeset(Map.put(attrs, :thread_id, thread_id))
    |> Repo.insert()
  end

  @doc """
  Get poll for a thread.
  """
  def get_thread_poll(thread_id) do
    Repo.get_by(ThreadPoll, thread_id: thread_id)
  end

  @doc """
  Vote on a poll.
  """
  def vote_poll(poll_id, user_id, option_ids) when is_list(option_ids) do
    poll = Repo.get!(ThreadPoll, poll_id)
    
    # Check if poll is closed
    if poll.close_date && DateTime.compare(DateTime.utc_now(), poll.close_date) == :gt do
      {:error, :poll_closed}
    else
      case Repo.get_by(PollVote, poll_id: poll_id, user_id: user_id) do
        nil ->
          # Validate options count
          if !poll.multiple_choice && length(option_ids) > 1 do
            {:error, :single_choice_only}
          else
            result = %PollVote{}
              |> PollVote.changeset(%{poll_id: poll_id, user_id: user_id, option_ids: option_ids})
              |> Repo.insert()
            
            case result do
              {:ok, vote} ->
                # Update poll totals
                from(p in ThreadPoll, where: p.id == ^poll_id)
                |> Repo.update_all(inc: [total_votes: 1])
                {:ok, vote}
              error -> error
            end
          end
        
        _existing ->
          {:error, :already_voted}
      end
    end
  end

  # ============================================================================
  # Forum User Groups
  # ============================================================================

  @doc """
  List user groups for a forum.
  """
  def list_user_groups(forum_id) do
    from(g in ForumUserGroup, 
      where: g.forum_id == ^forum_id,
      order_by: [asc: g.position, asc: g.name])
    |> Repo.all()
  end

  @doc """
  Create a user group.
  """
  def create_user_group(attrs) do
    %ForumUserGroup{}
    |> ForumUserGroup.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a user group.
  """
  def update_user_group(%ForumUserGroup{} = group, attrs) do
    group
    |> ForumUserGroup.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Get default user groups for a new forum.
  """
  def create_default_user_groups(forum_id) do
    groups = [
      %{
        name: "Administrators",
        forum_id: forum_id,
        is_staff: true,
        is_admin: true,
        color: "#FF0000",
        position: 1,
        can_moderate: true,
        can_manage_users: true,
        can_manage_settings: true
      },
      %{
        name: "Moderators",
        forum_id: forum_id,
        is_staff: true,
        color: "#00AA00",
        position: 2,
        can_moderate: true,
        can_edit_posts: true,
        can_delete_posts: true,
        can_lock_threads: true,
        can_pin_threads: true
      },
      %{
        name: "Members",
        forum_id: forum_id,
        is_default: true,
        position: 3
      },
      %{
        name: "Guests",
        forum_id: forum_id,
        position: 4,
        can_create_threads: false,
        can_reply: false,
        can_give_reputation: false
      }
    ]

    Enum.map(groups, &create_user_group/1)
  end

  # ============================================================================
  # Plugins
  # ============================================================================

  @doc """
  List all plugins for a forum.
  """
  def list_forum_plugins(forum_id) do
    from(p in ForumPlugin,
      where: p.forum_id == ^forum_id,
      order_by: [asc: p.position, asc: p.name]
    )
    |> Repo.all()
  end

  @doc """
  List active plugins for a forum.
  """
  def list_active_plugins(forum_id) do
    from(p in ForumPlugin,
      where: p.forum_id == ^forum_id and p.is_active == true,
      order_by: [asc: p.position]
    )
    |> Repo.all()
  end

  @doc """
  Get a plugin by ID.
  """
  def get_plugin(id) do
    case Repo.get(ForumPlugin, id) do
      nil -> {:error, :not_found}
      plugin -> {:ok, plugin}
    end
  end

  @doc """
  Get a plugin by forum_id and plugin_id.
  """
  def get_plugin_by_plugin_id(forum_id, plugin_id) do
    from(p in ForumPlugin,
      where: p.forum_id == ^forum_id and p.plugin_id == ^plugin_id
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      plugin -> {:ok, plugin}
    end
  end

  @doc """
  Install a plugin from the marketplace.
  """
  def install_plugin(forum_id, user_id, plugin_attrs) do
    attrs = plugin_attrs
      |> Map.put("forum_id", forum_id)
      |> Map.put("installed_by_id", user_id)
      |> Map.put("installed_at", DateTime.utc_now())

    %ForumPlugin{}
    |> ForumPlugin.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Uninstall a plugin.
  """
  def uninstall_plugin(%ForumPlugin{is_core: true}), do: {:error, :cannot_uninstall_core_plugin}
  def uninstall_plugin(%ForumPlugin{} = plugin), do: Repo.delete(plugin)

  @doc """
  Toggle plugin active status.
  """
  def toggle_plugin(%ForumPlugin{} = plugin) do
    plugin
    |> ForumPlugin.toggle_changeset(%{is_active: !plugin.is_active})
    |> Repo.update()
  end

  @doc """
  Update plugin settings.
  """
  def update_plugin_settings(%ForumPlugin{} = plugin, settings) do
    plugin
    |> ForumPlugin.settings_changeset(%{settings: settings})
    |> Repo.update()
  end

  @doc """
  List available plugins from the marketplace.
  These are the official and community plugins that can be installed.
  """
  def list_available_plugins do
    # This would typically fetch from a plugin registry/marketplace
    # For now, return a hardcoded list of available plugins
    [
      %{
        plugin_id: "syntax_highlighter",
        name: "Syntax Highlighter",
        description: "Add syntax highlighting to code blocks in posts. Supports 100+ languages.",
        version: "2.1.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "content",
        icon: "code",
        download_count: 15420,
        rating: 4.8,
        is_official: true
      },
      %{
        plugin_id: "poll_enhanced",
        name: "Enhanced Polls",
        description: "Create advanced polls with multiple choice, ratings, and image options.",
        version: "1.5.2",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "engagement",
        icon: "chart-bar",
        download_count: 12350,
        rating: 4.7,
        is_official: true
      },
      %{
        plugin_id: "spoiler_tags",
        name: "Spoiler Tags",
        description: "Allow users to hide spoiler content behind clickable tags.",
        version: "1.2.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "content",
        icon: "eye-slash",
        download_count: 8920,
        rating: 4.9,
        is_official: true
      },
      %{
        plugin_id: "reputation_badges",
        name: "Reputation Badges",
        description: "Award badges to users based on their reputation and achievements.",
        version: "2.0.1",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "gamification",
        icon: "trophy",
        download_count: 10230,
        rating: 4.6,
        is_official: true
      },
      %{
        plugin_id: "auto_moderation",
        name: "Auto Moderation",
        description: "Automatically detect and handle spam, toxicity, and rule violations.",
        version: "3.1.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "moderation",
        icon: "shield-check",
        download_count: 18750,
        rating: 4.5,
        is_official: true
      },
      %{
        plugin_id: "discord_integration",
        name: "Discord Integration",
        description: "Sync forum activity with Discord. Post notifications, role sync, and more.",
        version: "1.8.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "integration",
        icon: "chat-bubble",
        download_count: 22100,
        rating: 4.7,
        is_official: true
      },
      %{
        plugin_id: "media_embedder",
        name: "Media Embedder",
        description: "Automatically embed YouTube, Twitter, Spotify, and 50+ other media sources.",
        version: "2.3.1",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "content",
        icon: "play",
        download_count: 16890,
        rating: 4.8,
        is_official: true
      },
      %{
        plugin_id: "user_titles",
        name: "Custom User Titles",
        description: "Allow users to create custom titles based on post count or reputation.",
        version: "1.4.0",
        author: "Community",
        author_url: nil,
        category: "customization",
        icon: "tag",
        download_count: 5430,
        rating: 4.4,
        is_official: false
      },
      %{
        plugin_id: "thread_prefixes",
        name: "Thread Prefixes",
        description: "Add colorful prefixes to threads like [Solved], [Help], [Discussion].",
        version: "1.1.0",
        author: "Community",
        author_url: nil,
        category: "organization",
        icon: "bookmark",
        download_count: 7820,
        rating: 4.6,
        is_official: false
      },
      %{
        plugin_id: "mybb_importer",
        name: "MyBB Importer",
        description: "Import your existing MyBB forum data including users, threads, and posts.",
        version: "1.0.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "migration",
        icon: "download",
        download_count: 3210,
        rating: 4.3,
        is_official: true
      }
    ]
  end

  @doc """
  Get available plugin by plugin_id from marketplace.
  """
  def get_available_plugin(plugin_id) do
    list_available_plugins()
    |> Enum.find(&(&1.plugin_id == plugin_id))
    |> case do
      nil -> {:error, :not_found}
      plugin -> {:ok, plugin}
    end
  end

  @doc """
  Get plugins for a specific hook.
  """
  def get_plugins_for_hook(forum_id, hook) do
    from(p in ForumPlugin,
      where: p.forum_id == ^forum_id and p.is_active == true and ^hook in p.hooks
    )
    |> Repo.all()
  end
end
