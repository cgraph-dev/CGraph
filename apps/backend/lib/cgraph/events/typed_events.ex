defmodule CGraph.Events.TypedEvents do
  @moduledoc """
  Typed event definitions with Dialyzer-friendly structs.

  Instead of raw `%{type: :user_registered, payload: %{...}}` maps,
  each domain event gets a struct with explicit fields, enabling
  compile-time checks and editor autocompletion.

  ## Usage

      alias CGraph.Events.TypedEvents.UserRegistered

      event = UserRegistered.new(user_id: user.id, email: user.email)
      CGraph.Events.publish(:user_registered, event)

  ## Pattern matching in handlers

      def handle_event(%{type: :user_registered, payload: %UserRegistered{} = e}) do
        send_welcome_email(e.email)
      end
  """

  # ==================== ACCOUNTS ====================

  defmodule UserRegistered do
    @moduledoc false
    @type t :: %__MODULE__{user_id: String.t(), email: String.t(), username: String.t(), provider: String.t()}
    @enforce_keys [:user_id, :email]
    defstruct [:user_id, :email, :username, provider: "email"]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule UserDeactivated do
    @moduledoc false
    @type t :: %__MODULE__{user_id: String.t(), reason: String.t() | nil}
    @enforce_keys [:user_id]
    defstruct [:user_id, :reason]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule FriendRequestSent do
    @moduledoc false
    @type t :: %__MODULE__{from_user_id: String.t(), to_user_id: String.t()}
    @enforce_keys [:from_user_id, :to_user_id]
    defstruct [:from_user_id, :to_user_id]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule FriendRequestAccepted do
    @moduledoc false
    @type t :: %__MODULE__{user_id: String.t(), friend_id: String.t()}
    @enforce_keys [:user_id, :friend_id]
    defstruct [:user_id, :friend_id]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  # ==================== MESSAGING ====================

  defmodule MessageSent do
    @moduledoc false
    @type t :: %__MODULE__{
      message_id: String.t(),
      conversation_id: String.t(),
      sender_id: String.t(),
      is_encrypted: boolean()
    }
    @enforce_keys [:message_id, :conversation_id, :sender_id]
    defstruct [:message_id, :conversation_id, :sender_id, is_encrypted: true]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule MessageDeleted do
    @moduledoc false
    @type t :: %__MODULE__{message_id: String.t(), conversation_id: String.t(), deleted_by: String.t()}
    @enforce_keys [:message_id, :conversation_id, :deleted_by]
    defstruct [:message_id, :conversation_id, :deleted_by]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule ReactionAdded do
    @moduledoc false
    @type t :: %__MODULE__{message_id: String.t(), user_id: String.t(), emoji: String.t()}
    @enforce_keys [:message_id, :user_id, :emoji]
    defstruct [:message_id, :user_id, :emoji]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  # ==================== GAMIFICATION ====================

  defmodule XpAwarded do
    @moduledoc false
    @type t :: %__MODULE__{
      user_id: String.t(),
      amount: non_neg_integer(),
      source: String.t(),
      level_up: boolean(),
      new_level: non_neg_integer() | nil
    }
    @enforce_keys [:user_id, :amount, :source]
    defstruct [:user_id, :amount, :source, :new_level, level_up: false]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule AchievementUnlocked do
    @moduledoc false
    @type t :: %__MODULE__{user_id: String.t(), achievement_id: String.t(), achievement_slug: String.t()}
    @enforce_keys [:user_id, :achievement_id]
    defstruct [:user_id, :achievement_id, :achievement_slug]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule QuestCompleted do
    @moduledoc false
    @type t :: %__MODULE__{user_id: String.t(), quest_id: String.t(), xp_reward: non_neg_integer(), coin_reward: non_neg_integer()}
    @enforce_keys [:user_id, :quest_id]
    defstruct [:user_id, :quest_id, xp_reward: 0, coin_reward: 0]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  # ==================== FORUMS ====================

  defmodule PostCreated do
    @moduledoc false
    @type t :: %__MODULE__{post_id: String.t(), forum_id: String.t(), author_id: String.t(), thread_id: String.t() | nil}
    @enforce_keys [:post_id, :forum_id, :author_id]
    defstruct [:post_id, :forum_id, :author_id, :thread_id]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule PostVoted do
    @moduledoc false
    @type t :: %__MODULE__{post_id: String.t(), voter_id: String.t(), direction: :up | :down}
    @enforce_keys [:post_id, :voter_id, :direction]
    defstruct [:post_id, :voter_id, :direction]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  # ==================== MODERATION ====================

  defmodule ContentReported do
    @moduledoc false
    @type t :: %__MODULE__{
      content_type: String.t(),
      content_id: String.t(),
      reporter_id: String.t(),
      reason: String.t()
    }
    @enforce_keys [:content_type, :content_id, :reporter_id, :reason]
    defstruct [:content_type, :content_id, :reporter_id, :reason]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  defmodule UserBanned do
    @moduledoc false
    @type t :: %__MODULE__{user_id: String.t(), banned_by: String.t(), reason: String.t(), duration: integer() | nil}
    @enforce_keys [:user_id, :banned_by, :reason]
    defstruct [:user_id, :banned_by, :reason, :duration]

    @spec new(keyword()) :: t()
    def new(fields), do: struct!(__MODULE__, fields)
  end

  # ==================== HELPERS ====================

  @doc "All registered event type atoms for validation."
  @spec event_types() :: [atom()]
  def event_types do
    [
      :user_registered, :user_deactivated,
      :friend_request_sent, :friend_request_accepted,
      :message_sent, :message_deleted, :reaction_added,
      :xp_awarded, :achievement_unlocked, :quest_completed,
      :post_created, :post_voted,
      :content_reported, :user_banned
    ]
  end

  @doc "Validate an event type is known."
  @spec valid_event_type?(atom()) :: boolean()
  def valid_event_type?(type), do: type in event_types()
end
