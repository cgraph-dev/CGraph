defmodule CgraphWeb.UserFixtures do
  @moduledoc """
  Test fixtures for users and related data.
  """

  alias Cgraph.Accounts

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

  alias Cgraph.Messaging
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
    {:ok, msg_user} = Cgraph.Accounts.get_user(user.id)
    
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

  alias Cgraph.Groups
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
end

defmodule CgraphWeb.ForumFixtures do
  @moduledoc """
  Test fixtures for forums.
  
  Note: Forum names must be 3-21 characters, alphanumeric + underscores only.
  """

  alias Cgraph.Forums
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
end
