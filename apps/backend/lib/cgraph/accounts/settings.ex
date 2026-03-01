defmodule CGraph.Accounts.Settings do
  @moduledoc """
  Context for managing user settings.

  Provides functions to:
  - Get user settings (with defaults)
  - Update individual settings
  - Bulk update settings
  - Reset to defaults
  """

  alias CGraph.Accounts.{Friends, User, UserSettings}
  alias CGraph.Repo

  @doc """
  Gets settings for a user, creating defaults if they don't exist.
  """
  @spec get_settings(User.t() | String.t()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
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
  @spec get_user_settings(User.t() | String.t()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def get_user_settings(user), do: get_settings(user)

  @doc """
  Creates default settings for a user.
  """
  @spec create_default_settings(String.t()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
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
  @spec update_settings(User.t() | String.t(), map()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
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
  @spec update_all_settings(User.t() | String.t(), map()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def update_all_settings(user, attrs), do: update_settings(user, attrs)

  @doc """
  Update privacy-related settings.
  """
  @spec update_privacy_settings(User.t() | String.t(), map()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def update_privacy_settings(user, privacy_attrs) do
    update_settings(user, privacy_attrs)
  end

  @doc """
  Update notification-related settings.
  """
  @spec update_notification_settings(User.t() | String.t(), map()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def update_notification_settings(user, notification_attrs) do
    update_settings(user, notification_attrs)
  end

  @doc """
  Update appearance-related settings.
  """
  @spec update_appearance_settings(User.t() | String.t(), map()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def update_appearance_settings(user, appearance_attrs) do
    update_settings(user, appearance_attrs)
  end

  @doc """
  Update locale-related settings.
  """
  @spec update_locale_settings(User.t() | String.t(), map()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def update_locale_settings(user, locale_attrs) do
    update_settings(user, locale_attrs)
  end

  @doc """
  Resets all settings to their defaults.
  """
  @spec reset_to_defaults(User.t() | String.t()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
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

  @notification_type_fields %{
    message: :notify_messages,
    mention: :notify_mentions,
    friend_request: :notify_friend_requests,
    group_invite: :notify_group_invites,
    forum_reply: :notify_forum_replies
  }

  @doc """
  Checks if the user should receive a specific type of notification.
  Also checks DND override (dnd_until).
  """
  @spec should_notify?(User.t(), atom()) :: boolean()
  def should_notify?(%User{} = user, type) do
    {:ok, settings} = get_settings(user)

    # DND override takes priority — if dnd_until is in the future, suppress all notifications
    if dnd_active?(settings) do
      false
    else
      base_enabled = settings.push_notifications || settings.email_notifications
      type_enabled = type_notification_enabled?(settings, type)

      base_enabled && type_enabled && !in_quiet_hours?(settings)
    end
  end

  defp type_notification_enabled?(settings, type) do
    case Map.get(@notification_type_fields, type) do
      nil -> true
      field -> Map.get(settings, field, true)
    end
  end

  @doc """
  Checks if current time is within the user's quiet hours.
  Uses the user's timezone setting for correct local-time comparison.
  """
  @spec in_quiet_hours?(UserSettings.t()) :: boolean()
  def in_quiet_hours?(%UserSettings{quiet_hours_enabled: false}), do: false

  def in_quiet_hours?(%UserSettings{quiet_hours_enabled: true} = settings) do
    case {settings.quiet_hours_start, settings.quiet_hours_end} do
      {nil, _} -> false
      {_, nil} -> false
      {start, finish} ->
        now = local_time_now(settings.timezone)

        if Time.compare(start, finish) == :lt do
          # Same-day range (e.g., 09:00 to 17:00)
          Time.compare(now, start) != :lt && Time.compare(now, finish) == :lt
        else
          # Overnight range (e.g., 22:00 to 07:00)
          Time.compare(now, start) != :lt || Time.compare(now, finish) == :lt
        end
    end
  end

  @doc """
  Checks if DND (Do Not Disturb) is currently active for the user.
  DND is active if `dnd_until` is set and in the future.
  """
  @spec dnd_active?(UserSettings.t()) :: boolean()
  def dnd_active?(%UserSettings{dnd_until: nil}), do: false

  def dnd_active?(%UserSettings{dnd_until: dnd_until}) do
    DateTime.compare(DateTime.utc_now(), dnd_until) == :lt
  end

  @doc """
  Sets DND for a duration in minutes. Pass `:indefinite` for no expiry.
  """
  @spec set_dnd(User.t() | String.t(), pos_integer() | :indefinite) ::
          {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def set_dnd(user, :indefinite) do
    # Set to far future (1 year)
    dnd_until =
      DateTime.utc_now()
      |> DateTime.add(365 * 24 * 3600, :second)
      |> DateTime.truncate(:second)

    update_settings(user, %{dnd_until: dnd_until})
  end

  def set_dnd(user, duration_minutes) when is_integer(duration_minutes) and duration_minutes > 0 do
    dnd_until =
      DateTime.utc_now()
      |> DateTime.add(duration_minutes * 60, :second)
      |> DateTime.truncate(:second)

    update_settings(user, %{dnd_until: dnd_until})
  end

  @doc """
  Clears DND for a user.
  """
  @spec clear_dnd(User.t() | String.t()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def clear_dnd(user) do
    update_settings(user, %{dnd_until: nil})
  end

  @doc """
  Returns the current DND state for a user.
  """
  @spec get_dnd_state(User.t() | String.t()) :: %{active: boolean(), dnd_until: DateTime.t() | nil}
  def get_dnd_state(user) do
    {:ok, settings} = get_settings(user)

    %{
      active: dnd_active?(settings),
      dnd_until: settings.dnd_until
    }
  end

  # Converts UTC now to local time in the user's timezone using Timex.
  # Falls back to UTC if timezone is invalid.
  defp local_time_now(nil), do: Time.utc_now()
  defp local_time_now("UTC"), do: Time.utc_now()

  defp local_time_now(timezone) do
    case Timex.now(timezone) do
      %DateTime{} = dt -> DateTime.to_time(dt)
      {:error, _} -> Time.utc_now()
    end
  rescue
    _ -> Time.utc_now()
  end

  @doc """
  Checks if a user can be messaged by another user based on privacy settings.
  """
  @spec can_message?(User.t(), User.t()) :: boolean()
  def can_message?(%User{} = sender, %User{} = recipient) do
    {:ok, settings} = get_settings(recipient)

    settings.allow_message_requests || Friends.are_friends?(sender, recipient)
  end

  @doc """
  Checks if a user is visible in search results.
  """
  @spec visible_in_search?(User.t()) :: boolean()
  def visible_in_search?(%User{} = user) do
    {:ok, settings} = get_settings(user)
    settings.show_in_search
  end

  @doc """
  Gets users online status visibility.
  """
  @spec show_online_status?(User.t()) :: boolean()
  def show_online_status?(%User{} = user) do
    {:ok, settings} = get_settings(user)
    settings.show_online_status
  end

  @doc """
  Gets users read receipt setting.
  """
  @spec show_read_receipts?(User.t()) :: boolean()
  def show_read_receipts?(%User{} = user) do
    {:ok, settings} = get_settings(user)
    settings.show_read_receipts
  end

  @doc """
  Gets user's profile visibility setting.
  """
  @spec profile_visible_to?(User.t(), User.t()) :: boolean()
  def profile_visible_to?(%User{} = profile_owner, %User{} = viewer) do
    {:ok, settings} = get_settings(profile_owner)

    case settings.profile_visibility do
      :public -> true
      :friends -> Friends.are_friends?(profile_owner, viewer)
      :private -> profile_owner.id == viewer.id
    end
  end
end
