# Phase 24 — Landing Page Complete Overhaul (Master Plan)

> **Created:** 2026-03-12  
> **Supersedes:** Plans 24-01 through 24-06 (never executed)  
> **Scope:** Full content audit + identity realignment + new content + UI/UX compliance  

---

## Problem Statement

The landing page was built when CGraph was a **gamification-heavy messaging platform** (XP, levels, quests, battle pass, leaderboards). After Phase 26 "The Great Delete" and subsequent phases (29–39), the product identity fundamentally changed to:

> **"Secure messaging, forums, and communities — with a creator economy and cosmetics system"**

The landing page still presents gamification as a **primary differentiator** equal to encryption and forums. This is wrong. The current identity gaps:

| Area | What Landing Says | What CGraph Actually Is |
|------|------------------|------------------------|
| **Interactive Demo** | 50% gamification (2/4 tabs: Achievements + Gamify) | Gamification UI was deleted in Phase 26 |
| **Chat Demo** | Users show Level 50, 4200 XP, 1847 karma, 42 streak | No XP/level/karma UI exists in the app |
| **Hero Subtitle** | "Forums with gamification & XP" | Forums with moderation, threads, discovery |
| **Value Prop** | "Gamification That Works" as top-4 differentiator | Replaced by Cosmetics, Creator Economy, Discovery |
| **Features List** | "Gamified Communities: XP, levels, quests, battle pass" | Quests/battle pass deleted; cosmetics + achievements remain |
| **Pricing Tiers** | "Basic gamification (XP, levels)" / "Battle pass access" | No battle pass; cosmetics unlock engine instead |
| **Pricing Amounts** | Premium $4.99/mo, no Enterprise price | Backend: Premium $9.99/mo (CLAUDE.md canonical) |
| **Blog Posts** | 11 posts, all pre-Phase 26 | Missing: Phase 26-39 content (creator economy, cosmetics, secret chat, etc.) |
| **Docs Articles** | Heavy gamification docs (XP, quests, leaderboards, currency) | Need rewrite to reflect cosmetics/achievements only |
| **About Page** | "1,342 tests", "91 DB tables" | 6,900+ tests, 94+ DB tables |
| **Status Page** | SLOs look correct | Architecture score should be 8.7 not 9.2 |

---

## Plan Structure (8 Plans)

### Wave 1: Data Layer (Foundation) — Plans 01-02

These update the data files that feed into all components. Must be done first because components import from these.

### Wave 2: Component Updates — Plans 03-05

Update the actual React components that render marketing content. Depends on Wave 1 data being correct.

### Wave 3: Content Creation — Plans 06-07

Create new blog posts, update documentation articles. Can run in parallel.

### Wave 4: Verification — Plan 08

Visual verification + link checking + final audit.

---

## Plan 01 — Core Data Files (landing-data.ts, pricing-data.ts, constants.ts)

**Wave:** 1 | **Depends on:** nothing | **Autonomous:** yes

### Files Modified
- `apps/landing/src/data/landing-data.ts`
- `apps/landing/src/data/pricing-data.ts`
- `apps/landing/src/constants.ts`

### Tasks

#### 1.1 — Update `landing-data.ts` features array

Replace gamification-centric features with current identity:

| # | Current Title | New Title | New Description |
|---|--------------|-----------|-----------------|
| 4 | "Gamified Communities" (XP, levels, quests, battle pass) | "Cosmetics & Achievements" | "325 collectible cosmetics across 7 rarity tiers — badges, titles, nameplates, profile themes, name styles, and frames. Unlock through achievements or purchase with Nodes." |
| 7 | "Creator Monetization" (85% share) | "Creator Economy" | "Paid DMs, premium threads, content boosts, and Nodes virtual currency. Creators earn through tipping, content unlocks, and revenue sharing." |
| 8 | "Premium Subscriptions" ($14.99/mo, $29.99/mo — WRONG prices) | "Subscription Tiers" | "Free, Premium ($9.99/mo), and Enterprise tiers with tiered storage, forums, cosmetics, and enterprise features like SSO/SAML." |

#### 1.2 — Update `landing-data.ts` valueProps array

Replace "Gamification That Works" value prop:

| # | Current Title | New Title | New Description |
|---|--------------|-----------|-----------------|
| 3 | "Gamification That Works" (XP, achievements, quests, leaderboards) | "Cosmetics & Self-Expression" | "325 collectible items across badges, titles, nameplates, frames, profile themes, and name styles. 7 rarity tiers from free to mythic." |
| 3 | highlight: "50+ Rewards" | highlight: "325 Items" |

#### 1.3 — Update `pricing-data.ts` tiers

| Tier | Current Price | Correct Price | Feature Changes |
|------|--------------|---------------|-----------------|
| Free | $0 | $0 | Remove "Basic gamification (XP, levels)" → "70 achievements to unlock" + "3 free cosmetic themes" |
| Premium | $4.99/mo ($4.15 annual) | $9.99/mo ($8.33 annual) | Remove "Battle pass access" → "Full cosmetics collection" + "Creator economy tools" + "Custom chat themes (9 bubble styles)" |
| Enterprise | $0 (Contact Us) | $0 (Contact Us) | Add "SSO/SAML authentication" (remove "coming soon"), add "Compliance & audit logging", add "Unlimited forums & groups" |

#### 1.4 — Verify `constants.ts` URLs

Confirm all URLs are correct:
- `WEB_APP_URL` → `https://web.cgraph.org`
- `LANDING_URL` → `https://cgraph.org`

### Must-Haves
- [ ] No mention of "XP", "levels", "quests", "battle pass", "leaderboards" in features
- [ ] Premium price is $9.99/mo
- [ ] Enterprise SSO shown without "coming soon"
- [ ] All feature descriptions match actual shipped capabilities
- [ ] Cosmetics inventory number (325) is accurate

---

## Plan 02 — Interactive Demo Overhaul

**Wave:** 1 | **Depends on:** nothing | **Autonomous:** yes

### Files Modified
- `apps/landing/src/components/interactive-demo/InteractiveDemo.tsx`
- `apps/landing/src/components/interactive-demo/ChatDemo.tsx`
- `apps/landing/src/components/interactive-demo/GamificationDemo.tsx`
- `apps/landing/src/components/interactive-demo/AchievementsDemo.tsx`
- `apps/landing/src/components/interactive-demo/TitlesDemo.tsx`
- `apps/landing/src/components/interactive-demo/constants.ts`
- `apps/landing/src/components/interactive-demo/types.ts`

### Tasks

#### 2.1 — Replace tab structure

The current 4 tabs are: Chat | Titles | Achievements | Gamify

New 4 tabs reflecting actual product:

| Tab | Old | New | Content |
|-----|-----|-----|---------|
| 1 | Chat | **Chat** | Keep messaging demo but remove XP/level/karma/streak from user profiles |
| 2 | Titles | **Cosmetics** | Rename — show cosmetic categories (badges, titles, nameplates, frames, themes, name styles) with rarity filters |
| 3 | Achievements | **Forums** | NEW — interactive forum thread demo with voting, thread prefixes, nested replies |
| 4 | Gamify | **Security** | REPLACE — show encryption visual (key exchange animation, message encrypt/decrypt flow) |

#### 2.2 — Rewrite ChatDemo.tsx user profiles

Remove all gamification stats from demo user profiles:

| Field | Current | New |
|-------|---------|-----|
| level | Level 50 / 32 / 78 | REMOVE entirely |
| xp / maxXp | 4200/5000 etc. | REMOVE entirely |
| karma | 1847 / 923 / 3241 | REMOVE entirely |
| streak | 42 / 18 / 67 | REMOVE entirely |
| title | Keep | Keep (cosmetic display) |
| badges | Keep | Keep (cosmetic display) |
| borderStyle | Keep | Keep (cosmetic display) |

Keep the profile card hover effect but show: **username, title, badges, cosmetic frame** — no XP bar, no level, no karma, no streak.

Replace the swipe tutorial ("+10 XP / −5 XP") with a showcase of message features: reactions, replies, forwards, pins.

#### 2.3 — Replace GamificationDemo.tsx with SecurityDemo.tsx

Delete the auto-incrementing XP/level/streak/coins animation. Replace with a visual showing:
- Key exchange animation (2 devices, PQXDH handshake visualization)
- Message encryption flow (plaintext → AES-256-GCM ciphertext → delivery → decrypt)
- "Zero Knowledge" indicator showing server sees only encrypted blobs
- Trust badges: "Post-Quantum", "Forward Secrecy", "192 Crypto Tests"

#### 2.4 — Replace AchievementsDemo.tsx with ForumsDemo.tsx

Delete the achievement grid with XP rewards. Replace with a mini-forum demo:
- 3-4 sample threads with prefixes (DISCUSSION, HELP, ANNOUNCEMENT)
- Vote buttons (up/down) with score display
- Nested reply structure preview
- Thread author with cosmetic title/badge

#### 2.5 — Expand TitlesDemo.tsx → CosmeticsDemo.tsx

Keep the title showcase but add tabs/sections for all 6 cosmetic categories:
- Badges (grid of 6-8 with rarity colors)
- Titles (existing — keep the animated title cards)
- Nameplates (2-3 examples with particle effects)
- Profile Frames (3-4 avatar frames with animation types)
- Profile Themes (2-3 theme previews)
- Name Styles (3-4 font/effect combinations)

Show the "325 items across 7 rarity tiers" stat.

#### 2.6 — Update constants.ts and types.ts

- Remove all XP/level/karma/streak fields from `DemoUserProfile`
- Remove `ACHIEVEMENTS` array (replaced by forum demo data)
- Add `DEMO_THREADS` array for forum demo
- Add `SECURITY_STEPS` array for encryption visualization
- Update `DEMO_USER_PROFILES` to remove gamification fields
- Add `COSMETIC_CATEGORIES` array for expanded cosmetics demo

#### 2.7 — Update tab footers in InteractiveDemo.tsx

| Tab | Current Footer | New Footer |
|-----|---------------|------------|
| Chat | "🔒 End-to-end encrypted • Try it yourself!" | "🔒 Post-quantum encrypted messaging • Try it yourself!" |
| Cosmetics | "🏷️ Preview premium titles..." | "✨ 325 cosmetics across 7 rarity tiers. Express yourself." |
| Forums | "🏆 Track milestone progress..." | "💬 Real-time forums with threads, voting, and moderation." |
| Security | "🎮 Explore XP, levels..." | "🔐 PQXDH + Triple Ratchet • Zero-knowledge architecture." |

### Must-Haves
- [ ] Zero references to XP, levels, karma, streak, quests, leaderboards, battle pass in interactive demo
- [ ] Chat demo profiles show only cosmetic elements (title, badges, frame)
- [ ] Gamification tab fully replaced with Security visualization
- [ ] Achievement tab fully replaced with Forum demo
- [ ] All 6 cosmetic categories represented
- [ ] Demo is still interactive and visually engaging

---

## Plan 03 — Hero, Features, ValueProposition Sections

**Wave:** 2 | **Depends on:** Plan 01 | **Autonomous:** yes

### Files Modified
- `apps/landing/src/components/marketing/sections/Hero.tsx`
- `apps/landing/src/components/marketing/sections/Features.tsx`
- `apps/landing/src/components/marketing/sections/ValueProposition.tsx`

### Tasks

#### 3.1 — Fix Hero.tsx cycling subtitles

Replace gamification-referencing subtitles:

| # | Current | New |
|---|---------|-----|
| 1 | "End-to-end encrypted messaging with post-quantum security." | Keep as-is ✅ |
| 2 | "Real-time community forums with **gamification & XP**." | "Real-time community forums with threads, voting, and moderation." |
| 3 | "Voice & video calls powered by WebRTC — sub-200ms." | Keep as-is ✅ |
| 4 | "Custom themes, **achievements**, and subscription tiers." | "325 cosmetics, creator economy, and self-expression tools." |
| 5 | "Web3-ready authentication with wallet connect." | Keep as-is ✅ |

#### 3.2 — Fix Features.tsx icon mapping

Update the icon-matching logic:
- Remove: `"Gamified" → crown` mapping
- Add: `"Cosmetics" → crown` or `"Creator" → crown` mapping
- Add: `"Achievement" → star` mapping (if applicable)

#### 3.3 — Fix ValueProposition.tsx

Replace "Gamification That Works" with the updated value prop from landing-data.ts.

Update comparison table:
| Feature | CGraph | Others | Notes |
|---------|--------|--------|-------|
| E2E Encryption | ✓ | Limited | Keep |
| Built-in Forums | ✓ | ✗ | Keep |
| ~~Gamification~~ | ~~✓~~ | ~~✗~~ | **Replace with:** "Cosmetics & Self-Expression" ✓ vs ✗ |
| Web3 Auth | ✓ | ✗ | Keep |
| **Creator Economy** | ✓ | ✗ | **ADD new row** |

### Must-Haves
- [ ] No hero subtitle mentions gamification/XP
- [ ] Feature icon mapping handles new feature names
- [ ] Comparison table shows cosmetics + creator economy, not gamification

---

## Plan 04 — Pricing, About, Status, Download Pages

**Wave:** 2 | **Depends on:** Plan 01 | **Autonomous:** yes

### Files Modified
- `apps/landing/src/components/marketing/sections/Pricing.tsx` (verify it reads from pricing-data.ts)
- `apps/landing/src/pages/company/About.tsx`
- `apps/landing/src/pages/resources/Status.tsx`
- `apps/landing/src/pages/resources/Download.tsx`

### Tasks

#### 4.1 — Verify Pricing.tsx reads from data

Confirm Pricing.tsx imports `pricingTiers` from `pricing-data.ts` and doesn't have hardcoded values. If it does, update them.

#### 4.2 — Update About.tsx stats

Current → Updated:
| Stat | Current | Correct |
|------|---------|---------|
| Tests | 1,342 | 6,900+ |
| DB tables | 91 | 94 |
| Milestones | 7 versions listed | Update to include Phase 26-39 milestones |
| Architecture Score | (check current) | 8.7/10 |
| Phase count | (check) | 39 phases |

Add new milestones:
- v0.9.35: Secret Chat, Creator Economy, Cosmetics Engine
- v0.9.37: Enterprise SSO, Infrastructure Scaling
- v1.0.0: Full launch — 38/39 phases complete

Update vision section to remove gamification focus. New vision:
> "CGraph combines the security of Signal, the community features of Discord, and the self-expression of a cosmetics platform — in one cross-platform app."

#### 4.3 — Update Status.tsx

- Verify SLO targets are still correct (99.9% API, 99.95% delivery, <200ms P95)
- Update architecture score if shown (should be 8.7/10)
- Add infrastructure details about Phase 38 scaling (sharding, CDN, archival)

#### 4.4 — Update Download.tsx

- Web: "Available Now" ✅ (keep)
- Mobile: Still "Beta" — update to be clear about Phase 19 credential blocker
- Desktop: "2027" — keep as-is

### Must-Haves
- [ ] About page shows 6,900+ tests, 94 DB tables
- [ ] Architecture score is 8.7/10
- [ ] Vision statement reflects secure messaging + communities + creator economy
- [ ] SLO targets match backend configuration

---

## Plan 05 — Press, Careers, Contact, Legal Pages

**Wave:** 2 | **Depends on:** Plan 01 | **Autonomous:** yes

### Files Modified
- `apps/landing/src/pages/company/Press.tsx`
- `apps/landing/src/pages/company/Careers.tsx`
- `apps/landing/src/pages/company/Contact.tsx`
- (Legal pages — only if they reference gamification)

### Tasks

#### 5.1 — Update Press.tsx

- Add press release for v1.0.0 launch
- Update company facts to reflect 38/39 phases, 6,900+ tests
- Update product description to remove gamification focus
- Platform stage should say "v1.0 Released" (verify)

#### 5.2 — Update Careers.tsx

- Verify it doesn't reference gamification as core product
- Update tech stack if needed
- Keep "No open positions" (solo developer project)

#### 5.3 — Review Contact.tsx

- Verify contact methods are current
- Update FAQ if it references old product identity

#### 5.4 — Audit legal pages for gamification references

- Search all 4 legal pages for "gamification", "XP", "virtual currency" references
- Update language to reflect current product (cosmetics, Nodes, achievements)

### Must-Haves
- [ ] Press page has v1.0.0 press release
- [ ] No legal page references deleted features
- [ ] Company description consistent across all pages

---

## Plan 06 — New Blog Posts

**Wave:** 3 | **Depends on:** Plans 01-02 | **Autonomous:** yes

### Files Modified
- `apps/landing/src/data/blog/posts.ts`
- `apps/landing/src/data/blog/articles.ts`
- `apps/landing/src/data/blog/constants.ts` (if new categories needed)

### Tasks

#### 6.1 — Add 6 new blog posts covering Phases 26-39

| # | Title | Category | Content Focus |
|---|-------|----------|---------------|
| 1 | "The Great Delete: Why We Removed Gamification" | Product | Phase 26 story — what was deleted, why, what replaced it (Pulse, Nodes, Cosmetics). Honest reflection on product evolution. |
| 2 | "Introducing Secret Chat: Privacy Beyond Encryption" | Security | Phase 29 — ghost mode, panic wipe, 12 themes, 5 components. How it differs from standard E2EE. |
| 3 | "325 Cosmetics: Building a Self-Expression Engine" | Product | Phases 28, 33, 35 — cosmetics manifest, unlock engine, rarity system, 7 tiers. |
| 4 | "Creator Economy: Empowering Content Creators" | Product | Phase 36 — paid DMs, premium threads, content boosts, Nodes currency, revenue sharing. |
| 5 | "Enterprise Ready: SSO, Compliance, and Scaling" | Architecture | Phases 38-39 — infrastructure scaling, SSO/SAML, compliance, audit logging, sharding. |
| 6 | "v1.0 Post-Mortem: 39 Phases in 6 Months" | Engineering | Full project retrospective — honest stats, what worked, what didn't, architecture decisions. |

Each post needs:
- `id` (slug)
- `title`
- `excerpt` (2-3 sentences)
- `date` (stagger March 2026)
- `readTime` (estimated)
- `category` (existing or new)
- `featured` flag
- Full HTML article content in `articles.ts`

#### 6.2 — Update blog metadata

- Mark "v1.0 Post-Mortem" as `featured: true`
- Ensure chronological ordering
- Update any category colors if new categories added

### Must-Haves
- [ ] 6 new blog posts with full article content
- [ ] Posts cover the product evolution from gamification → current identity
- [ ] Dates are staggered and chronological
- [ ] At least 1 post is featured

---

## Plan 07 — Documentation Articles Overhaul

**Wave:** 3 | **Depends on:** Plans 01-02 | **Autonomous:** yes

### Files Modified
- `apps/landing/src/data/docs/articles.ts`
- `apps/landing/src/data/docs/categories.ts`

### Tasks

#### 7.1 — Rewrite Gamification documentation section

The current docs have an entire "Gamification" category with articles about:
- XP system, levels, prestige
- Quests (daily/weekly/seasonal)
- Leaderboards (global, per-server, weekly)
- Currency (coins, shop, purchases)
- Seasonal events (exclusive cosmetics, double XP)

This needs to be rewritten to reflect the ACTUAL current state:

| Old Article | Action | New Content |
|------------|--------|-------------|
| XP & Leveling | **DELETE** | N/A — XP UI was removed |
| Quests | **DELETE** | N/A — quests were removed |
| Leaderboards | **DELETE** | N/A — leaderboard UI was removed |
| Achievements | **REWRITE** | 70 achievements across 6 categories, unlock cosmetics |
| Currency & Shop | **REWRITE** | Nodes virtual currency, cosmetics shop, tipping |
| Seasonal Events | **REWRITE** | Seasonal cosmetic drops, limited-time unlock events |

#### 7.2 — Add new documentation articles

| Category | Title | Content |
|----------|-------|---------|
| Cosmetics | "Cosmetics Overview" | 325 items, 6 categories, 7 rarity tiers, equip system |
| Cosmetics | "Badges & Titles" | 70 badges, 70 titles, animation effects, display rules |
| Cosmetics | "Profile Customization" | Nameplates, frames, themes, name styles |
| Cosmetics | "Unlock Engine" | 5 evaluator types, rarity distribution, achievement links |
| Creator Economy | "Getting Started as a Creator" | Paid DMs, premium threads, revenue sharing |
| Creator Economy | "Nodes Currency" | Earning, spending, tipping, wallet management |
| Creator Economy | "Content Boosts" | How boosts work, pricing, duration, feed ranking |
| Secret Chat | "Secret Chat Guide" | Ghost mode, panic wipe, themes, privacy features |
| Enterprise | "Enterprise Features" | SSO/SAML, compliance, audit logging, SLA |
| Enterprise | "Admin Dashboard" | User management, moderation, analytics |
| Discovery | "Discovery Feed" | How content ranking works, trending, recommendations |

#### 7.3 — Update existing articles

- Review all "Getting Started" articles for gamification references
- Update "Messaging" articles if they mention XP rewards
- Update "Forums" articles if they mention karma/XP from voting
- Update API docs if they reference deleted endpoints (quests, leaderboards, prestige)
- Update architecture score from 9.2 to 8.7 wherever it appears

#### 7.4 — Update categories.ts

- Rename "Gamification" category → "Achievements & Cosmetics" (or split into two categories)
- Add "Creator Economy" category
- Add "Secret Chat" category (or merge into Security)
- Add "Enterprise" category
- Update category descriptions

### Must-Haves
- [ ] No documentation references XP, levels, prestige, quests, or leaderboards as current features
- [ ] Cosmetics documentation covers all 6 categories with accurate item counts
- [ ] Creator Economy has at least 3 articles
- [ ] API documentation doesn't reference deleted endpoints
- [ ] Architecture score is 8.7/10 wherever mentioned

---

## Plan 08 — Verification & Consistency Audit

**Wave:** 4 | **Depends on:** Plans 01-07 | **Autonomous:** no (human review step)

### Tasks

#### 8.1 — Grep audit for stale references

Run comprehensive search across ALL landing source files for:
```
gamification|XP|experience points|level up|leveling|quest|leaderboard|battle pass|prestige|karma(?!.*voting)|double XP|skill tree|season pass
```

Every match must be either:
- Deleted (if referencing deleted features)
- Reworded (if context is appropriate, e.g., "achievements" is fine)
- Justified (e.g., blog post about "The Great Delete" intentionally mentions old system)

#### 8.2 — Price consistency check

Verify across all files:
- Premium = $9.99/mo everywhere
- Enterprise = "Contact Us" everywhere
- Free = $0 everywhere
- No stale $4.99, $14.99, $29.99 references

#### 8.3 — Stats consistency check

Verify across all files:
- Tests: 6,900+
- DB tables: 94
- Architecture score: 8.7/10
- Features shipped: 142 (or updated count)
- Phases: 39

#### 8.4 — URL verification

Check all links in footer, navigation, CTAs point to correct destinations.

#### 8.5 — Visual walkthrough

Human browses every page and verifies:
- [ ] Landing page hero → no gamification
- [ ] Interactive demo → 4 tabs (Chat, Cosmetics, Forums, Security)
- [ ] Features section → no "Gamified Communities"
- [ ] Value proposition → no "Gamification That Works"
- [ ] Pricing → correct prices ($9.99)
- [ ] About → correct stats
- [ ] Blog → new posts visible
- [ ] Docs → gamification articles replaced
- [ ] Status → correct SLOs and scores
- [ ] Download → accurate platform availability
- [ ] Press → v1.0.0 release
- [ ] Footer → all links work

### Must-Haves
- [ ] Zero stale gamification references in source code (excluding intentional blog mentions)
- [ ] Price consistency across all files
- [ ] Stats consistency across all files
- [ ] All navigation links resolve to existing pages

---

## Summary

| Plan | Wave | Scope | Files | Key Changes |
|------|------|-------|-------|-------------|
| 01 | 1 | Core Data Files | 3 | Fix features, prices, value props |
| 02 | 1 | Interactive Demo | 7 | Replace 2 gamif tabs, clean chat profiles |
| 03 | 2 | Hero/Features/Value | 3 | Remove gamif subtitles, fix comparison table |
| 04 | 2 | About/Status/Download | 4 | Update stats, vision, SLOs |
| 05 | 2 | Press/Careers/Contact | 3-4 | v1.0 press release, audit legal |
| 06 | 3 | Blog Posts | 3 | 6 new posts covering Phases 26-39 |
| 07 | 3 | Documentation | 2 | Rewrite gamif docs, add cosmetics/creator/enterprise docs |
| 08 | 4 | Verification | 0 | Grep audit, link check, visual walkthrough |

**Total files modified:** ~25-30  
**Core identity shift:** "Gamified messaging" → "Secure messaging + forums + communities + creator economy + cosmetics"
