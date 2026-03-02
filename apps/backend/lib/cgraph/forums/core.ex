defmodule CGraph.Forums.Core do
  @moduledoc """
  Core forum operations — CRUD, authorization, membership checks, subscription, stats.

  Delegates to focused submodules:

  - `CGraph.Forums.Core.Listing` — forum listing, retrieval, membership status
  - `CGraph.Forums.Core.Authorization` — action authorization, moderator management
  - `CGraph.Forums.Core.Membership` — CRUD, subscriptions, vote eligibility
  - `CGraph.Forums.Core.Stats` — counts, statistics, rate limits, notifications
  """

  alias CGraph.Forums.Core.{Authorization, Listing, Membership, Stats}

  # ============================================================================
  # Listing & Retrieval
  # ============================================================================

  @doc "List all public forums."
  @spec list_forums(keyword()) :: {[struct()], map()}
  def list_forums(opts \\ []), do: Listing.list_forums_for_user(nil, opts)

  @doc "List forums accessible to a user."
  @spec list_forums_for_user(struct() | nil, keyword()) :: {[struct()], map()}
  def list_forums_for_user(user, opts \\ []), do: Listing.list_forums_for_user(user, opts)

  @doc "List public forums for the explore/discovery page."
  @spec list_public_forums(keyword()) :: {[struct()], map()}
  def list_public_forums(opts \\ []), do: Listing.list_public_forums(opts)

  defdelegate add_membership_status(forum, user), to: Listing
  defdelegate forum_subscribed?(user, forum), to: Listing
  defdelegate forum_member?(user, forum), to: Listing
  defdelegate get_forum(id), to: Listing
  defdelegate get_forum_by_slug(slug), to: Listing

  # ============================================================================
  # Authorization
  # ============================================================================

  defdelegate authorize_action(user, forum, action), to: Authorization
  defdelegate member?(forum_id, user_id), to: Authorization
  defdelegate moderator?(forum, user), to: Authorization

  @doc "Add a moderator to a forum."
  @spec add_moderator(struct(), struct(), keyword()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def add_moderator(forum, user, opts \\ []), do: Authorization.add_moderator(forum, user, opts)

  defdelegate remove_moderator(forum, user), to: Authorization

  # ============================================================================
  # CRUD & Membership
  # ============================================================================

  defdelegate create_forum(user, attrs), to: Membership
  defdelegate update_forum(forum, attrs), to: Membership
  defdelegate delete_forum(forum), to: Membership
  defdelegate subscribe_to_forum(user, forum), to: Membership
  defdelegate unsubscribe_from_forum(user, forum), to: Membership
  defdelegate subscribed?(forum, user), to: Membership
  defdelegate get_vote_eligibility(user), to: Membership

  # ============================================================================
  # Stats & Helpers
  # ============================================================================

  defdelegate count_user_forums(user_id), to: Stats
  defdelegate count_user_joined_forums(user_id), to: Stats
  defdelegate count_user_threads_today(user_id), to: Stats
  defdelegate count_user_posts_today(user_id), to: Stats
  defdelegate get_forum_stats(forum), to: Stats
  defdelegate increment_post_views(post), to: Stats
  defdelegate increment_thread_views(thread_id), to: Stats
  defdelegate check_post_rate_limit(user), to: Stats
  defdelegate notify_comment(comment), to: Stats

  @doc "Get moderation queue for a forum (pending reports)."
  @spec get_mod_queue(struct(), keyword()) :: {[struct()], map()}
  def get_mod_queue(forum, opts \\ []), do: Stats.get_mod_queue(forum, opts)

  @doc "Report content in a forum."
  @spec report_content(struct(), struct(), String.t(), binary(), String.t(), String.t() | nil) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def report_content(forum, reporter, target_type, target_id, reason, description \\ nil),
    do: Stats.report_content(forum, reporter, target_type, target_id, reason, description)

  @doc "Review a content report."
  @spec review_report(binary(), struct(), String.t(), String.t() | nil) :: {:ok, struct()} | {:error, :not_found | Ecto.Changeset.t()}
  def review_report(report_id, reviewer, status, note \\ nil),
    do: Stats.review_report(report_id, reviewer, status, note)

  @doc "Check comment rate limit for a user."
  @spec check_comment_rate_limit(struct(), struct() | nil) :: :ok | {:error, :rate_limited}
  def check_comment_rate_limit(user, post \\ nil), do: Stats.check_comment_rate_limit(user, post)
end
