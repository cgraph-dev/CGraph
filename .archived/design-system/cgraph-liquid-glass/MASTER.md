# CGraph Liquid Glass Design System — MASTER

> **Tag:** `cgraph-liquid-glass-v1`
> **Generated:** 2026-03-04
> **Stack:** React 19 + Tailwind CSS + Framer Motion 12 + CVA
> **Mode:** Light (pearl-white)

> **RULE:** When building a specific page, first check `design-system/cgraph-liquid-glass/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. Otherwise, follow the rules below strictly.

---

## 1. Visual Identity

| Property | Value |
|----------|-------|
| **Style** | Liquid Glass — translucent frosted surfaces with iridescent pastel edge glows |
| **Background** | Pearl-white `rgb(250 250 252)` — never pure white |
| **Surface** | `bg-white/[0.72]` + `backdrop-blur-[20px]` + `backdrop-saturate-[1.6]` |
| **Elevated Surface** | `bg-white/[0.82]` + `backdrop-blur-[24px]` + `backdrop-saturate-[1.8]` |
| **Border** | `border-slate-200/60` — subtle, never heavy |
| **Border Radius** | Large panels `20px` · Small elements `12px` · Chips/badges `8px` |
| **Typography** | Inter 300/400/500/600 — spatial, legible, clean |
| **Icon Set** | Lucide React (SVG only — **never emoji**) |

---

## 2. Color Tokens

### Surface & Text

| Token | RGB Value | Tailwind | Usage |
|-------|-----------|----------|-------|
| `--lg-bg` | `250 250 252` | `bg-[rgb(250,250,252)]` | Page background |
| `--lg-surface` | `255 255 255` @ 72% α | `bg-white/[0.72]` | Card/panel fill |
| `--lg-text` | `15 23 42` | `text-slate-900` | Primary text |
| `--lg-text-secondary` | `71 85 105` | `text-slate-600` | Secondary text |
| `--lg-text-muted` | `148 163 184` | `text-slate-400` | Muted/placeholder |

### Iridescent Glow Palette (pastel)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Blue** | `#93C5FD` | `147 197 253` | Default focus rings, input glow |
| **Purple** | `#C4B5FD` | `196 181 253` | Interactive card hover glow |
| **Pink** | `#F9A8D4` | `249 168 212` | Accent highlights |
| **Green** | `#86EFAC` | `134 239 172` | Success states, status online |

### Button Glow Variants

| Variant | Fill | Glow Shadow | Use Case |
|---------|------|-------------|----------|
| `glass` | `bg-white/70` + blur | Subtle lift shadow | Default / neutral actions |
| `red` | `bg-red-500` | `0 0 20px rgba(252,165,165,0.5)` | Destructive / danger |
| `blue` | `bg-blue-500` | `0 0 20px rgba(147,197,253,0.5)` | Primary CTA |
| `neutral` | `bg-slate-500` | `0 0 20px rgba(148,163,184,0.4)` | Secondary actions |
| `purple` | `bg-purple-500` | `0 0 20px rgba(196,181,253,0.5)` | Premium / special |
| `pink` | `bg-pink-500` | `0 0 20px rgba(249,168,212,0.5)` | Social / engagement |
| `green` | `bg-green-500` | `0 0 20px rgba(134,239,172,0.5)` | Success / confirm |
| `ghost` | transparent | none | Tertiary / text-style |
| `outline` | transparent + border | none | Outlined alternative |

---

## 3. Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--lg-shadow-sm` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)` | Subtle lift |
| `--lg-shadow-md` | `0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)` | Cards, inputs |
| `--lg-shadow-lg` | `0 8px 30px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)` | Dropdowns, toasts |
| `--lg-shadow-xl` | `0 20px 40px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)` | Modals |

---

## 4. Spring-Physics Animation Presets

All hover/focus/open/close animations use Framer Motion spring physics — **never CSS ease/linear**.

| Preset | Stiffness | Damping | Mass | Use Case |
|--------|-----------|---------|------|----------|
| `springPreset` | 260 | 20 | 1.0 | Default hover, focus, scale |
| `springSnap` | 400 | 25 | 0.8 | Toggle knob, checkbox, chips |
| `springGentle` | 180 | 24 | 1.2 | Modal entrance, overlay fade |

### Standard Motion Patterns

| Interaction | Animation | Values |
|-------------|-----------|--------|
| Button hover | Scale + lift | `scale: 1.03, y: -1` |
| Button tap | Scale down | `scale: 0.97` |
| Card hover (interactive) | Scale + lift + iridescent glow | `scale: 1.015, y: -2` + box-shadow with blue/purple glow |
| Input focus | Subtle scale | `scale: 1.01` |
| Dropdown open | Scale + translate | `scale: 0.97→1, y: -6→0` |
| Modal entrance | Scale + translate | `scale: 0.92→1, y: 20→0` |
| Toast slide-in | Translate + scale | `x: 60→0, scale: 0.95→1` |
| Toggle knob | Translate X | `x: 0→20` (springSnap) |
| Checkbox mark | Pop scale | `scale: 0→1` (springSnap) |

### Reduced Motion

Always respect `prefers-reduced-motion: reduce`. Use the `prefersReducedMotion()` helper from `shared.ts`.

---

## 5. Component Library

**Import:** `import { LGButton, LGCard, ... } from '@/components/liquid-glass'`
**CSS Tokens:** `import '@/components/liquid-glass/tokens.css'` in entry point.

### Component API Reference

| Component | Key Props | Variants/Sizes |
|-----------|-----------|----------------|
| **LGButton** | `variant`, `size`, `iconLeft`, `iconRight`, `isLoading` | 9 variants × 4 sizes (sm/md/lg/icon) |
| **LGTextInput** | `inputSize`, `state`, `label`, `error`, `hint`, `iconLeft`, `iconRight` | 3 sizes × 3 states (default/error/success) |
| **LGSearchInput** | `inputSize`, `value`, `onClear` | 3 sizes, pill-shaped |
| **LGSelect** | `options`, `value`, `onChange`, `label`, `size` | 3 sizes, keyboard nav |
| **LGToggle** | `checked`, `onChange`, `label`, `size` | 2 sizes (sm/md) |
| **LGCheckbox** | `checked`, `onChange`, `label`, `indeterminate` | Single size, 3 states |
| **LGTabs** | `tabs`, `value`, `onChange`, `children`, `size` | 2 sizes (sm/md), sliding indicator |
| **LGCard** | `variant`, `interactive`, `header`, `footer`, `compact` | 3 variants (glass/elevated/flat) |
| **LGModal** | `open`, `onClose`, `title`, `description`, `footer`, `size` | 4 sizes (sm/md/lg/xl) |
| **LGToastContainer** | `position` | 4 positions; `toast()` imperative API |
| **LGUserCard** | `name`, `subtitle`, `avatarSrc`, `status`, `action`, `size`, `interactive` | 3 sizes, 4 status types |
| **LGAvatar** | `src`, `alt`, `fallback`, `size`, `status` | 3 sizes, initials fallback |

### Toast Imperative API

```tsx
import { toast } from '@/components/liquid-glass';

toast({ title: 'Saved', variant: 'success', duration: 3000 });
toast({ title: 'Error', description: 'Something went wrong', variant: 'error' });
```

---

## 6. Glass Surface Recipes

### Standard Glass Card
```
bg-white/[0.72] backdrop-blur-[20px] backdrop-saturate-[1.6]
border border-slate-200/60
shadow-[0_4px_12px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]
rounded-[20px]
```

### Elevated Glass (Modal, floating panel)
```
bg-white/[0.82] backdrop-blur-[24px] backdrop-saturate-[1.8]
border border-slate-200/60
shadow-[0_20px_40px_rgba(0,0,0,0.10),0_8px_16px_rgba(0,0,0,0.06)]
rounded-[20px]
```

### Glass Input Field
```
bg-white/60 backdrop-blur-[16px] backdrop-saturate-[1.5]
border border-slate-200/60
rounded-[12px]
focus:bg-white/80 focus:border-blue-300/70
focus:shadow-[0_0_0_3px_rgba(147,197,253,0.3),0_0_16px_rgba(147,197,253,0.15)]
```

### Glass Tab Bar
```
bg-white/50 backdrop-blur-[14px] backdrop-saturate-[1.4]
border border-slate-200/50
rounded-[12px] p-1
```

---

## 7. Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| Card padding | `px-5 py-4` | Standard card body |
| Card header/footer | `px-5 py-3.5` / `px-5 py-3` | Separated sections |
| Modal padding | `px-6 py-5` (body), `px-6 py-4` (header), `px-6 py-3.5` (footer) | Dialog layout |
| Toast padding | `px-4 py-3.5` | Notification cards |
| Input height | sm: `h-8` · md: `h-10` · lg: `h-12` | All input components |
| Button height | sm: `h-8` · md: `h-10` · lg: `h-12` · icon: `h-10 w-10` | All buttons |

---

## 8. Anti-Patterns (NEVER Use)

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Emoji icons (🎨 🚀 ⚙️) | SVG icons from Lucide |
| `ease`, `linear` CSS transitions for interactive elements | Framer Motion spring physics |
| Pure `#FFFFFF` page background | Pearl-white `rgb(250,250,252)` |
| `bg-white/10` glass in light mode (invisible) | `bg-white/[0.72]` minimum |
| Text lighter than `text-slate-600` for body | `text-slate-900` primary, `text-slate-600` secondary |
| Instant state changes | Spring transitions (150–300ms apparent) |
| Dark mode as default | Light mode pearl-white |
| Vibrant block colors, neon fills | Pastel iridescent glows only |
| `scale` transforms that shift siblings | `y: -1` to `-2` lift, never layout-shifting scale |
| Missing `cursor-pointer` on clickable | Always add `cursor-pointer` |
| No focus ring | `focus-visible:ring-2 ring-blue-300/60 ring-offset-2` |

---

## 9. Accessibility Checklist

- [ ] All images have `alt` text
- [ ] Form inputs have associated `<label>` elements
- [ ] ARIA roles: `role="dialog"`, `role="switch"`, `role="checkbox"`, `role="tab"`, `role="listbox"`, `role="alert"`
- [ ] `aria-expanded`, `aria-selected`, `aria-checked` on interactive controls
- [ ] Keyboard navigation: Arrow keys for tabs/select, Escape for modal/dropdown
- [ ] Focus management: Modal traps focus, restores on close
- [ ] Color contrast ≥ 4.5:1 for all text
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

---

## 10. Pre-Delivery Checklist

Before delivering any Liquid Glass UI code:

- [ ] Imported `tokens.css` in entry point
- [ ] No emojis used as icons — all icons are Lucide SVGs
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states use spring physics, don't cause layout shift
- [ ] Focus rings visible (`focus-visible:ring-2`)
- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Glass surfaces use minimum `bg-white/[0.72]` (not transparent in light mode)
- [ ] Borders use `border-slate-200/60` (visible in light mode)
- [ ] Transitions are 150–300ms via spring presets
- [ ] `prefers-reduced-motion` respected
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars

---

## File Map

```
apps/web/src/components/liquid-glass/
├── tokens.css           # CSS custom properties
├── shared.ts            # Spring presets, glass classes, glow map
├── lg-button.tsx        # Button (9 variants × 4 sizes)
├── lg-text-input.tsx    # TextInput with label/error/icon
├── lg-search-input.tsx  # Pill search bar with clear
├── lg-select.tsx        # Dropdown with keyboard nav
├── lg-toggle.tsx        # Switch with spring knob
├── lg-checkbox.tsx      # Checkbox with spring checkmark
├── lg-tabs.tsx          # Tab bar with sliding indicator
├── lg-card.tsx          # Card (glass/elevated/flat)
├── lg-modal.tsx         # Modal with focus trap
├── lg-toast.tsx         # Toast system + imperative API
├── lg-user-card.tsx     # UserCard + Avatar
└── index.ts             # Barrel export
```
