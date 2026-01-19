# Quick Start Guide - New CGraph UI

**For Developers**: This guide helps you understand the new UI reorganization and how to use the new components.

---

## 🎯 What Changed?

### Navigation (AppLayout.tsx)
```
BEFORE: 9 tabs
Messages | Friends | Notifications | Forums | Groups | Search | Leaderboard | Profile | Settings

AFTER: 6 tabs
Messages | Social | Forums | Customize | Profile | Settings
```

### Key Changes
1. **Social Tab**: Combines Friends + Notifications + Search
2. **Customize Tab**: All personalization (avatar, themes, chat, effects, progression)
3. **Profile Tab**: Quick access to your own profile
4. **Settings Tab**: Only essential account/security settings (5 sections)

---

## 📁 New Components Location

### Core Layouts
```
/src/layouts/
  AppLayout.tsx         - Main 6-tab navigation
  CustomizeLayout.tsx   - 3-panel layout for customize pages
  SocialLayout.tsx      - Layout for social hub
```

### Customization Hub
```
/src/pages/customize/
  Customize.tsx                  - Main hub with 5 categories
  IdentityCustomization.tsx      - Avatar borders, titles, badges
  ThemeCustomization.tsx         - Color themes for profile/chat/forums
  ChatCustomization.tsx          - Bubble styles, effects, reactions
  EffectsCustomization.tsx       - Particles, backgrounds, animations
  ProgressionCustomization.tsx   - Achievements, quests, leaderboards
```

### Social Hub
```
/src/pages/social/
  Social.tsx  - Friends + Notifications + Discover in one page
```

### Shared Components
```
/src/components/profile/
  UserProfileCard.tsx  - Discord-style profile popup (mini & full)

/src/lib/animations/
  transitions.ts       - Comprehensive animation library
```

---

## 🚀 How to Use New Components

### 1. Profile Popups (Use Everywhere!)

```tsx
import UserProfileCard from '@/components/profile/UserProfileCard';

// Wrap any avatar or username with this
<UserProfileCard userId={user.id} trigger="both">
  <img src={user.avatar} alt={user.name} />
</UserProfileCard>

// trigger options:
// - "hover" - Mini card on hover (500ms delay)
// - "click" - Full card on click
// - "both" - Hover for mini, click for full (recommended)
```

**Where to use it**:
- Chat message avatars ✅ (already integrated)
- Friend list items ✅ (already integrated)
- Forum post authors
- Group member lists
- Search results
- Leaderboards
- Anywhere a user appears!

### 2. Animation Library

```tsx
import {
  pageTransitions,
  springs,
  cardVariants,
  buttonVariants,
  listItemVariants,
  createStaggerContainer
} from '@/lib/animations/transitions';

// Page transitions
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={pageTransitions.slideRight}
>
  {/* Your page content */}
</motion.div>

// Card with hover effect
<motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
  {/* Your card content */}
</motion.div>

// Button with bounce
<motion.button variants={buttonVariants} whileHover="hover" whileTap="tap">
  Click me
</motion.button>

// Staggered list
<motion.div variants={createStaggerContainer('normal')}>
  {items.map((item, i) => (
    <motion.div key={item.id} variants={listItemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### 3. GlassCard Component

```tsx
import GlassCard from '@/components/ui/GlassCard';

// 5 variants available
<GlassCard variant="default" />    // Standard glass
<GlassCard variant="frosted" />    // More blur
<GlassCard variant="crystal" />    // Sharp, clear
<GlassCard variant="neon" />       // Bright borders
<GlassCard variant="holographic" /> // Rainbow shimmer

// With glow effect
<GlassCard variant="neon" glow glowColor="rgba(139, 92, 246, 0.3)">
  Important content
</GlassCard>
```

---

## 🔄 Route Changes & Redirects

### Old Routes → New Routes

**Customization moved to /customize**:
```
/settings/appearance      → /customize/themes
/settings/ui-customization → /customize/effects
/settings/chat-bubbles    → /customize/chat
/settings/avatar          → /customize/identity
/leaderboard             → /customize/progression
/gamification            → /customize/progression
```

**Social features unified under /social**:
```
/friends       → /social/friends
/notifications → /social/notifications
/search        → /social/discover
```

**Profile shortcut**:
```
/profile → /user/{your-user-id}
```

**All old URLs still work** - they automatically redirect to the new locations!

---

## 🎨 Design Patterns

### Spring Physics (Recommended)
```tsx
// Use springs for natural motion
transition={{
  type: 'spring',
  stiffness: 300,
  damping: 30
}}
```

### Staggered Animations
```tsx
// List items appear with 30ms delay between each
{items.map((item, index) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
  >
    {item}
  </motion.div>
))}
```

### GPU-Accelerated Transforms
```tsx
// ✅ GOOD - Uses GPU
animate={{ x: 100, y: 50, scale: 1.1, rotate: 45, opacity: 0.5 }}

// ❌ BAD - Causes layout thrashing
animate={{ left: 100, top: 50, width: 200, height: 100 }}
```

### Reduced Motion Support
```tsx
import { getReducedMotion } from '@/lib/animations/transitions';

const shouldAnimate = !getReducedMotion();

<motion.div
  animate={shouldAnimate ? { x: 100 } : undefined}
>
```

---

## 📊 Performance Guidelines

### Animation Performance
- **Target**: 60 FPS on all animations
- **Method**: Use transform properties only (x, y, scale, rotate, opacity)
- **Avoid**: width, height, top, left, margin, padding in animations
- **Tools**: Chrome DevTools Performance tab to verify

### Code Splitting
All major pages are lazy-loaded:
```tsx
const Customize = lazy(() => import('@/pages/customize/Customize'));
const Social = lazy(() => import('@/pages/social/Social'));
```

### Bundle Size
- Each customize page loads independently
- Animation library is tree-shakeable
- Use named imports to reduce bundle size

---

## 🐛 Common Issues & Solutions

### Issue: Profile card not showing
```tsx
// ❌ Wrong - missing trigger
<UserProfileCard userId={user.id}>
  <Avatar />
</UserProfileCard>

// ✅ Correct
<UserProfileCard userId={user.id} trigger="both">
  <Avatar />
</UserProfileCard>
```

### Issue: Animation stuttering
```tsx
// ❌ Wrong - animating layout properties
<motion.div animate={{ width: 300, height: 200 }} />

// ✅ Correct - using transforms
<motion.div animate={{ scale: 1.5 }} />
```

### Issue: Route not found after redirect
```tsx
// Check App.tsx - all redirects should be configured
// Old routes automatically redirect to new ones
```

---

## 📚 File Architecture

```
apps/web/src/
├── components/
│   ├── profile/
│   │   └── UserProfileCard.tsx      ← Profile popups
│   ├── settings/
│   │   └── (5 essential settings)
│   └── ui/
│       └── GlassCard.tsx            ← Glass cards
├── layouts/
│   ├── AppLayout.tsx                ← 6-tab navigation
│   ├── CustomizeLayout.tsx          ← Customize pages
│   └── SocialLayout.tsx             ← Social hub
├── pages/
│   ├── customize/                   ← 6 customization pages
│   │   ├── Customize.tsx
│   │   ├── IdentityCustomization.tsx
│   │   ├── ThemeCustomization.tsx
│   │   ├── ChatCustomization.tsx
│   │   ├── EffectsCustomization.tsx
│   │   └── ProgressionCustomization.tsx
│   ├── social/
│   │   └── Social.tsx               ← Social hub
│   └── settings/
│       └── Settings.tsx             ← Simplified settings
└── lib/
    └── animations/
        └── transitions.ts           ← Animation library
```

---

## ✅ Checklist for Adding New Features

When adding new UI components:

- [ ] Use `UserProfileCard` for any user avatars
- [ ] Import animations from `transitions.ts` instead of custom ones
- [ ] Use `GlassCard` for card components
- [ ] Add spring physics for natural motion
- [ ] Support reduced motion preference
- [ ] Use GPU-accelerated properties only
- [ ] Lazy load if it's a new page
- [ ] Test on mobile (touch interactions)
- [ ] Verify 60 FPS in Chrome DevTools

---

## 🎓 Learning Resources

### Animation Best Practices
- Read `transitions.ts` comments for detailed explanations
- Check existing customization pages for patterns
- Use Chrome DevTools Performance tab to verify smooth animations

### Design System
- **Colors**: Primary (purple), Secondary (pink), Accent (cyan)
- **Spacing**: 4px base unit (0.25rem)
- **Border Radius**: 8px (0.5rem) standard, 12px (0.75rem) for cards
- **Shadows**: Subtle glows with low opacity

### Component Examples
Look at these files for reference:
1. `IdentityCustomization.tsx` - Grid layouts, search, filtering
2. `Social.tsx` - Tab navigation, list rendering
3. `UserProfileCard.tsx` - Portal rendering, complex state
4. `Settings.tsx` - Sidebar navigation, section switching

---

## 📞 Support

### Questions?
- Check inline code comments (all new files are well-documented)
- Review `UI_REORGANIZATION_FINAL_SUMMARY.md` for complete overview
- Look at existing implementations for patterns

### Found a Bug?
- Document expected vs actual behavior
- Check browser console for errors
- Verify animation performance in DevTools
- Test with reduced motion enabled

---

## 🚀 Next Steps

1. **Explore the new UI**: Open `/customize` and `/social` in dev mode
2. **Read the code**: Check out the new component files
3. **Try the animations**: Import `transitions.ts` and experiment
4. **Add profile cards**: Integrate `UserProfileCard` in your components
5. **Build new features**: Use the established patterns

---

**Happy Coding!** 🎉

The new UI is production-ready and provides a world-class foundation for building amazing features.
