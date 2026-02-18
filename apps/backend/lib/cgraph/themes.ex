defmodule CGraph.Themes do
  @moduledoc """
  Theme management context for user personalization.

  Handles:
  - User theme preferences (colors, borders, effects)
  - Theme snapshots for messages/posts
  - Premium theme validation
  - Theme caching
  """

  alias CGraph.Accounts.User
  alias CGraph.Repo
  require Logger

  # Default theme configuration
  @default_theme %{
    "colorPreset" => "purple",
    "avatarBorder" => "static",
    "avatarBorderColor" => "purple",
    "chatBubbleStyle" => "modern",
    "chatBubbleRadius" => 12,
    "chatBubbleShadow" => true,
    "chatBubbleTail" => true,
    "entranceAnimation" => "slide",
    "visualEffect" => "minimal",
    "animationSpeed" => "normal",
    "glowEnabled" => false,
    "particlesEnabled" => false,
    "isPremium" => false
  }

  # Premium-only features
  @premium_borders ~w(fire ice electric legendary mythic)
  @premium_effects ~w(holographic neon aurora cyberpunk)

  # Theme cache TTL (5 minutes)
  @cache_ttl :timer.minutes(5)

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Get user's theme preferences.
  Returns cached version if available.
  """
  @spec get_theme(String.t()) :: map()
  def get_theme(user_id) when is_binary(user_id) do
    case get_cached_theme(user_id) do
      {:ok, theme} -> theme
      :miss -> fetch_and_cache_theme(user_id)
    end
  end

  @doc """
  Update user's theme preferences.
  Validates premium features based on user subscription.
  """
  @spec update_theme(String.t(), map()) :: {:ok, map()} | {:error, term()}
  def update_theme(user_id, theme_params) when is_binary(user_id) and is_map(theme_params) do
    with {:ok, user} <- get_user(user_id),
         {:ok, validated_theme} <- validate_theme(theme_params, user),
         {:ok, _updated_user} <- save_theme(user, validated_theme) do
      invalidate_cache(user_id)
      {:ok, validated_theme}
    end
  end

  @doc """
  Reset user's theme to defaults.
  """
  @spec reset_theme(String.t()) :: {:ok, map()} | {:error, term()}
  def reset_theme(user_id) when is_binary(user_id) do
    update_theme(user_id, @default_theme)
  end

  @doc """
  Get themes for multiple users (batch fetch for chat/forums).
  Returns a map of user_id => theme.
  """
  @spec get_themes_batch(list(String.t())) :: map()
  def get_themes_batch(user_ids) when is_list(user_ids) do
    user_ids
    |> Enum.uniq()
    |> Enum.take(100)  # Limit batch size
    |> Enum.map(fn id -> {id, get_theme(id)} end)
    |> Map.new()
  end

  @doc """
  Create a theme snapshot for a message/post.
  Captures the essential theme data at the time of creation.
  """
  @spec create_theme_snapshot(String.t()) :: map()
  def create_theme_snapshot(user_id) when is_binary(user_id) do
    theme = get_theme(user_id)

    # Only include display-relevant fields in snapshot
    %{
      "colorPreset" => theme["colorPreset"],
      "avatarBorder" => theme["avatarBorder"],
      "avatarBorderColor" => theme["avatarBorderColor"],
      "chatBubbleStyle" => theme["chatBubbleStyle"],
      "visualEffect" => theme["visualEffect"],
      "glowEnabled" => theme["glowEnabled"]
    }
  end

  @doc """
  Get the default theme configuration.
  """
  @spec default_theme() :: map()
  def default_theme, do: @default_theme

  @doc """
  Check if a theme feature is premium-only.
  """
  @spec premium_feature?(String.t(), String.t()) :: boolean()
  def premium_feature?(type, value) do
    case type do
      "avatarBorder" -> value in @premium_borders
      "visualEffect" -> value in @premium_effects
      _ -> false
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp get_user(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> {:ok, user}
    end
  end

  defp validate_theme(theme_params, user) do
    is_premium = user.is_premium || user.subscription_tier in ["premium", "enterprise"]

    validated = theme_params
    |> Map.take(Map.keys(@default_theme))
    |> validate_premium_features(is_premium)
    |> merge_with_defaults()

    {:ok, validated}
  end

  defp validate_premium_features(theme, false = _is_premium) do
    # Downgrade premium features to defaults for non-premium users
    theme
    |> Map.update("avatarBorder", "static", fn border ->
      if border in @premium_borders, do: "static", else: border
    end)
    |> Map.update("visualEffect", "minimal", fn effect ->
      if effect in @premium_effects, do: "minimal", else: effect
    end)
    |> Map.put("isPremium", false)
  end

  defp validate_premium_features(theme, true = _is_premium) do
    Map.put(theme, "isPremium", true)
  end

  defp merge_with_defaults(theme) do
    Map.merge(@default_theme, theme)
  end

  defp save_theme(user, theme) do
    alias CGraph.Customizations.UserCustomization

    case Repo.get_by(UserCustomization, user_id: user.id) do
      nil ->
        %UserCustomization{}
        |> Ecto.Changeset.change(%{user_id: user.id, app_theme: theme["mode"] || "dark", profile_theme: theme["accent"] || "classic-purple"})
        |> Repo.insert()

      customization ->
        customization
        |> Ecto.Changeset.change(%{app_theme: theme["mode"] || customization.app_theme, profile_theme: theme["accent"] || customization.profile_theme})
        |> Repo.update()
    end
  end

  # ============================================================================
  # Caching
  # ============================================================================

  defp get_cached_theme(user_id) do
    now = System.system_time(:millisecond)
    case :ets.lookup(:theme_cache, user_id) do
      [{^user_id, theme, expires_at}] when expires_at > now ->
        {:ok, theme}
      _ ->
        :miss
    end
  rescue
    ArgumentError -> :miss
  end

  defp fetch_and_cache_theme(user_id) do
    alias CGraph.Customizations.UserCustomization

    theme = case Repo.get_by(UserCustomization, user_id: user_id) do
      nil -> @default_theme
      customization ->
        %{
          "mode" => customization.app_theme || "dark",
          "accent" => customization.profile_theme || "classic-purple"
        }
        |> then(&Map.merge(@default_theme, &1))
    end

    cache_theme(user_id, theme)
    theme
  end

  defp cache_theme(user_id, theme) do
    expires_at = System.system_time(:millisecond) + @cache_ttl
    :ets.insert(:theme_cache, {user_id, theme, expires_at})
  rescue
    ArgumentError ->
      # Table doesn't exist yet, skip caching
      :ok
  end

  defp invalidate_cache(user_id) do
    :ets.delete(:theme_cache, user_id)
  rescue
    ArgumentError -> :ok
  end
end
