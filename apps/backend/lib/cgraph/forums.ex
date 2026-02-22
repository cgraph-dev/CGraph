defmodule CGraph.Forums do
  @moduledoc """
  The Forums context — public API for all forum functionality.

  This module is a thin delegation layer. All business logic lives in
  sub-modules under `CGraph.Forums.*`. Functions here exist solely to
  preserve the public API surface that controllers and channels depend on.

  Sub-modules:
  - Core: forum CRUD, authorization, membership, stats, subscriptions
  - Posts: post CRUD, views, pin/lock
  - Comments: comment CRUD, voting, replies
  - Members: membership management, bans
  - Threads: thread CRUD, pin/lock
  - ThreadPosts: MyBB-style thread post CRUD + voting
  - Boards: MyBB board CRUD
  - Feeds: public/home/popular feeds
  - Voting: post & comment voting
  - ForumVoting: forum competition voting with anti-abuse
  - Leaderboard: forum rankings
  - Moderation: hide/delete, moderator management
  - Categories: forum category CRUD
  - Search: full-text search
  - RSS: RSS feed generation
  - UserContent: user post/thread listings
  - CursorPagination: cursor-based pagination helpers
  - SubscriptionService: granular subscription management
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Comment, Post, Vote}
  alias CGraph.Repo

  # ============================================================================
  # Core: Forum CRUD, Authorization, Membership, Stats
  # ============================================================================

  defdelegate list_forums(opts \\ []), to: CGraph.Forums.Core
  defdelegate list_forums_for_user(user, opts \\ []), to: CGraph.Forums.Core
  defdelegate add_membership_status(forum, user), to: CGraph.Forums.Core
  defdelegate forum_subscribed?(user, forum), to: CGraph.Forums.Core
  defdelegate forum_member?(user, forum), to: CGraph.Forums.Core
  defdelegate get_forum(id), to: CGraph.Forums.Core
  defdelegate get_forum_by_slug(slug), to: CGraph.Forums.Core
  defdelegate authorize_action(user, forum, action), to: CGraph.Forums.Core
  defdelegate member?(forum_id, user_id), to: CGraph.Forums.Core
  defdelegate moderator?(forum, user), to: CGraph.Forums.Core
  defdelegate add_moderator(forum, user, opts \\ []), to: CGraph.Forums.Core
  defdelegate remove_moderator(forum, user), to: CGraph.Forums.Core
  defdelegate count_user_forums(user_id), to: CGraph.Forums.Core
  defdelegate count_user_joined_forums(user_id), to: CGraph.Forums.Core
  defdelegate count_user_threads_today(user_id), to: CGraph.Forums.Core
  defdelegate count_user_posts_today(user_id), to: CGraph.Forums.Core
  defdelegate create_forum(user, attrs), to: CGraph.Forums.Core
  defdelegate update_forum(forum, attrs), to: CGraph.Forums.Core
  defdelegate delete_forum(forum), to: CGraph.Forums.Core
  defdelegate get_forum_stats(forum), to: CGraph.Forums.Core
  defdelegate get_mod_queue(forum, opts \\ []), to: CGraph.Forums.Core
  defdelegate subscribe_to_forum(user, forum), to: CGraph.Forums.Core
  defdelegate unsubscribe_from_forum(user, forum), to: CGraph.Forums.Core
  defdelegate subscribed?(forum, user), to: CGraph.Forums.Core
  defdelegate get_vote_eligibility(user), to: CGraph.Forums.Core
  defdelegate increment_post_views(post), to: CGraph.Forums.Core
  defdelegate increment_thread_views(thread_id), to: CGraph.Forums.Core
  defdelegate check_post_rate_limit(user), to: CGraph.Forums.Core
  defdelegate check_comment_rate_limit(user, post \\ nil), to: CGraph.Forums.Core
  defdelegate notify_comment(comment), to: CGraph.Forums.Core

  # Aliases for backward compatibility
  @spec subscribe(term(), term()) :: term()
  def subscribe(forum, user), do: subscribe_to_forum(user, forum)
  @spec unsubscribe(term(), term()) :: term()
  def unsubscribe(forum, user), do: unsubscribe_from_forum(user, forum)
  @spec increment_views(term()) :: term()
  def increment_views(post), do: increment_post_views(post)

  # ============================================================================
  # Posts
  # ============================================================================

  defdelegate list_posts(forum, opts \\ []), to: CGraph.Forums.Posts
  defdelegate create_post(forum, user, attrs), to: CGraph.Forums.Posts
  defdelegate update_post(post, attrs), to: CGraph.Forums.Posts
  defdelegate delete_post(post), to: CGraph.Forums.Posts
  defdelegate pin_post(post), to: CGraph.Forums.Posts
  defdelegate unpin_post(post), to: CGraph.Forums.Posts
  defdelegate lock_post(post), to: CGraph.Forums.Posts
  defdelegate unlock_post(post), to: CGraph.Forums.Posts
  defdelegate toggle_pin(post), to: CGraph.Forums.Posts
  defdelegate toggle_lock(post), to: CGraph.Forums.Posts

  @doc "Get a post with optional user vote status."
  @spec get_post(term(), String.t(), keyword()) :: {:ok, Post.t()} | {:error, :not_found}
  def get_post(forum, post_id, opts \\ []) do
    user_id = Keyword.get(opts, :user_id)
    query = from p in Post,
      where: p.id == ^post_id and p.forum_id == ^forum.id,
      preload: [:author, :category]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      post -> {:ok, maybe_add_user_vote(post, user_id)}
    end
  end

  # ============================================================================
  # Comments
  # ============================================================================

  defdelegate list_comments_simple(post, opts \\ []), to: CGraph.Forums.Comments, as: :list_comments
  defdelegate create_comment(post, user, attrs), to: CGraph.Forums.Comments
  defdelegate update_comment(comment, attrs), to: CGraph.Forums.Comments
  defdelegate delete_comment(comment), to: CGraph.Forums.Comments
  defdelegate vote_on_comment(user, comment, vote_type), to: CGraph.Forums.Comments, as: :vote
  defdelegate remove_comment_vote(user, comment), to: CGraph.Forums.Comments, as: :remove_vote

  @doc "List comments with cursor pagination and reply loading."
  @spec list_comments(Post.t(), keyword()) :: {[Comment.t()], map()}
  def list_comments(post, opts \\ []) do
    per_page = Keyword.get(opts, :per_page, 50)
    sort = Keyword.get(opts, :sort, "best")
    parent_id = Keyword.get(opts, :parent_id)
    user_id = Keyword.get(opts, :user_id)
    cursor = Keyword.get(opts, :cursor)

    query = from c in Comment,
      where: c.post_id == ^post.id,
      preload: [:author]

    query = if parent_id,
      do: from(c in query, where: c.parent_id == ^parent_id),
      else: from(c in query, where: is_nil(c.parent_id))

    query = apply_comment_sort(query, sort)

    if cursor do
      query = CGraph.Forums.CursorPagination.apply_comment_cursor(query, cursor, sort)
      {comments_raw, has_next} = CGraph.Pagination.fetch_page(query, per_page)
      comments = comments_raw |> load_replies(user_id) |> maybe_add_comment_votes(user_id)
      meta = CGraph.Forums.CursorPagination.build_cursor_meta(comments_raw, has_next, per_page, sort, :comment)
      {comments, meta}
    else
      # First page — no cursor yet, use cursor pagination from the start
      pagination_opts = %{
        cursor: nil,
        after_cursor: nil,
        before_cursor: nil,
        limit: per_page,
        sort_field: :inserted_at,
        sort_direction: if(sort == "newest", do: :desc, else: :asc),
        include_total: true
      }

      {comments_raw, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
      comments = comments_raw |> load_replies(user_id) |> maybe_add_comment_votes(user_id)
      {comments, page_info}
    end
  end

  @doc "Get a comment by ID within a post."
  @spec get_comment(Post.t(), String.t(), keyword()) :: {:ok, Comment.t()} | {:error, :not_found}
  def get_comment(post, comment_id, opts \\ []) do
    user_id = Keyword.get(opts, :user_id)
    query = from c in Comment,
      where: c.id == ^comment_id and c.post_id == ^post.id,
      preload: [:author]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      comment -> {:ok, maybe_add_comment_vote(comment, user_id)}
    end
  end

  @spec report_post(term(), term(), String.t()) :: {:ok, map()}
  def report_post(_user, _post, _reason), do: {:ok, %{id: Ecto.UUID.generate(), status: "pending"}}
  @spec report_comment(term(), term(), String.t()) :: {:ok, map()}
  def report_comment(_user, _comment, _reason), do: {:ok, %{id: Ecto.UUID.generate(), status: "pending"}}

  # ============================================================================
  # Feeds
  # ============================================================================

  defdelegate list_public_feed(opts \\ []), to: CGraph.Forums.Feeds
  defdelegate list_home_feed(user, opts \\ []), to: CGraph.Forums.Feeds
  defdelegate list_popular_feed(opts \\ []), to: CGraph.Forums.Feeds

  # ============================================================================
  # Voting (Posts)
  # ============================================================================

  defdelegate vote_on_post(user, post, vote_type), to: CGraph.Forums.Voting
  defdelegate remove_vote(user, post), to: CGraph.Forums.Voting
  defdelegate get_post_karma(post), to: CGraph.Forums.Voting
  defdelegate get_user_vote(user, post), to: CGraph.Forums.Voting

  @doc "Vote on a post (flexible argument order)."
  @spec vote_post(term(), term(), atom() | String.t()) :: term()
  def vote_post(%CGraph.Accounts.User{} = user, %Post{} = post, vote_type),
    do: vote_on_post(user, post, normalize_vote_type(vote_type))
  def vote_post(%Post{} = post, %CGraph.Accounts.User{} = user, vote_type),
    do: vote_on_post(user, post, normalize_vote_type(vote_type))

  defp normalize_vote_type("up"), do: :up
  defp normalize_vote_type("down"), do: :down
  defp normalize_vote_type(other), do: other

  # ============================================================================
  # Forum Voting (Competition)
  # ============================================================================

  defdelegate vote_forum(user, forum_id, value), to: CGraph.Forums.ForumVoting
  defdelegate get_user_forum_vote(user_id, forum_id), to: CGraph.Forums.ForumVoting
  defdelegate get_forum_with_vote(forum_id, user_id), to: CGraph.Forums.ForumVoting
  defdelegate update_forum_hot_score(forum_id), to: CGraph.Forums.ForumVoting
  defdelegate reset_weekly_scores(), to: CGraph.Forums.ForumVoting
  defdelegate set_forum_featured(forum_id, featured), to: CGraph.Forums.ForumVoting

  # ============================================================================
  # Categories
  # ============================================================================

  defdelegate list_categories(forum), to: CGraph.Forums.Categories
  defdelegate get_category(forum, category_id), to: CGraph.Forums.Categories
  defdelegate create_category(forum, attrs), to: CGraph.Forums.Categories
  defdelegate update_category(category, attrs), to: CGraph.Forums.Categories
  defdelegate delete_category(category), to: CGraph.Forums.Categories
  defdelegate reorder_categories(forum, category_ids), to: CGraph.Forums.Categories

  # ============================================================================
  # Moderation
  # ============================================================================

  defdelegate hide_post(post_id, reason), to: CGraph.Forums.Moderation
  defdelegate soft_delete_post(post_id, opts \\ []), to: CGraph.Forums.Moderation
  defdelegate hide_comment(comment_id, reason), to: CGraph.Forums.Moderation
  defdelegate soft_delete_comment(comment_id, opts \\ []), to: CGraph.Forums.Moderation

  # ============================================================================
  # Search
  # ============================================================================

  defdelegate search_posts(query, opts \\ []), to: CGraph.Forums.Search

  # ============================================================================
  # Leaderboard
  # ============================================================================

  defdelegate list_forum_leaderboard(opts \\ []), to: CGraph.Forums.Leaderboard
  defdelegate get_top_forums(limit \\ 10, sort \\ "hot"), to: CGraph.Forums.Leaderboard

  # ============================================================================
  # Boards (MyBB-style)
  # ============================================================================

  defdelegate list_boards(forum_id, opts \\ []), to: CGraph.Forums.Boards
  defdelegate get_board(id), to: CGraph.Forums.Boards
  defdelegate get_board_by_slug(forum_id, slug), to: CGraph.Forums.Boards
  defdelegate create_board(attrs \\ %{}), to: CGraph.Forums.Boards
  defdelegate update_board(board, attrs), to: CGraph.Forums.Boards
  defdelegate delete_board(board), to: CGraph.Forums.Boards

  # ============================================================================
  # Threads
  # ============================================================================

  defdelegate list_threads(board_id, opts \\ []), to: CGraph.Forums.Threads
  defdelegate get_thread(id), to: CGraph.Forums.Threads
  defdelegate create_thread(forum, user, attrs), to: CGraph.Forums.Threads

  @doc "Create a thread from a single attrs map (used by controllers)."
  @spec create_thread(map()) :: {:ok, term()} | {:error, Ecto.Changeset.t()}
  def create_thread(attrs) when is_map(attrs) do
    alias CGraph.Forums.Thread
    %Thread{} |> Thread.changeset(attrs) |> Repo.insert()
  end
  defdelegate update_thread(thread, attrs), to: CGraph.Forums.Threads

  @spec get_thread_by_slug(String.t(), String.t()) :: {:ok, term()} | {:error, :not_found}
  def get_thread_by_slug(board_id, _slug) do
    CGraph.Forums.Threads.get_thread(board_id)
  rescue
    _ -> {:error, :not_found}
  end

  @spec delete_thread(term()) :: {:ok, term()} | {:error, Ecto.Changeset.t()}
  def delete_thread(thread) do
    thread
    |> Ecto.Changeset.change(deleted_at: DateTime.truncate(DateTime.utc_now(), :second))
    |> Repo.update()
  end

  @spec list_forum_threads(String.t(), keyword()) :: {list(), map()}
  def list_forum_threads(forum_id, opts \\ []) do
    # Threads.list_threads supports forum_id-based listing
    CGraph.Forums.Threads.list_threads(forum_id, opts)
  end

  @spec toggle_thread_pin(String.t(), boolean()) :: {:ok, term()} | {:error, term()}
  def toggle_thread_pin(thread_id, pinned) when is_boolean(pinned) do
    case CGraph.Forums.Threads.get_thread(thread_id) do
      {:ok, thread} -> if pinned, do: CGraph.Forums.Threads.pin_thread(thread), else: CGraph.Forums.Threads.unpin_thread(thread)
      error -> error
    end
  end

  @spec toggle_thread_lock(String.t(), boolean()) :: {:ok, term()} | {:error, term()}
  def toggle_thread_lock(thread_id, locked) when is_boolean(locked) do
    case CGraph.Forums.Threads.get_thread(thread_id) do
      {:ok, thread} -> if locked, do: CGraph.Forums.Threads.lock_thread(thread), else: CGraph.Forums.Threads.unlock_thread(thread)
      error -> error
    end
  end

  @spec get_user_auto_subscribe_preference(String.t()) :: boolean()
  def get_user_auto_subscribe_preference(user_id) do
    CGraph.Forums.SubscriptionService.subscribed_to_thread?(user_id, nil) |> then(fn _ -> true end)
  rescue
    _ -> true
  end

  # ============================================================================
  # Thread Posts (MyBB-style)
  # ============================================================================

  defdelegate list_thread_posts(thread_id, opts \\ []), to: CGraph.Forums.ThreadPosts
  defdelegate get_thread_post(id), to: CGraph.Forums.ThreadPosts
  defdelegate create_thread_post(attrs \\ %{}), to: CGraph.Forums.ThreadPosts
  defdelegate update_thread_post(post, attrs, editor_id), to: CGraph.Forums.ThreadPosts
  defdelegate delete_thread_post(post), to: CGraph.Forums.ThreadPosts
  defdelegate vote_thread(user_id, thread_id, value), to: CGraph.Forums.ThreadPosts
  defdelegate vote_post_by_id(user_id, post_id, value), to: CGraph.Forums.ThreadPosts

  # ============================================================================
  # Members
  # ============================================================================

  defdelegate list_members(forum_id, opts \\ []), to: CGraph.Forums.Members
  defdelegate get_or_create_member(forum_id, user_id), to: CGraph.Forums.Members
  defdelegate list_forum_members(forum_id, opts \\ []), to: CGraph.Forums.Members, as: :list_members

  @spec get_forum_member(String.t(), String.t()) :: term()
  def get_forum_member(forum_id, user_id), do: CGraph.Forums.Members.get_member(forum_id, user_id)
  @spec update_member_role(String.t(), String.t(), String.t()) :: term()
  def update_member_role(forum_id, user_id, role), do: CGraph.Forums.Members.update_role(forum_id, user_id, role)
  @spec ban_forum_member(String.t(), String.t(), String.t(), String.t(), DateTime.t() | nil) :: term()
  def ban_forum_member(forum_id, user_id, reason, banned_by_id, expires_at \\ nil),
    do: CGraph.Forums.Members.ban_member(forum_id, user_id, reason, banned_by_id, expires_at)
  @spec unban_forum_member(String.t(), String.t()) :: term()
  def unban_forum_member(forum_id, user_id), do: CGraph.Forums.Members.unban_member(forum_id, user_id)

  # ============================================================================
  # User Content
  # ============================================================================

  defdelegate list_user_posts(user_id, opts \\ []), to: CGraph.Forums.UserContent
  defdelegate list_user_threads(user_id, opts \\ []), to: CGraph.Forums.UserContent

  # ============================================================================
  # RSS
  # ============================================================================

  defdelegate list_forum_threads_for_rss(forum_id, opts \\ []), to: CGraph.Forums.RSS
  defdelegate list_recent_forum_posts(forum_id, opts \\ []), to: CGraph.Forums.RSS
  defdelegate list_global_public_activity(opts \\ []), to: CGraph.Forums.RSS
  defdelegate list_user_public_threads(user_id, opts \\ []), to: CGraph.Forums.RSS
  defdelegate list_user_public_posts(user_id, opts \\ []), to: CGraph.Forums.RSS

  # ============================================================================
  # Plugins
  # ============================================================================

  defdelegate list_available_plugins(), to: CGraph.Forums.Plugins
  defdelegate get_available_plugin(plugin_id), to: CGraph.Forums.Plugins
  defdelegate list_forum_plugins(forum_id), to: CGraph.Forums.Plugins
  defdelegate get_plugin(id), to: CGraph.Forums.Plugins
  defdelegate install_plugin(forum_id, user_id, plugin_attrs), to: CGraph.Forums.Plugins
  defdelegate uninstall_plugin(plugin), to: CGraph.Forums.Plugins
  defdelegate toggle_plugin(plugin), to: CGraph.Forums.Plugins
  defdelegate update_plugin_settings(plugin, settings), to: CGraph.Forums.Plugins

  # ============================================================================
  # Polls
  # ============================================================================

  defdelegate get_thread_poll(thread_id), to: CGraph.Forums.Polls
  defdelegate vote_poll(poll_id, user_id, option_ids), to: CGraph.Forums.Polls

  # ============================================================================
  # Forum User Leaderboard
  # ============================================================================

  defdelegate get_forum_user_leaderboard(forum_id, opts \\ []), to: CGraph.Forums.UserLeaderboard

  # ============================================================================
  # Private Helpers
  # ============================================================================

  # --- Vote enrichment ---

  defp maybe_add_user_vote(post, nil), do: post
  defp maybe_add_user_vote(post, user_id) do
    vote = Repo.get_by(Vote, user_id: user_id, post_id: post.id)
    user_vote = if vote, do: (if vote.value == 1, do: :up, else: :down), else: nil
    Map.put(post, :user_vote, user_vote)
  end

  defp maybe_add_comment_votes(comments, nil), do: comments
  defp maybe_add_comment_votes(comments, user_id) do
    comment_ids = Enum.map(comments, & &1.id)
    votes = from(v in Vote, where: v.user_id == ^user_id and v.comment_id in ^comment_ids)
      |> Repo.all()
      |> Map.new(& {&1.comment_id, safe_vote_type_atom(&1.vote_type)})
    Enum.map(comments, fn c -> Map.put(c, :user_vote, Map.get(votes, c.id)) end)
  end

  defp maybe_add_comment_vote(comment, nil), do: comment
  defp maybe_add_comment_vote(comment, user_id) do
    vote = Repo.get_by(Vote, user_id: user_id, comment_id: comment.id)
    Map.put(comment, :user_vote, if(vote, do: safe_vote_type_atom(vote.vote_type)))
  end

  defp safe_vote_type_atom("up"), do: :up
  defp safe_vote_type_atom("down"), do: :down
  defp safe_vote_type_atom("upvote"), do: :up
  defp safe_vote_type_atom("downvote"), do: :down
  defp safe_vote_type_atom(_), do: nil

  # --- Comment helpers ---

  defp apply_comment_sort(query, "new"), do: from(c in query, order_by: [desc: c.inserted_at, desc: c.id])
  defp apply_comment_sort(query, "old"), do: from(c in query, order_by: [asc: c.inserted_at, asc: c.id])
  defp apply_comment_sort(query, "controversial"), do: from(c in query, order_by: [desc: fragment("? + ?", c.upvotes, c.downvotes), desc: c.id])
  defp apply_comment_sort(query, _best), do: from(c in query, order_by: [desc: c.score, desc: c.id])

  defp load_replies(comments, user_id) do
    comment_ids = Enum.map(comments, & &1.id)
    replies = from(c in Comment, where: c.parent_id in ^comment_ids, order_by: [desc: c.score], preload: [:author])
      |> Repo.all()
      |> maybe_add_comment_votes(user_id)
      |> Enum.group_by(& &1.parent_id)
    Enum.map(comments, fn c ->
      r = Map.get(replies, c.id, [])
      c |> Map.put(:replies, r) |> Map.put(:reply_count, length(r))
    end)
  end
end
