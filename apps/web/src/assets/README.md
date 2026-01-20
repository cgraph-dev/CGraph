# CGraph Web Assets

This folder contains all static assets for the CGraph web application. AI agents and developers can
easily find and use these resources.

## 📁 Folder Structure

```
assets/
├── fonts/           # Custom font files (.woff, .woff2, .ttf, .otf)
├── images/          # Images and graphics (.png, .jpg, .svg, .webp)
├── videos/          # Video files (.mp4, .webm)
├── icons/           # Icon files and icon fonts
├── audio/           # Audio files (.mp3, .wav, .ogg)
└── files/           # Other static files (PDFs, documents, etc.)
```

## 🔤 Fonts (`/fonts`)

Place custom font files here. Supported formats:

- `.woff2` (recommended - best compression)
- `.woff` (wide browser support)
- `.ttf` (TrueType)
- `.otf` (OpenType)

### Usage in CSS:

```css
@font-face {
  font-family: 'CustomFont';
  src:
    url('@/assets/fonts/custom-font.woff2') format('woff2'),
    url('@/assets/fonts/custom-font.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

## 🖼️ Images (`/images`)

Store images organized by feature/section:

- `images/hero/` - Hero section backgrounds
- `images/features/` - Feature section graphics
- `images/logos/` - Brand logos and marks
- `images/backgrounds/` - Background patterns/textures
- `images/avatars/` - User avatar placeholders

### Usage in React:

```tsx
import heroImage from '@/assets/images/hero/background.webp';
<img src={heroImage} alt="Hero background" />;
```

## 🎬 Videos (`/videos`)

Video files for backgrounds, demos, etc.

- Use `.mp4` for wide compatibility
- Use `.webm` for better compression

### Usage in React:

```tsx
import demoVideo from '@/assets/videos/demo.mp4';
<video src={demoVideo} autoPlay muted loop playsInline />;
```

## 🎵 Audio (`/audio`)

Audio files for notifications, effects, etc.

## 📄 Files (`/files`)

Other static files like PDFs, JSON data, etc.

---

## AI Agent Instructions

When adding new assets:

1. Place files in the appropriate subfolder
2. Use descriptive, kebab-case filenames (e.g., `hero-background.webp`)
3. Optimize images before adding (use WebP for photos, SVG for icons)
4. For videos, provide both .mp4 and .webm versions when possible
5. Update this README if adding new asset categories
