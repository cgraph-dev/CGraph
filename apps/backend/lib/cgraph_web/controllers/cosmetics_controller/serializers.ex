defmodule CGraphWeb.CosmeticsController.Serializers do
  @moduledoc """
  Serialization helpers for cosmetics controller responses.

  Provides serialization for avatar borders, profile themes, and chat effects,
  as well as shared helpers like expiration checks.
  """

  @doc "Check whether a timed item has expired."
  @spec expired?(DateTime.t() | nil) :: boolean()
  def expired?(nil), do: false
  def expired?(expires_at), do: DateTime.compare(DateTime.utc_now(), expires_at) == :gt

  @doc "Serialize an avatar border."
  @spec serialize_border(term()) :: map()
  def serialize_border(border) do
    base = %{
      id: border.id,
      slug: border.slug,
      name: border.name,
      description: border.description,
      theme: border.theme,
      rarity: border.rarity,
      borderStyle: border.border_style,
      animationType: border.animation_type,
      animationSpeed: border.animation_speed,
      animationIntensity: border.animation_intensity,
      colors: border.colors,
      particleConfig: border.particle_config,
      glowConfig: border.glow_config,
      isPurchasable: border.is_purchasable,
      coinCost: border.coin_cost,
      gemCost: border.gem_cost,
      previewUrl: border.preview_url
    }

    # Include Lottie fields when animation type is lottie
    if border.animation_type == "lottie" do
      base
      |> Map.put(:lottieUrl, Map.get(border, :lottie_url))
      |> Map.put(:lottieAssetId, Map.get(border, :lottie_asset_id))
      |> Map.put(:lottieConfig, Map.get(border, :lottie_config))
    else
      base
    end
  end

  @doc "Serialize a user's unlocked avatar border."
  @spec serialize_user_border(term()) :: map()
  def serialize_user_border(user_border) do
    %{
      id: user_border.id,
      borderId: user_border.border_id,
      isEquipped: user_border.is_equipped,
      unlockSource: user_border.unlock_source,
      expiresAt: user_border.expires_at,
      customColors: user_border.custom_colors,
      border: user_border.avatar_border && serialize_border(user_border.avatar_border)
    }
  end

  @doc "Serialize a profile theme."
  @spec serialize_profile_theme(term()) :: map()
  def serialize_profile_theme(theme) do
    %{
      id: theme.id,
      slug: theme.slug,
      name: theme.name,
      description: theme.description,
      preset: theme.preset,
      rarity: theme.rarity,
      colors: theme.colors,
      backgroundType: theme.background_type,
      backgroundConfig: theme.background_config,
      layoutType: theme.layout_type,
      hoverEffect: theme.hover_effect,
      glassmorphism: theme.glassmorphism,
      borderRadius: theme.border_radius,
      fontFamily: theme.font_family,
      isPurchasable: theme.is_purchasable,
      coinCost: theme.coin_cost,
      gemCost: theme.gem_cost,
      previewUrl: theme.preview_url
    }
  end

  @doc "Serialize a user's activated profile theme."
  @spec serialize_user_profile_theme(term()) :: map()
  def serialize_user_profile_theme(user_theme) do
    %{
      id: user_theme.id,
      themeId: user_theme.theme_id,
      isActive: user_theme.is_active,
      unlockSource: user_theme.unlock_source,
      expiresAt: user_theme.expires_at,
      customColors: user_theme.custom_colors,
      customBackground: user_theme.custom_background,
      customLayout: user_theme.custom_layout,
      customEffects: user_theme.custom_effects,
      theme: user_theme.profile_theme && serialize_profile_theme(user_theme.profile_theme)
    }
  end

  @doc "Serialize a user's chat effect."
  @spec serialize_user_chat_effect(term()) :: map()
  def serialize_user_chat_effect(user_effect) do
    %{
      id: user_effect.id,
      effectId: user_effect.effect_id,
      isActive: user_effect.is_active,
      unlockSource: user_effect.unlock_source,
      expiresAt: user_effect.expires_at,
      customConfig: user_effect.custom_config,
      effect: user_effect.chat_effect && %{
        id: user_effect.chat_effect.id,
        slug: user_effect.chat_effect.slug,
        name: user_effect.chat_effect.name,
        effectType: user_effect.chat_effect.effect_type,
        effectId: user_effect.chat_effect.effect_id,
        rarity: user_effect.chat_effect.rarity,
        config: user_effect.chat_effect.config
      }
    }
  end
end
