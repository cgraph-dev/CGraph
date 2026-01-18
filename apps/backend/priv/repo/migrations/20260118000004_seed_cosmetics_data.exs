defmodule Cgraph.Repo.Migrations.SeedCosmeticsData do
  @moduledoc """
  Seeds initial cosmetics data for avatar borders, profile themes, and chat effects.
  Provides a diverse starting catalog for the marketplace and progression systems.
  """
  use Ecto.Migration

  def up do
    # ==================== AVATAR BORDERS SEED ====================
    execute """
    INSERT INTO avatar_borders (id, slug, name, description, theme, rarity, tier, border_style, animation_type, animation_config, particle_config, glow_config, unlock_type, coin_cost, is_purchasable, is_tradeable, sort_order, is_active, inserted_at, updated_at) VALUES
    -- 8-bit Theme
    (gen_random_uuid(), 'pixel-classic', 'Pixel Classic', 'A nostalgic 8-bit border with chunky pixels', '8bit', 'common', 1, '{"style": "solid", "width": 4, "pixelated": true}', NULL, '{}', '{}', '{}', 'default', 0, false, false, 1, true, NOW(), NOW()),
    (gen_random_uuid(), 'retro-rainbow', 'Retro Rainbow', 'Cycling rainbow colors in pixel art style', '8bit', 'uncommon', 2, '{"style": "solid", "width": 4, "pixelated": true}', 'rainbow-cycle', '{"speed": 2, "colors": ["#ff0000", "#ff8800", "#ffff00", "#00ff00", "#0088ff", "#8800ff"]}', '{}', '{}', 'purchase', 500, true, true, 2, true, NOW(), NOW()),
    (gen_random_uuid(), 'game-over', 'Game Over', 'Glitchy pixel border with death screen vibes', '8bit', 'rare', 3, '{"style": "glitch", "width": 5, "pixelated": true}', 'glitch', '{"intensity": 0.3, "frequency": 2}', '{}', '{"color": "#ff0000", "intensity": 0.5}', 'achievement', 0, false, true, 3, true, NOW(), NOW()),
    
    -- Cyberpunk Theme
    (gen_random_uuid(), 'neon-grid', 'Neon Grid', 'Electric blue grid lines pulsing with energy', 'cyberpunk', 'common', 1, '{"style": "grid", "width": 3, "color": "#00ffff"}', 'pulse', '{"speed": 1.5, "minOpacity": 0.5}', '{}', '{"color": "#00ffff", "intensity": 0.6}', 'purchase', 300, true, true, 10, true, NOW(), NOW()),
    (gen_random_uuid(), 'holographic-edge', 'Holographic Edge', 'Shifting holographic border with data streams', 'cyberpunk', 'rare', 3, '{"style": "holographic", "width": 4}', 'shimmer', '{"speed": 3, "direction": "diagonal"}', '{"type": "data", "count": 20}', '{"color": "#ff00ff", "intensity": 0.8}', 'purchase', 2000, true, true, 11, true, NOW(), NOW()),
    (gen_random_uuid(), 'circuit-breaker', 'Circuit Breaker', 'Animated circuit board patterns with sparking nodes', 'cyberpunk', 'epic', 4, '{"style": "circuit", "width": 5, "nodeCount": 8}', 'electric', '{"arcFrequency": 0.5, "arcIntensity": 1.0}', '{"type": "spark", "count": 15, "color": "#00ff88"}', '{"color": "#00ff88", "intensity": 1.0, "spread": 15}', 'level', 0, false, true, 12, true, NOW(), NOW()),
    
    -- Fantasy Theme
    (gen_random_uuid(), 'enchanted-vine', 'Enchanted Vine', 'Growing magical vines with glowing flowers', 'fantasy', 'uncommon', 2, '{"style": "organic", "width": 6}', 'grow', '{"speed": 0.5, "looping": true}', '{"type": "sparkle", "count": 10, "color": "#88ff88"}', '{}', 'purchase', 750, true, true, 20, true, NOW(), NOW()),
    (gen_random_uuid(), 'dragon-scale', 'Dragon Scale', 'Iridescent dragon scales that shimmer in firelight', 'fantasy', 'epic', 4, '{"style": "scales", "width": 5, "scaleSize": 8}', 'shimmer', '{"speed": 2, "colors": ["#ff4400", "#ff8800", "#ffcc00"]}', '{"type": "ember", "count": 8}', '{"color": "#ff6600", "intensity": 0.9}', 'achievement', 0, false, true, 21, true, NOW(), NOW()),
    (gen_random_uuid(), 'arcane-runes', 'Arcane Runes', 'Ancient runes that glow and rotate mysteriously', 'fantasy', 'legendary', 6, '{"style": "runic", "width": 6, "runeCount": 12}', 'rotate', '{"speed": 0.2, "direction": "alternate"}', '{"type": "magic", "count": 25, "color": "#aa88ff"}', '{"color": "#8844ff", "intensity": 1.2, "spread": 20}', 'prestige', 0, false, false, 22, true, NOW(), NOW()),
    
    -- Cosmic Theme
    (gen_random_uuid(), 'starfield', 'Starfield', 'Twinkling stars against the void of space', 'cosmic', 'uncommon', 2, '{"style": "space", "width": 5}', 'twinkle', '{"speed": 1, "density": 0.7}', '{"type": "star", "count": 30}', '{}', 'purchase', 600, true, true, 30, true, NOW(), NOW()),
    (gen_random_uuid(), 'nebula-drift', 'Nebula Drift', 'Swirling cosmic clouds in deep space colors', 'cosmic', 'rare', 3, '{"style": "nebula", "width": 6}', 'flow', '{"speed": 0.3, "turbulence": 0.5}', '{"type": "cosmic-dust", "count": 40}', '{"color": "#ff44aa", "intensity": 0.7, "spread": 25}', 'purchase', 1500, true, true, 31, true, NOW(), NOW()),
    (gen_random_uuid(), 'black-hole', 'Event Horizon', 'Light bending around an impossibly dark center', 'cosmic', 'mythic', 8, '{"style": "singularity", "width": 8}', 'distort', '{"intensity": 1.5, "radius": 1.2}', '{"type": "accretion", "count": 50}', '{"color": "#ff8800", "intensity": 1.5, "spread": 30}', 'event', 0, false, false, 32, true, NOW(), NOW()),
    
    -- Elemental Theme
    (gen_random_uuid(), 'flame-ring', 'Flame Ring', 'Dancing flames that never burn out', 'elemental', 'rare', 3, '{"style": "fire", "width": 5}', 'flicker', '{"speed": 3, "intensity": 0.8}', '{"type": "flame", "count": 35, "colors": ["#ff4400", "#ff8800", "#ffcc00"]}', '{"color": "#ff6600", "intensity": 1.0}', 'purchase', 1200, true, true, 40, true, NOW(), NOW()),
    (gen_random_uuid(), 'frost-crystal', 'Frost Crystal', 'Intricate ice crystals forming and reforming', 'elemental', 'rare', 3, '{"style": "ice", "width": 5}', 'crystallize', '{"speed": 0.5, "branches": 6}', '{"type": "snowflake", "count": 20}', '{"color": "#88ddff", "intensity": 0.8}', 'purchase', 1200, true, true, 41, true, NOW(), NOW()),
    (gen_random_uuid(), 'storm-caller', 'Storm Caller', 'Crackling lightning and rolling thunder', 'elemental', 'epic', 5, '{"style": "electric", "width": 6}', 'lightning', '{"frequency": 0.3, "branches": 4}', '{"type": "electric", "count": 15}', '{"color": "#aaddff", "intensity": 1.2, "spread": 18}', 'level', 0, false, true, 42, true, NOW(), NOW()),
    
    -- Premium/Seasonal
    (gen_random_uuid(), 'aurora-borealis', 'Aurora Borealis', 'Northern lights dancing at the edge of your avatar', 'premium', 'legendary', 7, '{"style": "aurora", "width": 8}', 'wave', '{"speed": 0.8, "amplitude": 1.2}', '{"type": "aurora", "count": 60}', '{"color": "#44ffaa", "intensity": 1.3, "spread": 35}', 'battle_pass', 0, false, false, 50, true, NOW(), NOW()),
    (gen_random_uuid(), 'golden-legacy', 'Golden Legacy', 'Pure gold with ancient engravings', 'premium', 'mythic', 9, '{"style": "ornate", "width": 7, "material": "gold"}', 'shimmer', '{"speed": 1.5, "highlights": true}', '{"type": "sparkle", "count": 25, "color": "#ffdd44"}', '{"color": "#ffcc00", "intensity": 1.4}', 'prestige', 0, false, false, 51, true, NOW(), NOW()),
    (gen_random_uuid(), 'void-walker', 'Void Walker', 'Reality tears apart at the seams', 'premium', 'unique', 10, '{"style": "void", "width": 10}', 'tear', '{"intensity": 2.0, "fragments": 12}', '{"type": "void", "count": 100}', '{"color": "#440088", "intensity": 2.0, "spread": 50}', 'airdrop', 0, false, false, 52, true, NOW(), NOW())
    ON CONFLICT DO NOTHING
    """

    # ==================== PROFILE THEMES SEED ====================
    execute """
    INSERT INTO profile_themes (id, slug, name, description, category, rarity, colors, background_config, card_layout, typography, glassmorphism, hover_effects, unlock_type, coin_cost, is_purchasable, is_tradeable, sort_order, is_active, inserted_at, updated_at) VALUES
    -- Minimal Category
    (gen_random_uuid(), 'minimalist-dark', 'Minimalist Dark', 'Clean dark theme with subtle accents', 'minimal', 'common', '{"primary": "#ffffff", "secondary": "#a0a0a0", "accent": "#3b82f6", "background": "#0a0a0a", "surface": "#1a1a1a", "text": "#ffffff"}', '{"type": "solid", "value": "#0a0a0a"}', 'minimal', '{"fontFamily": "Inter", "fontSize": "14px"}', '{"enabled": false}', '{"type": "scale", "intensity": 1.02}', 'default', 0, false, false, 1, true, NOW(), NOW()),
    (gen_random_uuid(), 'paper-white', 'Paper White', 'Crisp white with elegant typography', 'minimal', 'common', '{"primary": "#1a1a1a", "secondary": "#666666", "accent": "#0066cc", "background": "#fafafa", "surface": "#ffffff", "text": "#1a1a1a"}', '{"type": "solid", "value": "#fafafa"}', 'minimal', '{"fontFamily": "Georgia", "fontSize": "15px"}', '{"enabled": false}', '{"type": "none"}', 'purchase', 200, true, true, 2, true, NOW(), NOW()),
    
    -- Vibrant Category
    (gen_random_uuid(), 'cyberpunk-neon', 'Cyberpunk Neon', 'Electric neon colors on dark chrome', 'vibrant', 'rare', '{"primary": "#00ffff", "secondary": "#ff00ff", "accent": "#ffff00", "background": "#0d0d1a", "surface": "#1a1a2e", "text": "#ffffff"}', '{"type": "gradient", "value": "linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%)"}', 'gaming', '{"fontFamily": "Orbitron", "fontSize": "14px", "fontWeight": "bold"}', '{"enabled": true, "blur": 20, "opacity": 0.1}', '{"type": "glow", "color": "#00ffff", "intensity": 0.8}', 'purchase', 1500, true, true, 10, true, NOW(), NOW()),
    (gen_random_uuid(), 'sunset-gradient', 'Sunset Gradient', 'Warm oranges and pinks like a summer sunset', 'vibrant', 'uncommon', '{"primary": "#ffffff", "secondary": "#ffccaa", "accent": "#ff6b6b", "background": "#2d1b4e", "surface": "#3d2b5e", "text": "#ffffff"}', '{"type": "gradient", "value": "linear-gradient(180deg, #ff6b6b 0%, #feca57 50%, #2d1b4e 100%)"}', 'detailed', '{"fontFamily": "Poppins", "fontSize": "14px"}', '{"enabled": true, "blur": 15}', '{"type": "tilt", "intensity": 5}', 'purchase', 800, true, true, 11, true, NOW(), NOW()),
    
    -- Animated Category
    (gen_random_uuid(), 'matrix-rain', 'Matrix Rain', 'Digital rain cascading down your profile', 'animated', 'epic', '{"primary": "#00ff00", "secondary": "#008800", "accent": "#00ff88", "background": "#000000", "surface": "#0a0a0a", "text": "#00ff00"}', '{"type": "animated", "value": "matrix-rain", "config": {"speed": 1, "density": 0.8, "color": "#00ff00"}}', 'gaming', '{"fontFamily": "Fira Code", "fontSize": "14px"}', '{"enabled": false}', '{"type": "glitch", "intensity": 0.3}', 'purchase', 2500, true, true, 20, true, NOW(), NOW()),
    (gen_random_uuid(), 'starfield-journey', 'Starfield Journey', 'Flying through the cosmos', 'animated', 'epic', '{"primary": "#ffffff", "secondary": "#8888ff", "accent": "#ff88ff", "background": "#000011", "surface": "#0a0a1a", "text": "#ffffff"}', '{"type": "animated", "value": "starfield", "config": {"speed": 2, "starCount": 200, "depth": 3}}', 'detailed', '{"fontFamily": "Space Grotesk", "fontSize": "14px"}', '{"enabled": true, "blur": 10, "opacity": 0.15}', '{"type": "scale", "intensity": 1.05}', 'purchase', 2500, true, true, 21, true, NOW(), NOW()),
    
    -- Premium Category
    (gen_random_uuid(), 'holographic-dreams', 'Holographic Dreams', 'Iridescent surfaces that shift with perspective', 'premium', 'legendary', '{"primary": "#ffffff", "secondary": "#ff88ff", "accent": "#88ffff", "background": "#1a0a2e", "surface": "#2a1a3e", "text": "#ffffff"}', '{"type": "shader", "value": "holographic", "config": {"intensity": 1.2, "speed": 0.5}}', 'creator', '{"fontFamily": "Montserrat", "fontSize": "14px", "fontWeight": "500"}', '{"enabled": true, "blur": 25, "opacity": 0.2, "border": "1px solid rgba(255,255,255,0.1)"}', '{"type": "border-animate", "duration": 3}', 'battle_pass', 0, false, false, 30, true, NOW(), NOW()),
    (gen_random_uuid(), 'liquid-gold', 'Liquid Gold', 'Flowing golden gradients with metallic sheen', 'premium', 'legendary', '{"primary": "#1a0a00", "secondary": "#cc9900", "accent": "#ffdd00", "background": "#0a0500", "surface": "#1a0f05", "text": "#ffdd88"}', '{"type": "shader", "value": "liquid-metal", "config": {"color": "#ffcc00", "reflectivity": 0.9}}', 'detailed', '{"fontFamily": "Playfair Display", "fontSize": "15px"}', '{"enabled": true, "blur": 20, "opacity": 0.15}', '{"type": "glow", "color": "#ffcc00", "intensity": 1.0}', 'prestige', 0, false, false, 31, true, NOW(), NOW()),
    
    -- Seasonal Category
    (gen_random_uuid(), 'winter-wonderland', 'Winter Wonderland', 'Snowy landscapes with falling snowflakes', 'seasonal', 'rare', '{"primary": "#ffffff", "secondary": "#88ccff", "accent": "#00aaff", "background": "#0a1a2a", "surface": "#1a2a3a", "text": "#ffffff"}', '{"type": "animated", "value": "snowfall", "config": {"density": 0.6, "windSpeed": 0.3}}', 'social', '{"fontFamily": "Quicksand", "fontSize": "14px"}', '{"enabled": true, "blur": 15, "opacity": 0.2}', '{"type": "scale", "intensity": 1.03}', 'event', 0, false, true, 40, true, NOW(), NOW()),
    (gen_random_uuid(), 'sakura-blossom', 'Sakura Blossom', 'Cherry blossoms drifting on spring breeze', 'seasonal', 'rare', '{"primary": "#4a3030", "secondary": "#ff88aa", "accent": "#ff4488", "background": "#1a0a10", "surface": "#2a1a20", "text": "#ffddee"}', '{"type": "animated", "value": "sakura", "config": {"petalCount": 30, "windSpeed": 0.5}}', 'social', '{"fontFamily": "Noto Serif JP", "fontSize": "14px"}', '{"enabled": true, "blur": 12}', '{"type": "none"}', 'event', 0, false, true, 41, true, NOW(), NOW())
    ON CONFLICT DO NOTHING
    """

    # ==================== CHAT EFFECTS SEED ====================
    execute """
    INSERT INTO chat_effects (id, slug, name, description, effect_type, rarity, effect_id, effect_config, particle_config, sound_config, unlock_type, coin_cost, is_purchasable, is_tradeable, sort_order, is_active, inserted_at, updated_at) VALUES
    -- Message Effects
    (gen_random_uuid(), 'fade-in', 'Fade In', 'Messages gently fade into view', 'message', 'common', 'fade-in', '{"duration": 300, "easing": "ease-out"}', '{}', '{}', 'default', 0, false, false, 1, true, NOW(), NOW()),
    (gen_random_uuid(), 'slide-up', 'Slide Up', 'Messages slide up smoothly', 'message', 'common', 'slide-up', '{"duration": 250, "distance": 20}', '{}', '{}', 'purchase', 100, true, true, 2, true, NOW(), NOW()),
    (gen_random_uuid(), 'bounce-in', 'Bounce In', 'Messages bounce in playfully', 'message', 'uncommon', 'bounce-in', '{"duration": 400, "bounces": 2}', '{}', '{}', 'purchase', 300, true, true, 3, true, NOW(), NOW()),
    (gen_random_uuid(), 'glitch-text', 'Glitch Text', 'Cyberpunk glitch effect on messages', 'message', 'rare', 'glitch', '{"intensity": 0.5, "duration": 500}', '{}', '{}', 'purchase', 800, true, true, 4, true, NOW(), NOW()),
    (gen_random_uuid(), 'rainbow-wave', 'Rainbow Wave', 'Colors ripple through your text', 'message', 'rare', 'rainbow-wave', '{"speed": 2, "saturation": 0.8}', '{}', '{}', 'purchase', 1000, true, true, 5, true, NOW(), NOW()),
    (gen_random_uuid(), 'fire-text', 'Fire Text', 'Your words burn with passion', 'message', 'epic', 'fire-text', '{"intensity": 0.7}', '{"type": "ember", "count": 10}', '{}', 'achievement', 0, false, true, 6, true, NOW(), NOW()),
    (gen_random_uuid(), 'ice-shatter', 'Ice Shatter', 'Messages appear frozen then crack', 'message', 'epic', 'ice-shatter', '{"freezeDuration": 200, "shatterDuration": 300}', '{"type": "ice-shard", "count": 15}', '{}', 'purchase', 1500, true, true, 7, true, NOW(), NOW()),
    
    -- Bubble Styles
    (gen_random_uuid(), 'bubble-default', 'Classic Bubble', 'Standard message bubble', 'bubble', 'common', 'bubble-default', '{"borderRadius": 18, "padding": 12}', '{}', '{}', 'default', 0, false, false, 20, true, NOW(), NOW()),
    (gen_random_uuid(), 'bubble-rounded', 'Rounded Bubble', 'Extra round bubble style', 'bubble', 'common', 'bubble-rounded', '{"borderRadius": 24, "padding": 14}', '{}', '{}', 'purchase', 150, true, true, 21, true, NOW(), NOW()),
    (gen_random_uuid(), 'bubble-sharp', 'Sharp Edge', 'Modern sharp corners', 'bubble', 'common', 'bubble-sharp', '{"borderRadius": 4, "padding": 12}', '{}', '{}', 'purchase', 150, true, true, 22, true, NOW(), NOW()),
    (gen_random_uuid(), 'bubble-neon', 'Neon Glow', 'Glowing neon border bubble', 'bubble', 'rare', 'bubble-neon', '{"borderRadius": 12, "glowColor": "#00ffff", "glowIntensity": 0.8}', '{}', '{}', 'purchase', 600, true, true, 23, true, NOW(), NOW()),
    (gen_random_uuid(), 'bubble-gradient', 'Gradient Bubble', 'Beautiful gradient background', 'bubble', 'rare', 'bubble-gradient', '{"gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}', '{}', '{}', 'purchase', 700, true, true, 24, true, NOW(), NOW()),
    (gen_random_uuid(), 'bubble-glass', 'Glassmorphism', 'Frosted glass effect', 'bubble', 'epic', 'bubble-glass', '{"blur": 20, "opacity": 0.15, "border": "1px solid rgba(255,255,255,0.2)"}', '{}', '{}', 'purchase', 1200, true, true, 25, true, NOW(), NOW()),
    
    -- Typing Indicators
    (gen_random_uuid(), 'typing-dots', 'Classic Dots', 'Three bouncing dots', 'typing', 'common', 'typing-dots', '{"dotCount": 3, "animationSpeed": 0.6}', '{}', '{}', 'default', 0, false, false, 40, true, NOW(), NOW()),
    (gen_random_uuid(), 'typing-wave', 'Wave Dots', 'Dots in a wave pattern', 'typing', 'uncommon', 'typing-wave', '{"dotCount": 3, "waveHeight": 8}', '{}', '{}', 'purchase', 200, true, true, 41, true, NOW(), NOW()),
    (gen_random_uuid(), 'typing-pulse', 'Pulse Ring', 'Pulsing circle indicator', 'typing', 'uncommon', 'typing-pulse', '{"pulseSpeed": 1.2, "ringCount": 2}', '{}', '{}', 'purchase', 250, true, true, 42, true, NOW(), NOW()),
    (gen_random_uuid(), 'typing-keyboard', 'Mini Keyboard', 'Tiny animated keyboard', 'typing', 'rare', 'typing-keyboard', '{"keyCount": 4}', '{}', '{"url": "/sounds/keyboard-soft.mp3", "volume": 0.2}', 'purchase', 500, true, true, 43, true, NOW(), NOW()),
    (gen_random_uuid(), 'typing-pencil', 'Pencil Writing', 'Animated pencil writing', 'typing', 'rare', 'typing-pencil', '{"speed": 1.5}', '{}', '{}', 'purchase', 500, true, true, 44, true, NOW(), NOW()),
    
    -- Reaction Effects
    (gen_random_uuid(), 'reaction-pop', 'Pop', 'Reactions pop in with scale', 'reaction', 'common', 'reaction-pop', '{"scale": 1.5, "duration": 200}', '{}', '{}', 'default', 0, false, false, 60, true, NOW(), NOW()),
    (gen_random_uuid(), 'reaction-bounce', 'Bounce', 'Bouncy reaction animation', 'reaction', 'uncommon', 'reaction-bounce', '{"bounceHeight": 15, "duration": 400}', '{}', '{}', 'purchase', 200, true, true, 61, true, NOW(), NOW()),
    (gen_random_uuid(), 'reaction-explode', 'Explode', 'Reactions burst with particles', 'reaction', 'rare', 'reaction-explode', '{"particleCount": 12}', '{"type": "confetti", "count": 20}', '{}', 'purchase', 600, true, true, 62, true, NOW(), NOW()),
    (gen_random_uuid(), 'reaction-hearts', 'Heart Burst', 'Hearts float up on love reactions', 'reaction', 'rare', 'reaction-hearts', '{"heartCount": 8, "floatDuration": 1500}', '{"type": "heart", "count": 8}', '{}', 'purchase', 700, true, true, 63, true, NOW(), NOW()),
    
    -- Entrance Effects
    (gen_random_uuid(), 'entrance-normal', 'Normal', 'Standard entrance animation', 'entrance', 'common', 'entrance-normal', '{"duration": 200}', '{}', '{}', 'default', 0, false, false, 80, true, NOW(), NOW()),
    (gen_random_uuid(), 'entrance-spotlight', 'Spotlight', 'Dramatic spotlight entrance', 'entrance', 'epic', 'entrance-spotlight', '{"beamWidth": 100, "duration": 800}', '{}', '{}', 'purchase', 1500, true, true, 81, true, NOW(), NOW()),
    (gen_random_uuid(), 'entrance-teleport', 'Teleport', 'Sci-fi teleporter effect', 'entrance', 'epic', 'entrance-teleport', '{"particleCount": 50, "duration": 600}', '{"type": "energy", "count": 50}', '{"url": "/sounds/teleport.mp3", "volume": 0.3}', 'purchase', 2000, true, true, 82, true, NOW(), NOW()),
    (gen_random_uuid(), 'entrance-fire', 'Flame Arrival', 'Arrive in a burst of flames', 'entrance', 'legendary', 'entrance-fire', '{"intensity": 1.2}', '{"type": "flame", "count": 80}', '{"url": "/sounds/fire-whoosh.mp3", "volume": 0.25}', 'prestige', 0, false, false, 83, true, NOW(), NOW())
    ON CONFLICT DO NOTHING
    """

    # ==================== PRESTIGE REWARDS SEED ====================
    execute """
    INSERT INTO prestige_rewards (id, prestige_level, reward_type, name, description, is_exclusive, sort_order, inserted_at, updated_at) VALUES
    (gen_random_uuid(), 1, 'border', 'Prestige I Frame', 'Bronze prestige avatar border', true, 1, NOW(), NOW()),
    (gen_random_uuid(), 1, 'title', 'Ascended', 'The Ascended title for Prestige I', true, 2, NOW(), NOW()),
    (gen_random_uuid(), 1, 'points', '+500 Prestige Points', '+500 prestige points bonus', false, 3, NOW(), NOW()),
    (gen_random_uuid(), 2, 'border', 'Prestige II Frame', 'Silver prestige avatar border', true, 10, NOW(), NOW()),
    (gen_random_uuid(), 2, 'title', 'Transcended', 'The Transcended title for Prestige II', true, 11, NOW(), NOW()),
    (gen_random_uuid(), 2, 'effect', 'Prestige Aura', 'Subtle prestige glow effect', true, 12, NOW(), NOW()),
    (gen_random_uuid(), 3, 'border', 'Prestige III Frame', 'Gold prestige avatar border', true, 20, NOW(), NOW()),
    (gen_random_uuid(), 3, 'theme', 'Prestige Legacy', 'Exclusive prestige profile theme', true, 21, NOW(), NOW()),
    (gen_random_uuid(), 3, 'title', 'Eternal', 'The Eternal title for Prestige III', true, 22, NOW(), NOW()),
    (gen_random_uuid(), 5, 'border', 'Prestige V Frame', 'Platinum prestige avatar border with particles', true, 30, NOW(), NOW()),
    (gen_random_uuid(), 5, 'effect', 'Legendary Entrance', 'Epic entrance animation', true, 31, NOW(), NOW()),
    (gen_random_uuid(), 10, 'border', 'Prestige X Frame', 'Diamond prestige avatar border - ultimate', true, 40, NOW(), NOW()),
    (gen_random_uuid(), 10, 'title', 'Immortal', 'The Immortal title - highest honor', true, 41, NOW(), NOW()),
    (gen_random_uuid(), 10, 'theme', 'Prestige Infinity', 'Animated cosmic prestige theme', true, 42, NOW(), NOW())
    ON CONFLICT DO NOTHING
    """
  end

  def down do
    execute "DELETE FROM prestige_rewards"
    execute "DELETE FROM chat_effects"
    execute "DELETE FROM profile_themes"
    execute "DELETE FROM avatar_borders"
  end
end
