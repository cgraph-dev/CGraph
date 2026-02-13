defmodule CgraphWeb.UserFixtures do
  @moduledoc """
  Test fixtures for users and related data.
  """

  alias CGraph.Accounts

  @doc """
  Generate a unique user email.
  """
  def unique_user_email, do: "user#{System.unique_integer()}@example.com"

  @doc """
  Generate a unique username.
  """
  def unique_username, do: "user_#{abs(System.unique_integer())}"

  @doc """
  Generate a user fixture.
  """
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        email: unique_user_email(),
        username: unique_username(),
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!",
        display_name: "Test User"
      })
      |> Accounts.create_user()

    user
  end

  @doc """
  Generate an admin user fixture.
  """
  def admin_user_fixture(attrs \\ %{}) do
    user = user_fixture(attrs)
    {:ok, admin} = Accounts.update_user(user, %{is_admin: true})
    admin
  end

  @doc """
  Generate a user settings fixture.
  """
  def user_settings_fixture(user, attrs \\ %{}) do
    {:ok, settings} =
      attrs
      |> Enum.into(%{
        theme: "dark",
        language: "en",
        notifications_enabled: true
      })
      |> then(&Accounts.update_settings(user, &1))

    settings
  end
end

defmodule CgraphWeb.MessagingFixtures do
  @moduledoc """
  Test fixtures for messaging.
  """

  alias CGraph.Messaging
  alias CgraphWeb.UserFixtures

  @doc """
  Create a conversation between two users.
  """
  def conversation_fixture(user1 \\ nil, user2 \\ nil) do
    user1 = user1 || UserFixtures.user_fixture()
    user2 = user2 || UserFixtures.user_fixture()

    {:ok, conversation} = Messaging.create_conversation(user1, %{"participant_ids" => [user2.id]})
    %{conversation: conversation, user1: user1, user2: user2}
  end

  @doc """
  Create a message in a conversation.
  """
  def message_fixture(conversation, user, attrs \\ %{}) do
    # Ensure the user exists in the database by re-fetching
    {:ok, msg_user} = CGraph.Accounts.get_user(user.id)

    {:ok, message} =
      attrs
      |> Enum.into(%{content: "Test message #{System.unique_integer()}"})
      |> then(&Messaging.create_message(msg_user, conversation, &1))

    message
  end
end

defmodule CgraphWeb.GroupFixtures do
  @moduledoc """
  Test fixtures for groups.
  """

  alias CGraph.Groups
  alias CgraphWeb.UserFixtures

  @doc """
  Create a group fixture.
  """
  def group_fixture(owner \\ nil, attrs \\ %{}) do
    owner = owner || UserFixtures.user_fixture()

    {:ok, group} =
      attrs
      |> Enum.into(%{
        name: "Test Group #{System.unique_integer()}",
        description: "A test group"
      })
      |> then(&Groups.create_group(owner, &1))

    %{group: group, owner: owner}
  end

  @doc """
  Create a group with members already added.
  Returns the group struct.
  """
  def group_with_members_fixture(owner, members) do
    %{group: group} = group_fixture(owner)
    Enum.each(members, fn user -> Groups.add_member(group, user) end)
    group
  end

  @doc """
  Create a channel in a group.
  """
  def channel_fixture(group, attrs \\ %{}) do
    {:ok, channel} =
      attrs
      |> Enum.into(%{
        name: "test-channel-#{System.unique_integer()}",
        type: "text"
      })
      |> then(&Groups.create_channel(group, &1))

    channel
  end

  @doc """
  Create a member in a group.
  """
  def member_fixture(group, user \\ nil) do
    user = user || UserFixtures.user_fixture()
    {:ok, member} = Groups.add_member(group, user)
    %{member: member, user: user}
  end

  @doc """
  Create a role in a group.
  """
  def role_fixture(group, attrs \\ %{}) do
    {:ok, role} =
      attrs
      |> Enum.into(%{
        name: "Test Role #{System.unique_integer()}",
        color: "#FF5733",
        position: 1
      })
      |> then(&Groups.create_role(group, &1))

    role
  end

  @doc """
  Create an invite for a group.
  """
  def invite_fixture(group, user, opts \\ []) do
    {:ok, invite} = Groups.create_invite(group, user, opts)
    invite
  end
end

defmodule CgraphWeb.ForumFixtures do
  @moduledoc """
  Test fixtures for forums.

  Note: Forum names must be 3-21 characters, alphanumeric + underscores only.
  """

  alias CGraph.Forums
  alias CgraphWeb.UserFixtures

  @doc """
  Generate a unique forum name (valid format: alphanumeric + underscores, 3-21 chars).
  """
  def unique_forum_name do
    # Use positive integer and truncate to ensure valid length
    id = abs(System.unique_integer([:positive]))
    "forum_#{rem(id, 999_999)}"
  end

  @doc """
  Generate a unique forum slug.
  """
  def unique_forum_slug do
    id = abs(System.unique_integer([:positive]))
    "forum-#{rem(id, 999_999)}"
  end

  @doc """
  Create a forum fixture.

  ## Examples

      # Create with default attributes
      forum_fixture()

      # Create with specific user
      forum_fixture(user)

      # Create with specific attributes
      forum_fixture(user, %{name: "my_forum"})
  """
  def forum_fixture(user \\ nil, attrs \\ %{}) do
    user = user || UserFixtures.user_fixture()

    {:ok, forum} =
      attrs
      |> Enum.into(%{
        name: unique_forum_name(),
        slug: unique_forum_slug(),
        description: "A test forum"
      })
      |> then(&Forums.create_forum(user, &1))

    forum
  end

  @doc """
  Create a post in a forum.
  """
  def post_fixture(forum, user \\ nil, attrs \\ %{}) do
    user = user || UserFixtures.user_fixture()

    {:ok, post} =
      attrs
      |> Enum.into(%{
        title: "Test Post #{System.unique_integer()}",
        content: "This is test post content."
      })
      |> then(&Forums.create_post(forum, user, &1))

    %{post: post, user: user}
  end

  @doc """
  Create a comment on a post.
  """
  def comment_fixture(post, user \\ nil, attrs \\ %{}) do
    user = user || UserFixtures.user_fixture()

    {:ok, comment} =
      attrs
      |> Enum.into(%{content: "Test comment #{System.unique_integer()}"})
      |> then(&Forums.create_comment(post, user, &1))

    %{comment: comment, user: user}
  end

  @doc """
  Create a board within a forum.
  """
  def board_fixture(forum, attrs \\ %{}) do
    id = abs(System.unique_integer([:positive]))

    {:ok, board} =
      attrs
      |> Enum.into(%{
        name: "Board #{id}",
        slug: "board-#{id}",
        description: "A test board",
        forum_id: forum.id
      })
      |> Forums.create_board()

    board
  end

  @doc """
  Create a thread within a board.
  """
  def thread_fixture(board, user \\ nil, attrs \\ %{}) do
    user = user || UserFixtures.user_fixture()

    {:ok, thread} =
      attrs
      |> Enum.into(%{
        title: "Thread #{System.unique_integer()}",
        content: "Test thread content",
        board_id: board.id,
        author_id: user.id
      })
      |> Forums.create_thread()

    thread
  end
end

defmodule CgraphWeb.ModerationFixtures do
  @moduledoc """
  Test fixtures for the moderation system.
  """

  import Ecto.Query

  alias CGraph.Moderation
  alias CgraphWeb.UserFixtures

  @doc """
  Create a report fixture.

  Returns `{report, target}` tuple with the created report and target user.
  """
  def report_fixture(reporter \\ nil, attrs \\ %{}) do
    reporter = reporter || UserFixtures.user_fixture()
    target = UserFixtures.user_fixture()

    {:ok, report} =
      attrs
      |> Enum.into(%{
        target_type: :user,
        target_id: target.id,
        category: :harassment,
        description: "Test report description #{System.unique_integer()}"
      })
      |> then(&Moderation.create_report(reporter, &1))

    {report, target}
  end

  @doc """
  Create a message report fixture.
  """
  def message_report_fixture(reporter \\ nil, attrs \\ %{}) do
    reporter = reporter || UserFixtures.user_fixture()
    message_id = Ecto.UUID.generate()

    {:ok, report} =
      attrs
      |> Enum.into(%{
        target_type: :message,
        target_id: message_id,
        category: :spam,
        description: "Spam message report"
      })
      |> then(&Moderation.create_report(reporter, &1))

    report
  end

  @doc """
  Create a reviewed report with an action.
  """
  def reviewed_report_fixture(reporter \\ nil, admin \\ nil, action \\ :dismiss) do
    reporter = reporter || UserFixtures.user_fixture()
    admin = admin || UserFixtures.admin_user_fixture()
    {report, target} = report_fixture(reporter)

    {:ok, reviewed_report} = Moderation.review_report(admin, report.id, %{
      action: action,
      notes: "Test review notes",
      duration_hours: if(action == :suspend, do: 24, else: nil)
    })

    {reviewed_report, target, admin}
  end

  @doc """
  Create a user restriction fixture.
  """
  def user_restriction_fixture(user \\ nil, type \\ :suspended, duration_hours \\ 24) do
    user = user || UserFixtures.user_fixture()

    {:ok, restriction} = Moderation.create_user_restriction(
      user.id,
      type,
      if(type == :banned, do: nil, else: duration_hours)
    )

    {restriction, user}
  end

  @doc """
  Create an appeal fixture.
  """
  def appeal_fixture(reporter \\ nil, admin \\ nil) do
    {_report, target, admin} = reviewed_report_fixture(reporter, admin, :suspend)

    action = CGraph.Repo.one!(
      from(ra in CGraph.Moderation.ReviewAction,
        order_by: [desc: ra.inserted_at],
        limit: 1
      )
    )

    {:ok, appeal} = Moderation.create_appeal(target, action.id, %{
      reason: "I did not violate any rules. This is a misunderstanding that I would like to clarify."
    })

    {appeal, target, action, admin}
  end
end
