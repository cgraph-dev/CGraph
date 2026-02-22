defmodule CGraph.Forums.Core.Stats do
  @moduledoc """
  Forum statistics, content reporting, rate limiting, view tracking, and notifications.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete
  alias CGraph.Forums.{Comment, ContentReport, Forum, ForumMember, Post, Thread, ThreadPost}
  alias CGraph.Repo

  # ============================================================================
  # Counts & Stats
  # ============================================================================

  @doc "Count forums owned by a user."
  @spec count_user_forums(binary()) :: non_neg_integer()
  def count_user_forums(user_id) do
    Repo.aggregate(from(f in Forum, where: f.owner_id == ^user_id and not_deleted(f)), :count, :id)
  end

  @doc "Count forums a user has joined."
  @spec count_user_joined_forums(binary()) :: non_neg_integer()
  def count_user_joined_forums(user_id) do
    Repo.aggregate(
      from(m in ForumMember, where: m.user_id == ^user_id, join: f in Forum, on: f.id == m.forum_id, where: not_deleted(f)),
      :count, :id
    )
  end

  @doc "Count threads created by user today."
  @spec count_user_threads_today(binary()) :: non_neg_integer()
  def count_user_threads_today(user_id) do
    today_start = Date.utc_today() |> DateTime.new!(~T[00:00:00], "Etc/UTC")
    Repo.aggregate(from(t in Thread, where: t.user_id == ^user_id and t.inserted_at >= ^today_start), :count, :id)
  end

  @doc "Count posts created by user today."
  @spec count_user_posts_today(binary()) :: non_neg_integer()
  def count_user_posts_today(user_id) do
    today_start = Date.utc_today() |> DateTime.new!(~T[00:00:00], "Etc/UTC")
    Repo.aggregate(from(p in ThreadPost, where: p.user_id == ^user_id and p.inserted_at >= ^today_start), :count, :id)
  end

  @doc "Get forum statistics."
  @spec get_forum_stats(struct()) :: map()
  def get_forum_stats(forum) do
    post_count = Repo.aggregate(from(p in Post, where: p.forum_id == ^forum.id), :count, :id)
    comment_count = Repo.aggregate(
      from(c in Comment, join: p in Post, on: c.post_id == p.id, where: p.forum_id == ^forum.id),
      :count, :id
    )
    %{post_count: post_count, comment_count: comment_count, member_count: forum.member_count || 0}
  end

  # ============================================================================
  # Content Reporting & Moderation
  # ============================================================================

  @doc "Get moderation queue for a forum (pending reports)."
  @spec get_mod_queue(struct(), keyword()) :: {[struct()], map()}
  def get_mod_queue(forum, opts) do
    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 20
    )

    query = from(r in ContentReport,
      where: r.forum_id == ^forum.id,
      where: r.status == "pending",
      preload: [:reporter]
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Report content in a forum (post, comment, or user)."
  @spec report_content(struct(), struct(), String.t(), binary(), String.t(), String.t() | nil) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def report_content(forum, reporter, target_type, target_id, reason, description) do
    attrs = %{
      forum_id: forum.id,
      reporter_id: reporter.id,
      target_type: target_type,
      target_id: target_id,
      reason: reason,
      description: description
    }

    %ContentReport{}
    |> ContentReport.changeset(attrs)
    |> Repo.insert()
  end

  @doc "Review a content report (resolve or dismiss)."
  @spec review_report(binary(), struct(), String.t(), String.t() | nil) :: {:ok, struct()} | {:error, :not_found | Ecto.Changeset.t()}
  def review_report(report_id, reviewer, status, note) do
    case Repo.get(ContentReport, report_id) do
      nil -> {:error, :not_found}
      report ->
        report
        |> ContentReport.review_changeset(%{
          status: status,
          reviewed_by_id: reviewer.id,
          reviewed_at: DateTime.truncate(DateTime.utc_now(), :second),
          resolution_note: note
        })
        |> Repo.update()
    end
  end

  # ============================================================================
  # Rate Limiting & Views
  # ============================================================================

  @doc "Increment post views."
  @spec increment_post_views(struct()) :: {:ok, struct()}
  def increment_post_views(post) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(inc: [view_count: 1])
    {:ok, %{post | view_count: (post.view_count || 0) + 1}}
  end

  @doc "Increment thread views."
  @spec increment_thread_views(binary()) :: {non_neg_integer(), nil | [term()]}
  def increment_thread_views(thread_id) do
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(inc: [view_count: 1])
  end

  @doc "Check post rate limit for a user."
  @spec check_post_rate_limit(struct()) :: :ok | {:error, :rate_limited}
  def check_post_rate_limit(user) do
    # Allow 10 posts per 5 minutes
    five_min_ago = DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -300, :second)
    count = Repo.aggregate(
      from(p in Post, where: p.author_id == ^user.id and p.inserted_at >= ^five_min_ago),
      :count, :id
    )
    if count >= 10, do: {:error, :rate_limited}, else: :ok
  end

  @doc "Check comment rate limit for a user."
  @spec check_comment_rate_limit(struct(), struct() | nil) :: :ok | {:error, :rate_limited}
  def check_comment_rate_limit(user, _post) do
    five_min_ago = DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -300, :second)
    count = Repo.aggregate(
      from(c in Comment, where: c.author_id == ^user.id and c.inserted_at >= ^five_min_ago),
      :count, :id
    )
    if count >= 20, do: {:error, :rate_limited}, else: :ok
  end

  @doc "Notify post author about a new comment."
  @spec notify_comment(struct()) :: :ok
  def notify_comment(comment) do
    comment = Repo.preload(comment, [:author, post: [:author]])
    post = comment.post
    commenter = comment.author

    # Don't notify yourself
    if post && commenter && post.author_id != comment.author_id do
      CGraph.Notifications.notify(
        post.author,
        :forum_comment,
        "New comment on \"#{post.title}\"",
        body: "#{commenter.username} commented: #{String.slice(comment.body || "", 0..99)}",
        actor: commenter,
        data: %{
          post_id: post.id,
          comment_id: comment.id,
          forum_id: post.forum_id
        },
        group_key: "post:#{post.id}:comments"
      )
    end

    :ok
  end
end
