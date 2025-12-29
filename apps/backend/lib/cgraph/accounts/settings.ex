defmodule Cgraph.Accounts.Settings do
  @moduledoc """
  Context for managing user settings.
  
  Provides functions to:
  - Get user settings (with defaults)
  - Update individual settings
  - Bulk update settings
  - Reset to defaults
  """
  
  # Ecto.Query import available if needed
  alias Cgraph.Repo
  alias Cgraph.Accounts.{User, UserSettings}
  
  @doc """
  Gets settings for a user, creating defaults if they don't exist.
  """
  def get_settings(%User{id: user_id}) do
    get_settings(user_id)
  end
  
  def get_settings(user_id) when is_binary(user_id) do
    case Repo.get_by(UserSettings, user_id: user_id) do
      nil -> create_default_settings(user_id)
      settings -> {:ok, settings}
    end
  end

  @doc """
  Alias for get_settings/1 to match controller expectations.
  """
  def get_user_settings(user), do: get_settings(user)
  
  @doc """
  Creates default settings for a user.
  """
  def create_default_settings(user_id) do
    %UserSettings{user_id: user_id}
    |> Repo.insert()
  end
  
  @doc """
  Updates user settings.
  
  ## Examples
  
      iex> update_settings(user, %{theme: :dark, compact_mode: true})
      {:ok, %UserSettings{}}
  
  """
  def update_settings(%User{id: user_id}, attrs) do
    update_settings(user_id, attrs)
  end
  
  def update_settings(user_id, attrs) when is_binary(user_id) do
    {:ok, settings} = get_settings(user_id)
    
    settings
    |> UserSettings.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Alias for update_settings/2.
  """
  def update_all_settings(user, attrs), do: update_settings(user, attrs)

  @doc """
  Update privacy-related settings.
  """
  def update_privacy_settings(user, privacy_attrs) do
    update_settings(user, privacy_attrs)
  end

  @doc """
  Update notification-related settings.
  """
  def update_notification_settings(user, notification_attrs) do
    update_settings(user, notification_attrs)
  end

  @doc """
  Update appearance-related settings.
  """
  def update_appearance_settings(user, appearance_attrs) do
    update_settings(user, appearance_attrs)
  end

  @doc """
  Update locale-related settings.
  """
  def update_locale_settings(user, locale_attrs) do
    update_settings(user, locale_attrs)
  end
  
  @doc """
  Resets all settings to their defaults.
  """
  def reset_to_defaults(%User{id: user_id}) do
    reset_to_defaults(user_id)
  end
  
  def reset_to_defaults(user_id) when is_binary(user_id) do
    case Repo.get_by(UserSettings, user_id: user_id) do
      nil -> 
        create_default_settings(user_id)
      settings ->
        Repo.delete!(settings)
        create_default_settings(user_id)
    end
  end
  
  # Convenience functions for checking specific settings
  
  @doc """
  Checks if the user should receive a specific type of notification.
  """
  def should_notify?(%User{} = user, type) do
    {:ok, settings} = get_settings(user)
    
    base_enabled = settings.push_notifications || settings.email_notifications
    
    type_enabled = case type do
      :message -> settings.notify_messages
      :mention -> settings.notify_mentions
      :friend_request -> settings.notify_friend_requests
      :group_invite -> settings.notify_group_invites
      :forum_reply -> settings.notify_forum_replies
      _ -> true
    end
    
    in_quiet_hours = in_quiet_hours?(settings)
    
    base_enabled && type_enabled && !in_quiet_hours
  end
  
  @doc """
  Checks if current time is within the user's quiet hours.
  """
  def in_quiet_hours?(%UserSettings{quiet_hours_enabled: false}), do: false
  
  def in_quiet_hours?(%UserSettings{quiet_hours_enabled: true} = settings) do
    case {settings.quiet_hours_start, settings.quiet_hours_end} do
      {nil, _} -> false
      {_, nil} -> false
      {start, finish} ->
        now = Time.utc_now()
        
        if Time.compare(start, finish) == :lt do
          # Normal range (e.g., 22:00 to 07:00)
          Time.compare(now, start) != :lt && Time.compare(now, finish) == :lt
        else
          # Overnight range (e.g., 22:00 to 07:00)
          Time.compare(now, start) != :lt || Time.compare(now, finish) == :lt
        end
    end
  end
  
  @doc """
  Checks if a user can be messaged by another user based on privacy settings.
  """
  def can_message?(%User{} = sender, %User{} = recipient) do
    {:ok, settings} = get_settings(recipient)
    
    cond do
      settings.allow_message_requests -> true
      Cgraph.Accounts.Friends.are_friends?(sender, recipient) -> true
      true -> false
    end
  end
  
  @doc """
  Checks if a user is visible in search results.
  """
  def visible_in_search?(%User{} = user) do
    {:ok, settings} = get_settings(user)
    settings.show_in_search
  end
  
  @doc """
  Gets users online status visibility.
  """
  def show_online_status?(%User{} = user) do
    {:ok, settings} = get_settings(user)
    settings.show_online_status
  end
  
  @doc """
  Gets users read receipt setting.
  """
  def show_read_receipts?(%User{} = user) do
    {:ok, settings} = get_settings(user)
    settings.show_read_receipts
  end
  
  @doc """
  Gets user's profile visibility setting.
  """
  def profile_visible_to?(%User{} = profile_owner, %User{} = viewer) do
    {:ok, settings} = get_settings(profile_owner)
    
    case settings.profile_visibility do
      :public -> true
      :friends -> Cgraph.Accounts.Friends.are_friends?(profile_owner, viewer)
      :private -> profile_owner.id == viewer.id
    end
  end
end
