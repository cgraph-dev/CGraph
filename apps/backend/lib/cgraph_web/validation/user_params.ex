defmodule CGraphWeb.Validation.UserParams do
  @moduledoc """
  Strong parameter validation for user profile and account endpoints.

  Provides strict type checking, sanitization, and business rule validation
  for all user-related API operations.

  ## Security Features

  - Username validation (no impersonation, reserved words)
  - Bio/about sanitization (XSS prevention)
  - Avatar URL validation
  - Privacy setting enforcement
  """

  use Ecto.Schema
  import Ecto.Changeset

  @max_username_length 30
  @min_username_length 3
  @max_display_name_length 50
  @max_bio_length 500
  @max_about_length 2000

  # Reserved usernames that cannot be used
  @reserved_usernames ~w(
    admin administrator mod moderator system bot
    cgraph support help official staff
    api web mobile auth login logout register
    settings profile user users account accounts
    null undefined nil none anonymous guest
  )

  embedded_schema do
    # Profile fields
    field :username, :string
    field :display_name, :string
    field :bio, :string
    field :about, :string
    field :avatar_url, :string
    field :banner_url, :string
    field :location, :string
    field :website, :string
    field :pronouns, :string

    # Privacy settings
    field :is_online_visible, :boolean
    field :is_last_seen_visible, :boolean
    field :is_profile_public, :boolean
    field :allow_friend_requests, :boolean
    field :allow_messages_from, :string

    # Notification settings
    field :email_notifications, :boolean
    field :push_notifications, :boolean
    field :desktop_notifications, :boolean
    field :notification_sound, :boolean

    # Theme/appearance
    field :theme, :string
    field :language, :string
    field :timezone, :string

    # Search
    field :query, :string
    field :page, :integer, default: 1
    field :per_page, :integer, default: 20
  end

  @doc """
  Validate parameters for updating user profile.
  """
  def validate_update(params) do
    %__MODULE__{}
    |> cast(params, [
      :display_name, :bio, :about, :avatar_url, :banner_url,
      :location, :website, :pronouns
    ], empty_values: [""])
    |> validate_length(:display_name, max: @max_display_name_length)
    |> validate_length(:bio, max: @max_bio_length)
    |> validate_length(:about, max: @max_about_length)
    |> validate_url(:avatar_url)
    |> validate_url(:banner_url)
    |> validate_url(:website)
    |> sanitize_html_fields([:bio, :about])
    |> result_from_changeset()
  end

  @doc """
  Validate parameters for changing username.
  """
  def validate_username_change(params) do
    %__MODULE__{}
    |> cast(params, [:username], empty_values: [""])
    |> validate_required([:username])
    |> validate_username()
    |> result_from_changeset()
  end

  @doc """
  Validate privacy settings update.
  """
  def validate_privacy_settings(params) do
    %__MODULE__{}
    |> cast(params, [
      :is_online_visible, :is_last_seen_visible, :is_profile_public,
      :allow_friend_requests, :allow_messages_from
    ], empty_values: [""])
    |> validate_inclusion(:allow_messages_from, ~w(everyone friends nobody))
    |> result_from_changeset()
  end

  @doc """
  Validate notification settings update.
  """
  def validate_notification_settings(params) do
    %__MODULE__{}
    |> cast(params, [
      :email_notifications, :push_notifications, :desktop_notifications,
      :notification_sound
    ], empty_values: [""])
    |> result_from_changeset()
  end

  @doc """
  Validate appearance/preference settings.
  """
  def validate_appearance_settings(params) do
    %__MODULE__{}
    |> cast(params, [:theme, :language, :timezone], empty_values: [""])
    |> validate_inclusion(:theme, ~w(light dark system))
    |> validate_language()
    |> validate_timezone()
    |> result_from_changeset()
  end

  @doc """
  Validate search parameters for users.
  """
  def validate_search(params) do
    %__MODULE__{}
    |> cast(params, [:query, :page, :per_page], empty_values: [""])
    |> validate_required([:query])
    |> validate_length(:query, min: 2, max: 100)
    |> validate_number(:page, greater_than: 0)
    |> validate_number(:per_page, greater_than: 0, less_than_or_equal_to: 100)
    |> result_from_changeset()
  end

  # ============================================================================
  # Private Validation Functions
  # ============================================================================

  defp validate_username(changeset) do
    changeset
    |> validate_length(:username, min: @min_username_length, max: @max_username_length)
    |> validate_format(:username, ~r/^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: "must start with a letter and contain only letters, numbers, and underscores")
    |> validate_not_reserved()
    |> update_change(:username, &String.downcase/1)
  end

  defp validate_not_reserved(changeset) do
    username = get_change(changeset, :username)

    if username && String.downcase(username) in @reserved_usernames do
      add_error(changeset, :username, "is reserved and cannot be used")
    else
      changeset
    end
  end

  defp validate_url(changeset, field) do
    url = get_change(changeset, field)

    if url && is_binary(url) do
      case URI.parse(url) do
        %URI{scheme: scheme} when scheme in ["http", "https"] ->
          changeset

        _ ->
          add_error(changeset, field, "must be a valid HTTP or HTTPS URL")
      end
    else
      changeset
    end
  end

  defp validate_language(changeset) do
    # ISO 639-1 language codes (subset)
    valid_languages = ~w(en es fr de it pt ru ja ko zh ar hi)

    lang = get_change(changeset, :language)

    if lang && lang not in valid_languages do
      add_error(changeset, :language, "is not a supported language")
    else
      changeset
    end
  end

  defp validate_timezone(changeset) do
    tz = get_change(changeset, :timezone)

    if tz && is_binary(tz) do
      # Basic timezone validation - in production use Tzdata
      if String.match?(tz, ~r/^[A-Za-z]+\/[A-Za-z_]+$/) || tz in ["UTC", "GMT"] do
        changeset
      else
        add_error(changeset, :timezone, "is not a valid timezone")
      end
    else
      changeset
    end
  end

  defp sanitize_html_fields(changeset, fields) do
    Enum.reduce(fields, changeset, fn field, cs ->
      update_change(cs, field, fn content ->
        if content && is_binary(content) do
          content
          |> String.trim()
          |> sanitize_html()
        else
          content
        end
      end)
    end)
  end

  defp sanitize_html(content) do
    content
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&#39;")
  end

  # ============================================================================
  # Result Helpers
  # ============================================================================

  defp result_from_changeset(%Ecto.Changeset{} = changeset) do
    case apply_action(changeset, :validate) do
      {:ok, struct} -> {:ok, to_map(struct)}
      {:error, cs} -> {:error, cs}
    end
  end

  defp to_map(%__MODULE__{} = struct) do
    struct
    |> Map.from_struct()
    |> Map.delete(:__meta__)
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end
end
