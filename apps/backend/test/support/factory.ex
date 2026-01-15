defmodule CGraph.Factory do
  @moduledoc """
  ExMachina factory for generating test data.

  Provides a consistent way to generate test data using the Factory Pattern.
  Use `build/2` for unsaved records and `insert/2` for saved records.

  ## Examples

      # Build an unsaved user
      user = build(:user)

      # Build with custom attributes
      user = build(:user, email: "custom@example.com")

      # Insert into database
      user = insert(:user)

      # Build a list
      users = build_list(5, :user)

      # Build with associations
      message = insert(:message, sender: insert(:user))
  """

  use ExMachina.Ecto, repo: CGraph.Repo

  alias CGraph.Accounts.{User, UsernameChange}
  alias CGraph.Messaging.{Conversation, Message, Reaction}
  alias CGraph.Groups.{Group, Member}
  alias CGraph.Forums.{Forum, Board, Thread, Post, Subscription}
  alias CGraph.Gamification.{Achievement, UserAchievement, Quest, UserQuest}

  # ============================================================================
  # User Factories
  # ============================================================================

  def user_factory do
    %User{
      email: sequence(:email, &"user#{&1}@example.com"),
      username: sequence(:username, &"user_#{&1}"),
      password_hash: Argon2.hash_pwd_salt("ValidPassword123!"),
      display_name: sequence(:display_name, &"Test User #{&1}"),
      bio: "This is a test user bio",
      avatar_url: nil,
      is_admin: false,
      is_verified: false,
      is_premium: false,
      xp: 0,
      level: 1,
      coins: 0,
      streak_days: 0,
      last_active_at: DateTime.utc_now(),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def admin_factory do
    build(:user, is_admin: true)
  end

  def premium_user_factory do
    build(:user,
      is_premium: true,
      coins: 1000
    )
  end

  def premium_plus_user_factory do
    build(:user,
      is_premium: true,
      coins: 5000
    )
  end

  def verified_user_factory do
    build(:user, is_verified: true)
  end

  def high_level_user_factory do
    build(:user,
      level: 50,
      xp: 125000,
      streak_days: 30
    )
  end

  def username_change_factory do
    user = build(:user)

    %UsernameChange{
      user: user,
      old_username: user.username,
      new_username: sequence(:new_username, &"new_username_#{&1}"),
      reason: nil,
      changed_by_admin: false
    }
  end

  # ============================================================================
  # Messaging Factories
  # ============================================================================

  def conversation_factory do
    user1 = build(:user)
    user2 = build(:user)
    %Conversation{
      user_one: user1,
      user_two: user2,
      is_encrypted: true,
      last_message_at: DateTime.utc_now(),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def group_conversation_factory do
    user1 = build(:user)
    user2 = build(:user)
    %Conversation{
      user_one: user1,
      user_two: user2,
      is_encrypted: true,
      last_message_at: DateTime.utc_now()
    }
  end

  def message_factory do
    %Message{
      content: sequence(:content, &"Test message content #{&1}"),
      content_type: "text",
      is_encrypted: false,
      is_edited: false,
      is_pinned: false,
      sender: build(:user),
      conversation: build(:conversation),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def encrypted_message_factory do
    build(:message,
      is_encrypted: true,
      content: Base.encode64(:crypto.strong_rand_bytes(64))
    )
  end

  def voice_message_factory do
    build(:message,
      content_type: "voice"
    )
  end

  def reaction_factory do
    %Reaction{
      emoji: Enum.random(["👍", "❤️", "😂", "🎉", "🔥", "👀"]),
      user: build(:user),
      message: build(:message)
    }
  end

  # ============================================================================
  # Group Factories
  # ============================================================================

  def group_factory do
    %Group{
      name: sequence(:group_name, &"Test Group #{&1}"),
      description: "A test group for unit testing",
      slug: sequence(:group_slug, &"test-group-#{&1}"),
      icon_url: nil,
      banner_url: nil,
      is_public: true,
      is_discoverable: true,
      member_count: 1,
      owner: build(:user),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def private_group_factory do
    build(:group, is_public: false)
  end

  def verified_group_factory do
    build(:group, is_discoverable: true)
  end

  def member_factory do
    %Member{
      nickname: nil,
      is_muted: false,
      is_banned: false,
      user: build(:user),
      group: build(:group),
      joined_at: DateTime.utc_now()
    }
  end

  def admin_member_factory do
    build(:member)
  end

  def moderator_member_factory do
    build(:member)
  end

  # ============================================================================
  # Forum Factories
  # ============================================================================

  def forum_factory do
    %Forum{
      name: sequence(:forum_name, &"Test Forum #{&1}"),
      description: "A test forum for unit testing",
      slug: sequence(:forum_slug, &"test-forum-#{&1}"),
      icon_url: nil,
      is_public: true,
      post_count: 0,
      thread_count: 0,
      owner: build(:user),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def private_forum_factory do
    build(:forum, is_public: false)
  end

  def board_factory do
    %Board{
      name: sequence(:board_name, &"Test Board #{&1}"),
      description: "A test board for unit testing",
      slug: sequence(:board_slug, &"test-board-#{&1}"),
      position: sequence(:board_position, & &1),
      is_locked: false,
      thread_count: 0,
      post_count: 0,
      forum: build(:forum),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def locked_board_factory do
    build(:board, is_locked: true)
  end

  def thread_factory do
    %Thread{
      title: sequence(:thread_title, &"Test Thread #{&1}"),
      content: "This is the content of a test thread for unit testing purposes.",
      slug: sequence(:thread_slug, &"test-thread-#{&1}"),
      is_pinned: false,
      is_locked: false,
      thread_type: "normal",
      view_count: 0,
      reply_count: 0,
      score: 0,
      author: build(:user),
      board: build(:board),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def pinned_thread_factory do
    build(:thread, is_pinned: true)
  end

  def locked_thread_factory do
    build(:thread, is_locked: true)
  end

  def announcement_thread_factory do
    build(:thread, thread_type: "announcement", is_pinned: true)
  end

  def popular_thread_factory do
    build(:thread,
      view_count: Enum.random(1000..10_000),
      reply_count: Enum.random(50..500),
      score: Enum.random(100..1000)
    )
  end

  def post_factory do
    %Post{
      content: sequence(:post_content, &"This is test post content #{&1}"),
      is_edited: false,
      score: 0,
      author: build(:user),
      forum: build(:forum),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def reply_post_factory(attrs \\ %{}) do
    parent = Map.get(attrs, :parent) || insert(:post)

    build(:post,
      forum: parent.forum
    )
  end

  def subscription_factory do
    %Subscription{
      notification_level: "all",
      user: build(:user),
      forum: build(:forum)
    }
  end

  def board_subscription_factory do
    build(:subscription)
  end

  def forum_subscription_factory do
    build(:subscription)
  end

  # ============================================================================
  # Gamification Factories
  # ============================================================================

  def achievement_factory do
    %Achievement{
      title: sequence(:achievement_name, &"Test Achievement #{&1}"),
      slug: sequence(:achievement_slug, &"test-achievement-#{&1}"),
      description: "Complete a test action to unlock this achievement",
      icon: "🏆",
      category: Enum.random(["messaging", "forums", "social", "special"]),
      xp_reward: Enum.random([50, 100, 250, 500]),
      coin_reward: Enum.random([0, 10, 25, 50]),
      rarity: Enum.random(["common", "uncommon", "rare", "epic", "legendary"]),
      is_hidden: false,
      max_progress: Enum.random([1, 5, 10, 25, 50]),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def hidden_achievement_factory do
    build(:achievement, is_hidden: true)
  end

  def legendary_achievement_factory do
    build(:achievement,
      rarity: "legendary",
      xp_reward: 1000,
      coin_reward: 100
    )
  end

  def user_achievement_factory do
    %UserAchievement{
      user: build(:user),
      achievement: build(:achievement),
      unlocked_at: DateTime.utc_now(),
      unlocked: true,
      progress: 100
    }
  end

  def featured_achievement_factory do
    build(:user_achievement)
  end

  def quest_factory do
    %Quest{
      title: sequence(:quest_title, &"Daily Quest #{&1}"),
      slug: sequence(:quest_slug, &"daily-quest-#{&1}"),
      description: "Complete this quest to earn rewards",
      type: Enum.random(["daily", "weekly", "special"]),
      xp_reward: Enum.random([25, 50, 100, 250]),
      coin_reward: Enum.random([5, 10, 25]),
      is_active: true,
      starts_at: DateTime.utc_now() |> DateTime.add(-1, :hour),
      ends_at: DateTime.utc_now() |> DateTime.add(23, :hour),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def weekly_quest_factory do
    build(:quest,
      type: "weekly",
      xp_reward: Enum.random([250, 500, 1000]),
      ends_at: DateTime.utc_now() |> DateTime.add(7, :day)
    )
  end

  def user_quest_factory do
    %UserQuest{
      user: build(:user),
      quest: build(:quest),
      progress: %{},
      completed: false,
      claimed: false
    }
  end

  def completed_quest_factory do
    quest = build(:quest)

    build(:user_quest,
      quest: quest,
      progress: %{},
      completed: true,
      claimed: false,
      completed_at: DateTime.utc_now()
    )
  end

  # ============================================================================
  # Helper Functions
  # ============================================================================

  @doc """
  Create a user with a specific level and XP.
  """
  def user_with_level(level) do
    xp = calculate_xp_for_level(level)
    build(:user, level: level, xp: xp)
  end

  defp calculate_xp_for_level(level) do
    # XP formula: level^2 * 100
    level * level * 100
  end

  @doc """
  Create a conversation with participants already inserted.
  """
  def conversation_with_participants(participant_count \\ 2) do
    participants = insert_list(participant_count, :user)
    conversation = insert(:conversation)

    # Associate participants (implementation depends on your schema)
    # This is a placeholder - adjust based on actual associations
    {conversation, participants}
  end

  @doc """
  Create a thread with a specific number of posts.
  """
  def thread_with_posts(post_count \\ 5) do
    thread = insert(:thread)
    posts = insert_list(post_count, :post, forum: thread.board.forum)

    %{thread: thread, posts: posts}
  end

  @doc """
  Create a user with achievements unlocked.
  """
  def user_with_achievements(achievement_count \\ 3) do
    user = insert(:user)
    achievements = insert_list(achievement_count, :achievement)

    user_achievements = Enum.map(achievements, fn achievement ->
      insert(:user_achievement, user: user, achievement: achievement)
    end)

    %{user: user, achievements: achievements, user_achievements: user_achievements}
  end
end
