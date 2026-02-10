defmodule CGraph.Forums.DigestWorker do
  @moduledoc """
  Worker for processing subscription digest emails.
  Runs on a schedule to send daily and weekly digest emails.
  """

  use GenServer
  require Logger

  alias CGraph.Repo
  alias CGraph.Forums.Subscription
  alias CGraph.Mailer
  import Ecto.Query

  @daily_hour 8   # 8 AM UTC
  @weekly_day 1   # Monday

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @impl true
  def init(state) do
    schedule_next_check()
    {:ok, state}
  end

  @impl true
  def handle_info(:check_digests, state) do
    now = DateTime.utc_now()

    # Check if it's time for daily digest (8 AM UTC)
    if now.hour == @daily_hour do
      process_daily_digests()
    end

    # Check if it's time for weekly digest (Monday 8 AM UTC)
    if now.hour == @daily_hour and Date.day_of_week(DateTime.to_date(now)) == @weekly_day do
      process_weekly_digests()
    end

    schedule_next_check()
    {:noreply, state}
  end

  # Schedule check every hour
  defp schedule_next_check do
    Process.send_after(self(), :check_digests, :timer.hours(1))
  end

  @doc """
  Process daily digest subscriptions.
  """
  def process_daily_digests do
    Logger.info("Processing daily digest subscriptions...")

    subscriptions =
      from(s in Subscription,
        where: s.notification_mode == "daily",
        where: s.email_notifications == true,
        where: s.unread_count > 0,
        preload: [:user, :forum, :board, :thread]
      )
      |> Repo.all()

    subscriptions
    |> Enum.group_by(& &1.user_id)
    |> Enum.each(fn {user_id, user_subscriptions} ->
      send_digest_email(user_id, user_subscriptions, :daily)
    end)

    # Reset unread counts
    subscription_ids = Enum.map(subscriptions, & &1.id)
    from(s in Subscription, where: s.id in ^subscription_ids)
    |> Repo.update_all(set: [unread_count: 0, last_notified_at: DateTime.utc_now()])

    Logger.info("processed_daily_digest_subscriptions", subscriptions_count: inspect(length(subscriptions)))
  end

  @doc """
  Process weekly digest subscriptions.
  """
  def process_weekly_digests do
    Logger.info("Processing weekly digest subscriptions...")

    subscriptions =
      from(s in Subscription,
        where: s.notification_mode == "weekly",
        where: s.email_notifications == true,
        where: s.unread_count > 0,
        preload: [:user, :forum, :board, :thread]
      )
      |> Repo.all()

    subscriptions
    |> Enum.group_by(& &1.user_id)
    |> Enum.each(fn {user_id, user_subscriptions} ->
      send_digest_email(user_id, user_subscriptions, :weekly)
    end)

    # Reset unread counts
    subscription_ids = Enum.map(subscriptions, & &1.id)
    from(s in Subscription, where: s.id in ^subscription_ids)
    |> Repo.update_all(set: [unread_count: 0, last_notified_at: DateTime.utc_now()])

    Logger.info("processed_weekly_digest_subscriptions", subscriptions_count: inspect(length(subscriptions)))
  end

  defp send_digest_email(user_id, subscriptions, frequency) do
    user = Repo.get(CGraph.Accounts.User, user_id)

    if user && user.email do
      # Build digest content
      digest_items =
        subscriptions
        |> Enum.map(fn sub ->
          target_name = get_target_name(sub)
          target_type = get_target_type(sub)

          %{
            type: target_type,
            name: target_name,
            unread_count: sub.unread_count
          }
        end)

      total_unread = Enum.sum(Enum.map(digest_items, & &1.unread_count))

      # Send email using Mailer
      email_data = %{
        to: user.email,
        subject: build_subject(frequency, total_unread),
        template: "forum_digest",
        assigns: %{
          user_name: user.display_name || user.username,
          frequency: frequency,
          digest_items: digest_items,
          total_unread: total_unread
        }
      }

      case Mailer.send_email(email_data) do
        {:ok, _} ->
          Logger.debug("sent_digest_to_user", frequency: frequency, user_id: user_id)
        {:error, reason} ->
          Logger.error("failed_to_send_digest_to_user", user_id: user_id, reason: inspect(reason))
      end
    end
  end

  defp get_target_name(subscription) do
    cond do
      subscription.thread -> subscription.thread.title
      subscription.board -> subscription.board.name
      subscription.forum -> subscription.forum.name
      true -> "Unknown"
    end
  end

  defp get_target_type(subscription) do
    cond do
      subscription.thread_id -> :thread
      subscription.board_id -> :board
      subscription.forum_id -> :forum
      true -> :unknown
    end
  end

  defp build_subject(:daily, count) do
    "[CGraph] Your daily digest: #{count} new #{pluralize(count, "update")}"
  end

  defp build_subject(:weekly, count) do
    "[CGraph] Your weekly digest: #{count} new #{pluralize(count, "update")}"
  end

  defp pluralize(1, word), do: word
  defp pluralize(_, word), do: "#{word}s"

  @doc """
  Manually trigger digest processing (for testing).
  """
  def trigger_daily, do: process_daily_digests()
  def trigger_weekly, do: process_weekly_digests()
end
