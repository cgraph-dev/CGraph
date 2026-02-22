defmodule CGraphWeb.CosmeticsController do
  @moduledoc """
  Controller for cosmetics-related endpoints.
  Handles avatar borders, profile themes, chat effects, and related customizations.

  ## Endpoints

  ### Avatar Borders
  - GET /api/v1/avatar-borders - List all borders
  - GET /api/v1/avatar-borders/unlocked - Get user's unlocked borders
  - POST /api/v1/avatar-borders/:id/equip - Equip a border
  - POST /api/v1/avatar-borders/:id/purchase - Purchase a border

  ### Profile Themes
  - GET /api/v1/profile-themes - List all themes
  - GET /api/v1/profile-themes/active - Get user's active theme
  - POST /api/v1/profile-themes/:id/activate - Activate a theme
  - POST /api/v1/profile-themes/:id/customize - Customize a theme

  ### Chat Effects
  - GET /api/v1/chat-effects - Get user's chat effect settings
  - PUT /api/v1/chat-effects/sync - Sync chat effect preferences
  - POST /api/v1/chat-effects/:id/unlock - Unlock an effect
  """
  use CGraphWeb, :controller

  import Ecto.Query, warn: false

  alias CGraph.Accounts
  alias CGraph.Customizations
  alias CGraph.Gamification
  alias CGraph.Gamification.{AvatarBorder, ChatEffect, ProfileTheme, UserAvatarBorder, UserChatEffect, UserProfileTheme}
  alias CGraph.Repo

  import CGraphWeb.CosmeticsController.Serializers

  action_fallback CGraphWeb.FallbackController

  # ==================== AVATAR BORDERS ====================

  @doc """
  GET /api/v1/avatar-borders
  List all available avatar borders, optionally filtered by theme or rarity.
  """
  def list_borders(conn, params) do
    theme = params["theme"]
    rarity = params["rarity"]

    query = from b in AvatarBorder,
      where: b.is_active == true,
      order_by: [asc: b.sort_order, asc: b.name]

    query = if theme, do: from(b in query, where: b.theme == ^theme), else: query
    query = if rarity, do: from(b in query, where: b.rarity == ^rarity), else: query

    borders = Repo.all(query)

    conn
    |> put_status(:ok)
    |> json(%{
      borders: Enum.map(borders, &serialize_border/1),
      themes: AvatarBorder.themes(),
      rarities: AvatarBorder.rarities()
    })
  end

  @doc """
  GET /api/v1/avatar-borders/unlocked
  Get the current user's unlocked avatar borders.
  """
  def unlocked_borders(conn, _params) do
    user = conn.assigns.current_user

    user_borders = from(ub in UserAvatarBorder,
      where: ub.user_id == ^user.id,
      preload: [:avatar_border]
    ) |> Repo.all()

    equipped = Enum.find(user_borders, & &1.is_equipped)

    conn
    |> put_status(:ok)
    |> json(%{
      unlocked: Enum.map(user_borders, &serialize_user_border/1),
      equipped_id: equipped && equipped.border_id
    })
  end

  @doc """
  POST /api/v1/avatar-borders/:id/equip
  Equip an avatar border.
  """
  def equip_border(conn, %{"id" => border_id}) do
    user = conn.assigns.current_user

    # Check if user has unlocked this border
    case Repo.get_by(UserAvatarBorder, user_id: user.id, border_id: border_id) do
      nil ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Border not unlocked"})

      user_border ->
        # Check if expired
        if expired?(user_border.expires_at) do
          conn
          |> put_status(:forbidden)
          |> json(%{error: "Border has expired"})
        else
          # Unequip all other borders
          from(ub in UserAvatarBorder, where: ub.user_id == ^user.id and ub.is_equipped == true)
          |> Repo.update_all(set: [is_equipped: false])

          # Equip this border
          {:ok, updated} = user_border
          |> UserAvatarBorder.equip_changeset(%{is_equipped: true})
          |> Repo.update()

          # Sync equipped border to user profile (single source of truth)
          border = Repo.get(AvatarBorder, border_id)
          _ = sync_equipped_border(user, border)
          _ = Customizations.update_user_customizations(user.id, %{border_id: border_id})

          conn
          |> put_status(:ok)
          |> json(%{success: true, equipped: serialize_user_border(Repo.preload(updated, :avatar_border))})
        end
    end
  end

  defp sync_equipped_border(user, %AvatarBorder{} = border) do
    primary = List.first(border.colors || [])
    secondary = border.colors |> List.wrap() |> Enum.at(1)
    particle_type = Map.get(border.particle_config || %{}, "type")
    glow_intensity =
      case Map.get(border.glow_config || %{}, "intensity") do
        val when is_number(val) -> trunc(val)
        _ -> 50
      end

    Accounts.update_user(user, %{
      border_id: border.id,
      avatar_border_animation: border.animation_type,
      avatar_border_color_primary: primary,
      avatar_border_color_secondary: secondary,
      avatar_border_particle_effect: particle_type,
      avatar_border_glow_intensity: glow_intensity,
      avatar_border_config: %{
        border_style: border.border_style,
        animation_speed: border.animation_speed,
        animation_intensity: border.animation_intensity,
        particle_config: border.particle_config,
        glow_config: border.glow_config
      },
      avatar_border_equipped_at: DateTime.utc_now()
    })
  end

  defp sync_equipped_border(_user, _border), do: {:ok, :skipped}

  @doc """
  POST /api/v1/avatar-borders/:id/purchase
  Purchase an avatar border with coins or gems.
  """
  def purchase_border(conn, %{"id" => border_id} = params) do
    user = conn.assigns.current_user
    currency = params["currency"] || "coins"

    with {:ok, border} <- get_purchasable_border(border_id),
         {:ok, _} <- check_not_already_owned(user.id, border_id),
         {:ok, _} <- deduct_currency(user.id, border, currency),
         {:ok, user_border} <- create_user_border(user.id, border_id, "purchase") do

      conn
      |> put_status(:created)
      |> json(%{
        success: true,
        unlocked: serialize_user_border(Repo.preload(user_border, :avatar_border))
      })
    else
      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: reason})
    end
  end

  # ==================== PROFILE THEMES ====================

  @doc """
  GET /api/v1/profile-themes
  List all available profile themes.
  """
  def list_profile_themes(conn, params) do
    preset = params["preset"]
    rarity = params["rarity"]

    query = from t in ProfileTheme,
      where: t.is_active == true,
      order_by: [asc: t.sort_order, asc: t.name]

    query = if preset, do: from(t in query, where: t.preset == ^preset), else: query
    query = if rarity, do: from(t in query, where: t.rarity == ^rarity), else: query

    themes = Repo.all(query)

    conn
    |> put_status(:ok)
    |> json(%{
      themes: Enum.map(themes, &serialize_profile_theme/1),
      presets: ProfileTheme.presets(),
      rarities: ProfileTheme.rarities()
    })
  end

  @doc """
  GET /api/v1/profile-themes/active
  Get user's active profile theme with customizations.
  """
  def active_profile_theme(conn, _params) do
    user = conn.assigns.current_user

    active = from(ut in UserProfileTheme,
      where: ut.user_id == ^user.id and ut.is_active == true,
      preload: [:profile_theme]
    ) |> Repo.one()

    if active do
      conn
      |> put_status(:ok)
      |> json(%{theme: serialize_user_profile_theme(active)})
    else
      conn
      |> put_status(:ok)
      |> json(%{theme: nil})
    end
  end

  @doc """
  POST /api/v1/profile-themes/:id/activate
  Activate a profile theme.
  """
  def activate_profile_theme(conn, %{"id" => theme_id}) do
    user = conn.assigns.current_user

    case Repo.get_by(UserProfileTheme, user_id: user.id, theme_id: theme_id) do
      nil ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Theme not unlocked"})

      user_theme ->
        if expired?(user_theme.expires_at) do
          conn
          |> put_status(:forbidden)
          |> json(%{error: "Theme has expired"})
        else
          # Deactivate all other themes
          from(ut in UserProfileTheme, where: ut.user_id == ^user.id and ut.is_active == true)
          |> Repo.update_all(set: [is_active: false])

          # Activate this theme
          {:ok, updated} = user_theme
          |> UserProfileTheme.activate_changeset(%{is_active: true})
          |> Repo.update()

          conn
          |> put_status(:ok)
          |> json(%{success: true, theme: serialize_user_profile_theme(Repo.preload(updated, :profile_theme))})
        end
    end
  end

  @doc """
  PUT /api/v1/profile-themes/:id/customize
  Save custom overrides for a profile theme.
  """
  def customize_profile_theme(conn, %{"id" => theme_id} = params) do
    user = conn.assigns.current_user

    case Repo.get_by(UserProfileTheme, user_id: user.id, theme_id: theme_id) do
      nil ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Theme not unlocked"})

      user_theme ->
        customizations = %{
          custom_colors: params["colors"],
          custom_background: params["background"],
          custom_layout: params["layout"],
          custom_effects: params["effects"]
        } |> Enum.reject(fn {_k, v} -> is_nil(v) end) |> Map.new()

        {:ok, updated} = user_theme
        |> UserProfileTheme.customize_changeset(customizations)
        |> Repo.update()

        conn
        |> put_status(:ok)
        |> json(%{success: true, theme: serialize_user_profile_theme(Repo.preload(updated, :profile_theme))})
    end
  end

  # ==================== CHAT EFFECTS ====================

  @doc """
  GET /api/v1/chat-effects
  Get user's chat effect settings and unlocked effects.
  """
  def get_chat_effects(conn, _params) do
    user = conn.assigns.current_user

    user_effects = from(ue in UserChatEffect,
      where: ue.user_id == ^user.id,
      preload: [:chat_effect]
    ) |> Repo.all()

    active_effects = Enum.filter(user_effects, & &1.is_active)

    conn
    |> put_status(:ok)
    |> json(%{
      unlockedEffects: Enum.map(user_effects, &serialize_user_chat_effect/1),
      activeEffects: Enum.map(active_effects, & &1.chat_effect.effect_id)
    })
  end

  @doc """
  POST /api/v1/chat-effects/sync
  Sync user's chat effect preferences from client.
  """
  def sync_chat_effects(conn, params) do
    _user = conn.assigns.current_user

    # Store user preferences in user settings or dedicated table
    # This could also be stored in Redis for faster access
    _preferences = %{
      "message_effect" => params["messageEffect"],
      "bubble_style" => params["bubbleStyle"],
      "emoji_pack" => params["emojiPack"],
      "typing_indicator" => params["typingIndicator"],
      "reaction_config" => params["reactionConfig"],
      "sound_settings" => params["soundSettings"],
      "settings" => params["settings"]
    }

    # For now, we'll just acknowledge the sync
    # In production, this would persist to database
    conn
    |> put_status(:ok)
    |> json(%{success: true, synced_at: DateTime.utc_now()})
  end

  @doc """
  POST /api/v1/chat-effects/:id/activate
  Activate a chat effect.
  """
  def activate_chat_effect(conn, %{"id" => effect_id}) do
    user = conn.assigns.current_user

    case Repo.get_by(UserChatEffect, user_id: user.id, effect_id: effect_id) do
      nil ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Effect not unlocked"})

      user_effect ->
        if expired?(user_effect.expires_at) do
          conn
          |> put_status(:forbidden)
          |> json(%{error: "Effect has expired"})
        else
          effect = Repo.get!(ChatEffect, effect_id)

          # Deactivate other effects of the same type
          from(ue in UserChatEffect,
            join: ce in ChatEffect, on: ue.effect_id == ce.id,
            where: ue.user_id == ^user.id and ue.is_active == true and ce.effect_type == ^effect.effect_type
          )
          |> Repo.update_all(set: [is_active: false])

          # Activate this effect
          {:ok, updated} = user_effect
          |> UserChatEffect.activate_changeset(%{is_active: true})
          |> Repo.update()

          conn
          |> put_status(:ok)
          |> json(%{success: true, effect: serialize_user_chat_effect(Repo.preload(updated, :chat_effect))})
        end
    end
  end

  # ==================== PRIVATE HELPERS ====================

  defp get_purchasable_border(border_id) do
    case Repo.get(AvatarBorder, border_id) do
      nil -> {:error, "Border not found"}
      %{is_purchasable: false} -> {:error, "Border is not purchasable"}
      border -> {:ok, border}
    end
  end

  defp check_not_already_owned(user_id, border_id) do
    case Repo.get_by(UserAvatarBorder, user_id: user_id, border_id: border_id) do
      nil -> {:ok, :not_owned}
      _ -> {:error, "Border already owned"}
    end
  end

  defp deduct_currency(user_id, border, currency) do
    cost = if currency == "gems", do: border.gem_cost, else: border.coin_cost

    case Gamification.deduct_currency(user_id, cost, String.to_existing_atom(currency)) do
      {:ok, _} -> {:ok, :deducted}
      {:error, _} -> {:error, "Insufficient #{currency}"}
    end
  end

  defp create_user_border(user_id, border_id, source) do
    %UserAvatarBorder{}
    |> UserAvatarBorder.changeset(%{
      user_id: user_id,
      border_id: border_id,
      unlock_source: source,
      acquired_at: DateTime.truncate(DateTime.utc_now(), :second)
    })
    |> Repo.insert()
  end
end
