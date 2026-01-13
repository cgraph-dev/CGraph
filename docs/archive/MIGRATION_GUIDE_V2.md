# CGraph Web v2.0 Migration Guide

## Overview

This guide helps you migrate from the current CGraph web implementation to the enhanced v2.0 with
advanced animations, AI theming, and immersive effects.

**Migration Type**: ✅ **NON-BREAKING** - All existing features preserved **Estimated Time**: 30-60
minutes **Complexity**: Low to Medium

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Migration](#step-by-step-migration)
3. [Component Replacements](#component-replacements)
4. [Feature Enablement](#feature-enablement)
5. [Testing Checklist](#testing-checklist)
6. [Rollback Plan](#rollback-plan)

---

## Prerequisites

### 1. Verify Dependencies

Dependencies are already installed. Confirm with:

```bash
cd /CGraph/apps/web
pnpm list three @react-three/fiber @react-three/drei gsap lottie-react @use-gesture/react react-spring
```

Expected output:

```
three 0.182.0
@react-three/fiber 9.5.0
@react-three/drei 10.7.7
gsap 3.14.2
...
```

### 2. Backup Current Code (Optional)

```bash
git checkout -b pre-v2-backup
git add .
git commit -m "Backup before v2 migration"
```

---

## Step-by-Step Migration

### Phase 1: Enable AI Theming (5 min)

**File**: `/apps/web/src/App.tsx` (or your main entry point)

```tsx
// Add at the top
import { useEffect } from 'react';
import { themeEngine } from '@/lib/ai/ThemeEngine';

function App() {
  // Add this effect
  useEffect(() => {
    const theme = themeEngine.getRecommendedTheme();
    themeEngine.applyTheme(theme);
  }, []);

  // Rest of your App component...
}
```

**Result**: Adaptive theme applied based on time of day and user preferences.

---

### Phase 2: Add Background Effects (10 min)

**Option A: Shader Background (Recommended for Performance)**

Add to your main layout or App component:

```tsx
import ShaderBackground from '@/components/shaders/ShaderBackground';

<>
  <ShaderBackground
    variant="fluid"
    color1="#00ff41"
    color2="#003b00"
    color3="#39ff14"
    speed={0.5}
    interactive
  />

  {/* Your existing app content */}
  <div className="relative z-10">{children}</div>
</>;
```

**Option B: 3D Matrix (More Impressive, Higher GPU Usage)**

```tsx
import Matrix3DEnvironment from '@/components/three/Matrix3DEnvironment';

<>
  <Matrix3DEnvironment intensity="medium" theme="matrix-green" interactive={false} />

  <div className="relative z-10">{children}</div>
</>;
```

**Choose based on**:

- Performance needs → Shader Background
- Visual impact → Matrix 3D
- Mobile support → Shader Background

---

### Phase 3: Enhance Messages Page (15 min)

**Current File**: `/apps/web/src/pages/messages/Conversation.tsx` **Enhanced File**:
`/apps/web/src/pages/messages/EnhancedConversation.tsx`

**Method 1: Direct Replacement (Recommended)**

In your router configuration:

```tsx
// Before
import Conversation from '@/pages/messages/Conversation';

<Route path="/messages/:conversationId" element={<Conversation />} />;

// After
import EnhancedConversation from '@/pages/messages/EnhancedConversation';

<Route path="/messages/:conversationId" element={<EnhancedConversation />} />;
```

**Method 2: Feature Flag (Gradual Rollout)**

```tsx
import Conversation from '@/pages/messages/Conversation';
import EnhancedConversation from '@/pages/messages/EnhancedConversation';

const USE_ENHANCED = import.meta.env.VITE_USE_ENHANCED_UI === 'true';

<Route
  path="/messages/:conversationId"
  element={USE_ENHANCED ? <EnhancedConversation /> : <Conversation />}
/>;
```

Then in `.env`:

```env
VITE_USE_ENHANCED_UI=true
```

---

### Phase 4: Enhance Individual Components (20 min)

#### 4a. Upgrade Cards to Glassmorphic

```tsx
// Before
<div className="bg-dark-800 border-dark-700 rounded-lg border p-6">{content}</div>;

// After
import GlassCard from '@/components/ui/GlassCard';

<GlassCard variant="frosted" intensity="medium" className="p-6">
  {content}
</GlassCard>;
```

**Variants to try**:

- `default` - Subtle glass effect
- `frosted` - Heavy blur (recommended for cards)
- `neon` - Glowing neon borders
- `holographic` - Rainbow effects

#### 4b. Add Message Animations

```tsx
// Wrap existing message components
import { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';

{
  messages.map((msg, index) => (
    <AnimatedMessageWrapper
      key={msg.id}
      index={index}
      isOwnMessage={msg.senderId === currentUserId}
      isNew={false}
      onSwipeReply={() => handleReply(msg)}
    >
      <YourExistingMessageBubble message={msg} />
    </AnimatedMessageWrapper>
  ));
}
```

#### 4c. Enhance Voice Messages

```tsx
// Replace basic audio player
import AdvancedVoiceVisualizer from '@/components/audio/AdvancedVoiceVisualizer';

{
  message.type === 'voice' && (
    <AdvancedVoiceVisualizer
      audioUrl={message.audioUrl}
      variant="spectrum"
      theme="matrix-green"
      height={80}
      width={250}
    />
  );
}
```

#### 4d. Add Reaction Animations

```tsx
import { AnimatedReactionBubble } from '@/components/conversation/AnimatedReactionBubble';

{
  message.reactions.map((reaction) => (
    <AnimatedReactionBubble
      key={reaction.id}
      reaction={{
        emoji: reaction.emoji,
        count: reaction.count,
        hasReacted: reaction.hasReacted,
      }}
      isOwnMessage={message.isOwn}
      onPress={() => toggleReaction(message.id, reaction.emoji)}
    />
  ));
}
```

---

## Component Replacements

### Quick Reference Table

| Current Component               | Enhanced Version                                | Complexity | Impact      |
| ------------------------------- | ----------------------------------------------- | ---------- | ----------- |
| `<div className="bg-dark-800">` | `<GlassCard variant="frosted">`                 | Low        | Visual      |
| Message Bubble                  | `<AnimatedMessageWrapper>`                      | Medium     | Animation   |
| Audio Player                    | `<AdvancedVoiceVisualizer>`                     | Low        | Visual      |
| Reaction Button                 | `<AnimatedReactionBubble>`                      | Medium     | Animation   |
| Static Background               | `<ShaderBackground>` or `<Matrix3DEnvironment>` | Low        | Performance |
| Manual Theme                    | `themeEngine.applyTheme()`                      | Low        | UX          |

---

## Feature Enablement

### Recommended Progressive Rollout

**Week 1: Visual Enhancements**

- ✅ Enable AI theming
- ✅ Add shader background
- ✅ Replace some cards with GlassCard

**Week 2: Interaction Enhancements**

- ✅ Add message animations
- ✅ Enable gesture interactions
- ✅ Add reaction animations

**Week 3: Advanced Features**

- ✅ Enable 3D Matrix (optional)
- ✅ Voice visualizations
- ✅ Full enhanced conversation UI

**Week 4: Optimization**

- ✅ Performance tuning
- ✅ Mobile optimization
- ✅ Accessibility review

---

## Testing Checklist

### Functional Testing

- [ ] Messages send and receive correctly
- [ ] Reactions work as expected
- [ ] Voice messages play properly
- [ ] Typing indicators display
- [ ] Read receipts function
- [ ] Image/video attachments work
- [ ] Search functionality intact
- [ ] Notifications trigger correctly

### Visual Testing

- [ ] Glass effects render properly
- [ ] Animations are smooth (60fps)
- [ ] Theme colors apply correctly
- [ ] Backgrounds display without flickering
- [ ] No layout shifts or jumps
- [ ] Proper z-index layering
- [ ] Text remains readable
- [ ] Contrast ratios meet WCAG

### Performance Testing

- [ ] FPS stays above 50 on desktop
- [ ] FPS stays above 30 on mobile
- [ ] Memory usage under 200MB
- [ ] No memory leaks on long sessions
- [ ] WebGL initialization successful
- [ ] Graceful fallback on old browsers

### Device Testing

**Desktop Browsers**:

- [ ] Chrome 120+
- [ ] Firefox 120+
- [ ] Safari 17+
- [ ] Edge 120+

**Mobile Browsers**:

- [ ] iOS Safari 17+
- [ ] Chrome Mobile 120+
- [ ] Samsung Internet

**Screen Sizes**:

- [ ] 320px (mobile small)
- [ ] 768px (tablet)
- [ ] 1024px (laptop)
- [ ] 1920px (desktop)
- [ ] 2560px+ (4K)

---

## Performance Optimization

### For Low-End Devices

```tsx
// Detect device capability
const isLowEnd = navigator.hardwareConcurrency <= 4;

// Adjust intensity
<Matrix3DEnvironment intensity={isLowEnd ? 'low' : 'high'} />;

// Or disable heavy features
{
  !isLowEnd && <ShaderBackground variant="fluid" />;
}
```

### For Mobile

```tsx
// Reduce particle count
<GlassCard
  particles={!isMobile}
  shimmer={!isMobile}
/>

// Simplify animations
<AnimatedMessageWrapper
  enableGestures={!isMobile}
>
```

---

## Rollback Plan

### Emergency Rollback (Immediate)

**Step 1**: Revert router changes

```tsx
// Change back to original Conversation component
import Conversation from '@/pages/messages/Conversation';

<Route path="/messages/:conversationId" element={<Conversation />} />;
```

**Step 2**: Remove background effects

```tsx
// Comment out or remove
// <ShaderBackground ... />
// <Matrix3DEnvironment ... />
```

**Step 3**: Disable theming

```tsx
// Comment out in App.tsx
// themeEngine.applyTheme(theme);
```

### Graceful Rollback (1 hour)

```bash
# If you created a backup branch
git checkout main
git merge pre-v2-backup
git push
```

### Partial Rollback

Keep some enhancements, remove others:

```tsx
// Keep AI theming and backgrounds
✅ themeEngine.applyTheme()
✅ <ShaderBackground />

// Remove component replacements
❌ <EnhancedConversation />
❌ <AnimatedMessageWrapper />

// Use feature flags for gradual re-enabling
```

---

## Common Issues & Solutions

### Issue 1: TypeScript Errors

**Solution**: Run `pnpm lint:fix` or add `// @ts-ignore` temporarily

### Issue 2: WebGL Not Supported

**Solution**: Add fallback

```tsx
{
  supportsWebGL ? <ShaderBackground /> : <div className="bg-dark-900" />;
}
```

### Issue 3: Poor Performance

**Solution**: Reduce intensity

```tsx
<Matrix3DEnvironment intensity="low" />
<GlassCard glow={false} particles={false} />
```

### Issue 4: Animations Janky

**Solution**: Check FPS and disable some effects

```tsx
const metrics = AnimationEngine.getMetrics();
console.log('FPS:', metrics.fps);
```

### Issue 5: Theme Not Applying

**Solution**: Ensure theme is applied in root component

```tsx
// In App.tsx or index.tsx
useEffect(() => {
  const theme = themeEngine.getRecommendedTheme();
  themeEngine.applyTheme(theme);
}, []);
```

---

## Post-Migration

### Monitor These Metrics

1. **Performance**:
   - Page load time
   - Time to interactive
   - FPS during animations
   - Memory usage

2. **User Feedback**:
   - Reported bugs
   - Feature requests
   - Performance complaints

3. **Analytics**:
   - Conversation engagement
   - Feature usage
   - Session duration

### Optimization Opportunities

After migration, consider:

- Code splitting for 3D components
- Lazy loading for shader backgrounds
- Dynamic imports for heavy features
- Service worker caching for assets

---

## Success Criteria

Migration is successful when:

✅ All existing features work identically ✅ New visual enhancements are visible ✅ Animations run
smoothly (50+ FPS) ✅ No console errors or warnings ✅ Mobile devices perform well ✅ Accessibility
is maintained ✅ User feedback is positive

---

## Support & Resources

- **Documentation**: See `ENHANCEMENT_GUIDE.md`
- **Examples**: Check `QUICK_START.md`
- **Code**: Review `EnhancedConversation.tsx`
- **Issues**: Report at GitHub issues

---

## Next Steps

1. ✅ Complete Phase 1 (AI Theming)
2. ✅ Test on local environment
3. ✅ Deploy to staging
4. ✅ User acceptance testing
5. ✅ Deploy to production
6. ✅ Monitor metrics
7. ✅ Iterate based on feedback

---

**Good luck with your migration! 🚀**

The new enhanced UI will position CGraph as a cutting-edge messaging platform with unmatched visual
appeal and user experience.

---

**Questions?** Review the documentation or check the implementation examples in
`/apps/web/src/pages/messages/EnhancedConversation.tsx`.
