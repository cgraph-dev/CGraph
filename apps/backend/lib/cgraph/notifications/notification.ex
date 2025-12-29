defmodule Cgraph.Notifications.Notification do
  @moduledoc """
  Schema for user notifications.
  
  Supports various notification types:
  - Message notifications (new message, message mention)
  - Social notifications (friend request, friend accepted)
  - Group notifications (invite, role change, kicked)
  - Forum notifications (reply, mention, vote)
  - System notifications (welcome, security alert)
  """
  use Ecto.Schema
  import Ecto.Changeset
  
  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  
  schema "notifications" do
    belongs_to :user, Cgraph.Accounts.User
    belongs_to :actor, Cgraph.Accounts.User  # User who triggered the notification
    
    field :type, Ecto.Enum, values: [
      # Messages
      :new_message,
      :message_mention,
      :message_reaction,
      
      # Social
      :friend_request,
      :friend_accepted,
      
      # Groups
      :group_invite,
      :group_join,
      :group_role_change,
      :group_kicked,
      :group_banned,
      :channel_mention,
      
      # Forums
      :post_reply,
      :comment_reply,
      :post_mention,
      :post_vote,
      :comment_vote,
      
      # System
      :welcome,
      :security_alert,
      :account_update,
      :system_announcement
    ]
    
    field :title, :string
    field :body, :string
    field :data, :map, default: %{}  # Additional context (IDs, URLs, etc.)
    field :read_at, :utc_datetime
    field :clicked_at, :utc_datetime
    field :push_sent, :boolean, default: false
    field :email_sent, :boolean, default: false
    
    # For grouping related notifications (e.g., "5 new messages in #general")
    field :group_key, :string
    field :count, :integer, default: 1
    
    timestamps()
  end
  
  @required_fields [:user_id, :type, :title]
  @optional_fields [:actor_id, :body, :data, :read_at, :clicked_at, 
                    :push_sent, :email_sent, :group_key, :count]
  
  def changeset(notification, attrs) do
    notification
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:title, max: 255)
    |> validate_length(:body, max: 1000)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:actor_id)
  end
  
  @doc """
  Marks a notification as read.
  """
  def mark_read_changeset(notification) do
    changeset(notification, %{read_at: DateTime.utc_now()})
  end
  
  @doc """
  Marks a notification as clicked (opened).
  """
  def mark_clicked_changeset(notification) do
    changeset(notification, %{clicked_at: DateTime.utc_now()})
  end
end
