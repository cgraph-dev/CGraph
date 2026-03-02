defmodule CGraph.Gamification.QuestTemplates do
  @moduledoc """
  Quest template definitions and selection logic.

  Provides pools of quest templates for daily, weekly, monthly, and special
  quest types. The QuestRotationWorker picks from these pools to generate
  fresh quest instances.

  ## Template Structure

  Each template defines:
  - `slug_prefix` — used to generate unique slugs for instances
  - `title` — display title (supports `%{count}` interpolation)
  - `description` — quest description
  - `objective_type` — the action type that progresses this quest
  - `difficulties` — list of `{target, xp_reward, coin_reward}` tuples

  The `pick_*` functions select random templates and difficulty levels
  for variety in generated quests.
  """

  @daily_templates [
    %{
      slug_prefix: "d_send_msgs",
      title: "Send %{count} messages",
      description: "Stay connected with your community",
      objective_type: "message_sent",
      difficulties: [{5, 50, 10}, {15, 100, 25}, {25, 150, 30}]
    },
    %{
      slug_prefix: "d_forum_reply",
      title: "Reply to %{count} threads",
      description: "Join the conversation in forums",
      objective_type: "forum_post",
      difficulties: [{3, 60, 15}, {5, 100, 25}]
    },
    %{
      slug_prefix: "d_create_thread",
      title: "Create a forum thread",
      description: "Start a new discussion",
      objective_type: "forum_thread",
      difficulties: [{1, 75, 20}]
    },
    %{
      slug_prefix: "d_add_friend",
      title: "Add a new friend",
      description: "Expand your social circle",
      objective_type: "friend_added",
      difficulties: [{1, 40, 10}, {2, 70, 18}]
    },
    %{
      slug_prefix: "d_earn_xp",
      title: "Earn %{count} XP",
      description: "Be active and earn experience",
      objective_type: "xp_earned",
      difficulties: [{100, 30, 10}, {250, 75, 25}, {500, 150, 40}]
    },
    %{
      slug_prefix: "d_upvote",
      title: "Upvote %{count} posts",
      description: "Support quality content",
      objective_type: "forum_upvote",
      difficulties: [{3, 30, 8}, {5, 50, 12}, {10, 80, 20}]
    },
    %{
      slug_prefix: "d_browse_forums",
      title: "View %{count} forum posts",
      description: "Explore what the community is discussing",
      objective_type: "forum_view",
      difficulties: [{3, 25, 5}, {5, 40, 10}, {10, 60, 15}]
    },
    %{
      slug_prefix: "d_react",
      title: "React to %{count} messages",
      description: "Show appreciation to others",
      objective_type: "reaction_added",
      difficulties: [{3, 25, 5}, {5, 40, 10}]
    },
    %{
      slug_prefix: "d_group_msg",
      title: "Send %{count} group messages",
      description: "Participate in group conversations",
      objective_type: "group_message_sent",
      difficulties: [{3, 40, 10}, {5, 60, 15}]
    },
    %{
      slug_prefix: "d_voice_join",
      title: "Join a voice channel",
      description: "Connect with others in voice",
      objective_type: "voice_joined",
      difficulties: [{1, 50, 12}]
    }
  ]

  @weekly_templates [
    %{
      slug_prefix: "w_send_msgs",
      title: "Send %{count} messages this week",
      description: "Keep the conversations flowing",
      objective_type: "message_sent",
      difficulties: [{50, 200, 40}, {100, 400, 80}, {200, 600, 120}]
    },
    %{
      slug_prefix: "w_create_threads",
      title: "Create %{count} threads this week",
      description: "Be a prolific content creator",
      objective_type: "forum_thread",
      difficulties: [{3, 250, 50}, {5, 400, 80}]
    },
    %{
      slug_prefix: "w_earn_xp",
      title: "Earn %{count} XP this week",
      description: "Stay active and productive",
      objective_type: "xp_earned",
      difficulties: [{500, 250, 50}, {1000, 500, 100}]
    },
    %{
      slug_prefix: "w_add_friends",
      title: "Add %{count} friends this week",
      description: "Grow your network",
      objective_type: "friend_added",
      difficulties: [{2, 150, 30}, {5, 300, 60}]
    },
    %{
      slug_prefix: "w_forum_replies",
      title: "Reply to %{count} threads this week",
      description: "Contribute to discussions across the forums",
      objective_type: "forum_post",
      difficulties: [{5, 200, 40}, {10, 350, 70}]
    },
    %{
      slug_prefix: "w_upvotes",
      title: "Upvote %{count} posts this week",
      description: "Recognize great content",
      objective_type: "forum_upvote",
      difficulties: [{10, 150, 30}, {20, 250, 50}]
    },
    %{
      slug_prefix: "w_streak",
      title: "Log in %{count} days this week",
      description: "Build your login streak",
      objective_type: "login_streak",
      difficulties: [{3, 200, 50}, {5, 350, 75}]
    },
    %{
      slug_prefix: "w_voice",
      title: "Join voice %{count} times this week",
      description: "Spend time in voice channels",
      objective_type: "voice_joined",
      difficulties: [{3, 200, 40}, {5, 350, 70}]
    },
    %{
      slug_prefix: "w_reactions",
      title: "Add %{count} reactions this week",
      description: "Engage with your community",
      objective_type: "reaction_added",
      difficulties: [{15, 150, 30}, {30, 250, 50}]
    },
    %{
      slug_prefix: "w_receive_upvotes",
      title: "Receive %{count} upvotes this week",
      description: "Create content others appreciate",
      objective_type: "forum_upvote_received",
      difficulties: [{5, 250, 50}, {10, 400, 80}]
    }
  ]

  @monthly_templates [
    %{
      slug_prefix: "m_xp",
      title: "Earn %{count} XP this month",
      description: "A month of consistent activity",
      objective_type: "xp_earned",
      difficulties: [{2000, 600, 150}, {5000, 1000, 250}]
    },
    %{
      slug_prefix: "m_threads",
      title: "Create %{count} threads this month",
      description: "Be a content powerhouse",
      objective_type: "forum_thread",
      difficulties: [{10, 500, 100}, {20, 800, 200}]
    },
    %{
      slug_prefix: "m_friends",
      title: "Add %{count} friends this month",
      description: "Become a networking champion",
      objective_type: "friend_added",
      difficulties: [{5, 400, 80}, {10, 700, 150}]
    }
  ]

  # ── Public API ────────────────────────────────────────────────────────

  @doc "Returns all daily quest templates."
  @spec daily_templates() :: [map()]
  def daily_templates, do: @daily_templates

  @doc "Returns all weekly quest templates."
  @spec weekly_templates() :: [map()]
  def weekly_templates, do: @weekly_templates

  @doc "Returns all monthly quest templates."
  @spec monthly_templates() :: [map()]
  def monthly_templates, do: @monthly_templates

  @doc """
  Pick N random daily templates, each with a random difficulty.

  Returns a list of expanded quest maps ready for insertion.
  """
  @spec pick_daily(pos_integer()) :: [map()]
  def pick_daily(count \\ 3) do
    pick_random(@daily_templates, count)
  end

  @doc """
  Pick N random weekly templates, each with a random difficulty.
  """
  @spec pick_weekly(pos_integer()) :: [map()]
  def pick_weekly(count \\ 3) do
    pick_random(@weekly_templates, count)
  end

  @doc """
  Pick N random monthly templates, each with a random difficulty.
  """
  @spec pick_monthly(pos_integer()) :: [map()]
  def pick_monthly(count \\ 2) do
    pick_random(@monthly_templates, count)
  end

  # ── Private Helpers ───────────────────────────────────────────────────

  defp pick_random(templates, count) do
    templates
    |> Enum.shuffle()
    |> Enum.take(count)
    |> Enum.map(&expand_template/1)
  end

  defp expand_template(template) do
    {target, xp_reward, coin_reward} = Enum.random(template.difficulties)

    title = String.replace(template.title, "%{count}", to_string(target))
    description = String.replace(template.description, "%{count}", to_string(target))

    slug = "#{template.slug_prefix}_#{target}_#{:rand.uniform(9999)}"

    %{
      slug: slug,
      title: title,
      description: description,
      objective_type: template.objective_type,
      target: target,
      xp_reward: xp_reward,
      coin_reward: coin_reward
    }
  end
end
