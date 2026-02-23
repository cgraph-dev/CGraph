defmodule CGraph.Workers.EmailDigestWorker do
  @moduledoc """
  Oban worker for sending periodic email digests to users.

  Runs on a scheduled basis (daily/weekly/monthly) based on user preferences.
  Generates personalized digest emails with:
  - Activity stats (messages, XP, achievements)
  - Trending forum posts
  - Unread messages
  - New achievements

  Usage:
    # Enqueue digest generation for a specific user
    %{user_id: user_id}
    |> EmailDigestWorker.new()
    |> Oban.insert()

    # Enqueue digest generation for all eligible users
    EmailDigestWorker.enqueue_all_digests()
  """

  use Oban.Worker,
    queue: :mailers,
    max_attempts: 3,
    priority: 2

  import Ecto.Query
  alias CGraph.{Accounts, Mailer, Repo}
  alias CGraph.Accounts.User

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:ok, String.t()} | {:error, term()}
  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) when args == %{} or not is_map_key(args, "user_id") do
    # Cron-triggered: dispatch digest emails for all eligible users
    enqueue_all_digests()
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    with {:ok, user} <- Accounts.get_user(user_id),
         true <- should_send_digest?(user),
         {:ok, digest_data} <- generate_digest_data(user),
         :ok <- send_digest_email(user, digest_data),
         {:ok, _user} <- update_last_digest_sent(user) do
      {:ok, "Digest sent to #{user.email}"}
    else
      {:error, :not_found} -> {:error, "User not found"}
      false -> {:ok, "Digest not due for this user"}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Enqueue digest emails for all users who are due to receive one.
  This function should be called by a periodic cron job.
  """
  @spec enqueue_all_digests() :: {:ok, String.t()}
  def enqueue_all_digests do
    now = DateTime.utc_now()

    # Find users who should receive digests
    users =
      from(u in User,
        where: u.email_digest_enabled == true,
        where:
          is_nil(u.last_digest_sent_at) or
            (u.email_digest_frequency == "daily" and
               fragment("? < NOW() - INTERVAL '1 day'", u.last_digest_sent_at)) or
            (u.email_digest_frequency == "weekly" and
               fragment("? < NOW() - INTERVAL '7 days'", u.last_digest_sent_at)) or
            (u.email_digest_frequency == "monthly" and
               fragment("? < NOW() - INTERVAL '30 days'", u.last_digest_sent_at)),
        select: u.id
      )
      |> Repo.all()

    # Enqueue a job for each user
    jobs =
      Enum.map(users, fn user_id ->
        %{user_id: user_id}
        |> new(scheduled_at: now)
      end)

    results = Oban.insert_all(jobs)
    {:ok, "Enqueued #{length(results)} digest emails"}
  end

  # Private Functions

  defp should_send_digest?(user) do
    user.email_digest_enabled and
      (is_nil(user.last_digest_sent_at) or digest_is_due?(user))
  end

  defp digest_is_due?(user) do
    now = DateTime.utc_now()
    last_sent = user.last_digest_sent_at

    case user.email_digest_frequency do
      "daily" -> DateTime.diff(now, last_sent, :day) >= 1
      "weekly" -> DateTime.diff(now, last_sent, :day) >= 7
      "monthly" -> DateTime.diff(now, last_sent, :day) >= 30
      _ -> false
    end
  end

  defp generate_digest_data(user) do
    # Calculate the period based on digest frequency
    period_start =
      case user.email_digest_frequency do
        "daily" -> DateTime.add(DateTime.utc_now(), -1, :day)
        "weekly" -> DateTime.add(DateTime.utc_now(), -7, :day)
        "monthly" -> DateTime.add(DateTime.utc_now(), -30, :day)
        _ -> DateTime.add(DateTime.utc_now(), -7, :day)
      end

    # Fetch activity stats
    stats = %{
      new_messages: count_new_messages(user.id, period_start),
      xp_earned: calculate_xp_earned(user.id, period_start),
      achievements: count_new_achievements(user.id, period_start)
    }

    # Fetch trending posts
    trending_posts = fetch_trending_posts(user.id, period_start, limit: 5)

    # Fetch unread messages
    unread_messages = fetch_unread_messages(user.id, limit: 10)

    # Fetch new achievements
    new_achievements = fetch_new_achievements(user.id, period_start, limit: 5)

    period_label = format_period_label(user.email_digest_frequency)

    {:ok,
     %{
       period: period_label,
       stats: stats,
       trending_posts: trending_posts,
       unread_messages: unread_messages,
       new_achievements: new_achievements
     }}
  end

  defp count_new_messages(user_id, since) do
    from(m in "messages",
      join: cm in "conversation_members",
      on: m.conversation_id == cm.conversation_id,
      where: cm.user_id == ^user_id,
      where: m.inserted_at >= ^since,
      select: count(m.id)
    )
    |> Repo.one()
    |> Kernel.||(0)
  end

  defp calculate_xp_earned(user_id, since) do
    from(xt in "xp_transactions",
      where: xt.user_id == ^user_id,
      where: xt.inserted_at >= ^since,
      select: coalesce(sum(xt.amount), 0)
    )
    |> Repo.one()
    |> Kernel.||(0)
  end

  defp count_new_achievements(user_id, since) do
    from(ua in "user_achievements",
      where: ua.user_id == ^user_id,
      where: ua.unlocked == true,
      where: ua.unlocked_at >= ^since,
      select: count(ua.id)
    )
    |> Repo.one()
    |> Kernel.||(0)
  end

  defp fetch_trending_posts(_user_id, since, opts) do
    limit = Keyword.get(opts, :limit, 5)

    # Query trending posts from forums the user is interested in
    # ✅ PERFORMANCE FIX: Join with forums table to avoid N+1 query
    from(p in "forum_posts",
      join: f in "forums",
      on: p.forum_id == f.id,
      where: p.inserted_at >= ^since,
      order_by: [desc: fragment("(upvotes - downvotes) + (? * 0.1)", p.view_count)],
      limit: ^limit,
      select: %{
        id: p.id,
        title: p.title,
        forum_slug: f.slug,
        replies: fragment("COALESCE(?, 0)", p.comment_count),
        views: p.view_count
      }
    )
    |> Repo.all()
  end

  defp fetch_unread_messages(user_id, opts) do
    limit = Keyword.get(opts, :limit, 10)

    from(m in "messages",
      join: cm in "conversation_members",
      on: m.conversation_id == cm.conversation_id,
      join: sender in User,
      on: m.sender_id == sender.id,
      where: cm.user_id == ^user_id,
      where: is_nil(cm.last_read_at) or m.inserted_at > cm.last_read_at,
      order_by: [desc: m.inserted_at],
      limit: ^limit,
      select: %{
        conversation_id: m.conversation_id,
        sender_name: sender.username,
        preview: fragment("LEFT(?, 100)", m.content),
        inserted_at: m.inserted_at
      }
    )
    |> Repo.all()
  end

  defp fetch_new_achievements(user_id, since, opts) do
    limit = Keyword.get(opts, :limit, 5)

    from(ua in "user_achievements",
      join: a in "achievements",
      on: ua.achievement_id == a.id,
      where: ua.user_id == ^user_id,
      where: ua.unlocked == true,
      where: ua.unlocked_at >= ^since,
      order_by: [desc: ua.unlocked_at],
      limit: ^limit,
      select: %{
        title: a.title,
        description: a.description,
        icon: a.icon,
        rarity: a.rarity,
        xp_reward: a.xp_reward,
        unlocked_at: ua.unlocked_at
      }
    )
    |> Repo.all()
  end

  defp send_digest_email(user, digest_data) do
    app_url = Application.get_env(:cgraph, :app_url, "https://cgraph.app")

    email_data = %{
      to: user.email,
      subject: "Your CGraph #{digest_data.period} Digest",
      template: "digest",
      assigns: Map.merge(digest_data, %{app_url: app_url, user_name: user.username})
    }

    case Mailer.send_email(email_data) do
      {:ok, _} -> :ok
      error -> error
    end
  end

  defp update_last_digest_sent(user) do
    user
    |> Ecto.Changeset.change(%{last_digest_sent_at: DateTime.utc_now()})
    |> Repo.update()
  end

  defp format_period_label("daily"), do: "Daily"
  defp format_period_label("weekly"), do: "Weekly"
  defp format_period_label("monthly"), do: "Monthly"
  defp format_period_label(_), do: "Weekly"
end
