defmodule Cgraph.Accounts.UserSettings do
  @moduledoc """
  User settings and preferences schema.
  
  Stores all user-configurable settings including:
  - Notification preferences
  - Privacy settings
  - Theme preferences
  - Language and locale
  """
  use Ecto.Schema
  import Ecto.Changeset
  
  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  
  schema "user_settings" do
    belongs_to :user, Cgraph.Accounts.User
    
    # Notification preferences
    field :email_notifications, :boolean, default: true
    field :push_notifications, :boolean, default: true
    field :notify_messages, :boolean, default: true
    field :notify_mentions, :boolean, default: true
    field :notify_friend_requests, :boolean, default: true
    field :notify_group_invites, :boolean, default: true
    field :notify_forum_replies, :boolean, default: true
    field :notification_sound, :boolean, default: true
    field :quiet_hours_enabled, :boolean, default: false
    field :quiet_hours_start, :time
    field :quiet_hours_end, :time
    
    # Privacy settings
    field :show_online_status, :boolean, default: true
    field :show_read_receipts, :boolean, default: true
    field :show_typing_indicators, :boolean, default: true
    field :profile_visibility, Ecto.Enum, values: [:public, :friends, :private], default: :public
    field :allow_friend_requests, :boolean, default: true
    field :allow_message_requests, :boolean, default: true
    field :show_in_search, :boolean, default: true
    field :allow_group_invites, Ecto.Enum, values: [:anyone, :friends, :nobody], default: :anyone
    
    # Appearance preferences
    field :theme, Ecto.Enum, values: [:light, :dark, :system], default: :system
    field :compact_mode, :boolean, default: false
    field :font_size, Ecto.Enum, values: [:small, :medium, :large], default: :medium
    field :message_density, Ecto.Enum, values: [:comfortable, :compact], default: :comfortable
    field :show_avatars, :boolean, default: true
    field :animate_emojis, :boolean, default: true
    
    # Accessibility
    field :reduce_motion, :boolean, default: false
    field :high_contrast, :boolean, default: false
    field :screen_reader_optimized, :boolean, default: false
    
    # Language and locale
    field :language, :string, default: "en"
    field :timezone, :string, default: "UTC"
    field :date_format, Ecto.Enum, values: [:mdy, :dmy, :ymd], default: :mdy
    field :time_format, Ecto.Enum, values: [:twelve_hour, :twenty_four_hour], default: :twelve_hour
    
    # Keyboard shortcuts
    field :keyboard_shortcuts_enabled, :boolean, default: true
    field :custom_shortcuts, :map, default: %{}
    
    timestamps()
  end
  
  @doc """
  Creates a changeset for user settings.
  """
  def changeset(settings, attrs) do
    settings
    |> cast(attrs, [
      :email_notifications,
      :push_notifications,
      :notify_messages,
      :notify_mentions,
      :notify_friend_requests,
      :notify_group_invites,
      :notify_forum_replies,
      :notification_sound,
      :quiet_hours_enabled,
      :quiet_hours_start,
      :quiet_hours_end,
      :show_online_status,
      :show_read_receipts,
      :show_typing_indicators,
      :profile_visibility,
      :allow_friend_requests,
      :allow_message_requests,
      :show_in_search,
      :allow_group_invites,
      :theme,
      :compact_mode,
      :font_size,
      :message_density,
      :show_avatars,
      :animate_emojis,
      :reduce_motion,
      :high_contrast,
      :screen_reader_optimized,
      :language,
      :timezone,
      :date_format,
      :time_format,
      :keyboard_shortcuts_enabled,
      :custom_shortcuts
    ])
    |> validate_timezone()
    |> validate_quiet_hours()
  end
  
  defp validate_timezone(changeset) do
    case get_change(changeset, :timezone) do
      nil -> changeset
      tz ->
        if tz in Tzdata.zone_list() do
          changeset
        else
          add_error(changeset, :timezone, "is not a valid timezone")
        end
    end
  end
  
  defp validate_quiet_hours(changeset) do
    if get_field(changeset, :quiet_hours_enabled) do
      changeset
      |> validate_required([:quiet_hours_start, :quiet_hours_end])
    else
      changeset
    end
  end
end
