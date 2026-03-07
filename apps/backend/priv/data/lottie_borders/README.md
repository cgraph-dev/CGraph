# Lottie Border Assets

This directory stores the manifest and metadata for Lottie-based avatar border animations.

## How It Works

Lottie borders are circular animations that wrap around user avatars. They're rendered using
`lottie-web` (web) or `lottie-react-native` (mobile), masked into a ring shape using CSS `clip-path`
and `radial-gradient`.

## Adding a New Lottie Border

### 1. Create the Animation

- **Format:** Lottie JSON (After Effects → Bodymovin plugin, or LottieFiles)
- **Canvas:** Square aspect ratio (e.g., 512×512)
- **Content:** Animation fills a circle inscribed within the square
- **Background:** Transparent
- **Duration:** 1–5 seconds, looping
- **File size:** Target < 100KB (max 200KB)
- **Frame rate:** 30fps or 60fps

### 2. Test the Animation

Preview the border using the LottieBorderRenderer component:

```tsx
<LottieBorderRenderer
  lottieUrl="/path/to/border.json"
  avatarSize={96}
  borderWidth={4}
  lottieConfig={{ loop: true, speed: 1.0 }}
>
  <img src={avatarUrl} alt="avatar" />
</LottieBorderRenderer>
```

### 3. Register in manifest.json

Add an entry to `manifest.json`:

```json
{
  "id": "unique-slug",
  "name": "Display Name",
  "rarity": "common|rare|epic|legendary|mythic",
  "theme": "elemental|nature|cyber|space|seasonal|...",
  "animation_type": "lottie",
  "source": "cdn",
  "lottie_path": "unique-slug.json",
  "preview_path": "unique-slug-preview.webp",
  "config": { "loop": true, "speed": 1.0 },
  "unlock_condition": "level_XX|seasonal_YY|achievement_ZZ",
  "price_coins": 0
}
```

### 4. Upload to CDN

Upload the Lottie JSON and preview WebP to the CDN (S3/R2):

- `https://cdn.cgraph.org/borders/{slug}.json`
- `https://cdn.cgraph.org/borders/{slug}-preview.webp`

### 5. Seed the Database

Run the seed task to register the border in the `avatar_borders` table:

```bash
mix cgraph.borders.seed
```

## Performance Budget

- **Max concurrent:** 2 Lottie border animations visible in viewport at once
- **Auto-pause:** Borders scrolled out of view pause their animation
- **Reduced motion:** Falls back to static CSS border ring
- **Canvas renderer:** Used for avatars < 64px; SVG for 64px+

## Migration from CSS Borders

Existing CSS-animated borders (pulse, rotate, shimmer, particles, etc.) are **not** being replaced.
Lottie borders are a new animation type alongside existing CSS borders. Users who have CSS borders
equipped will continue to see them.

New borders should prefer Lottie over CSS for richer effects that CSS cannot achieve (fire,
lightning, aurora, etc.).
