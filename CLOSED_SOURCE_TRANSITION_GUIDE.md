# CGraph Closed-Source Transition Guide

## 🚨 CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE MAKING ANY CHANGES

**Document Version:** 1.0.0 **Created:** January 27, 2026 **Last Updated:** January 27, 2026
**Status:** IN PROGRESS

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why This Transition](#2-why-this-transition)
3. [Current State Analysis](#3-current-state-analysis)
4. [Legal Implications You MUST Understand](#4-legal-implications-you-must-understand)
5. [Phase 1: Legal Foundation](#5-phase-1-legal-foundation)
6. [Phase 2: Repository Restructuring](#6-phase-2-repository-restructuring)
7. [Phase 3: Remove Self-Hosting](#7-phase-3-remove-self-hosting)
8. [Phase 4: Payment Integration](#8-phase-4-payment-integration)
9. [Phase 5: Code Protection](#9-phase-5-code-protection)
10. [Phase 6: Ongoing Operations](#10-phase-6-ongoing-operations)
11. [File Reference: What Changed](#11-file-reference-what-changed)
12. [Rollback Instructions](#12-rollback-instructions)
13. [FAQ and Troubleshooting](#13-faq-and-troubleshooting)
14. [Checklist for Completion](#14-checklist-for-completion)

---

## 1. Executive Summary

### What We're Doing

Converting CGraph from an **MIT-licensed open-source project** to a **closed-source proprietary SaaS
platform** similar to Discord.

### What This Means

| Before (Open Source)        | After (Closed Source)       |
| --------------------------- | --------------------------- |
| Anyone can view source code | Code is private/proprietary |
| Anyone can fork and modify  | No forking allowed          |
| Anyone can self-host        | Cloud-only (your servers)   |
| MIT License (permissive)    | Proprietary EULA            |
| Free forever                | Freemium with paid tiers    |

### Timeline Overview

| Phase                             | Duration   | Status         |
| --------------------------------- | ---------- | -------------- |
| Phase 1: Legal Foundation         | Days 1-3   | 🟡 IN PROGRESS |
| Phase 2: Repository Restructuring | Days 4-7   | ⚪ NOT STARTED |
| Phase 3: Remove Self-Hosting      | Days 8-14  | ⚪ NOT STARTED |
| Phase 4: Payment Integration      | Days 15-30 | ⚪ NOT STARTED |
| Phase 5: Code Protection          | Days 31-45 | ⚪ NOT STARTED |
| Phase 6: Ongoing Operations       | Continuous | ⚪ NOT STARTED |

---

## 2. Why This Transition

### The Discord Model

Discord is a **closed-source, cloud-only** communication platform:

- Users cannot see how Discord works internally
- Users cannot run their own Discord server
- Discord controls all infrastructure
- Revenue comes from Nitro subscriptions and server boosts

### Benefits of Closed Source

1. **Revenue Control** - You decide pricing, no one can undercut you with your own code
2. **Feature Exclusivity** - Competitors can't copy your innovations
3. **Security Through Obscurity** - Attackers can't study your source code (not a replacement for
   real security, but helps)
4. **Support Simplicity** - Only one version to support (your hosted version)
5. **Brand Control** - No confusing forks with your name

### Trade-offs You Accept

1. **Community Contributions** - You lose volunteer developers
2. **Trust** - Some users prefer auditable open-source
3. **Existing Forks** - Anyone who forked before today can legally continue using that code
4. **Marketing Angle** - "Open source" is a selling point you lose

---

## 3. Current State Analysis

### What CGraph Currently Is

**License:** MIT (file: `/CGraph/LICENSE`)

```
MIT License
Copyright (c) 2025 CGraph
Permission is hereby granted, free of charge, to any person...
```

**Self-Hosting:** Fully functional via Docker

**Infrastructure Files That Enable Self-Hosting:**

```
/CGraph/
├── docker-compose.yml          # Production deployment
├── docker-compose.dev.yml      # Development deployment
├── .env.example                 # Environment template
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.backend.dev
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.backend.fly
│   │   ├── nginx.conf
│   │   └── init-db.sql
│   ├── terraform/
│   │   ├── main.tf
│   │   └── terraform.tfvars.example
│   └── fly/
│       ├── fly.toml
│       └── fly.production.toml
├── apps/
│   ├── backend/.env.example
│   ├── web/.env.example
│   └── mobile/.env.example
```

**Documentation That Mentions Self-Hosting:**

- `/CGraph/README.md` - Main readme
- `/CGraph/QUICKSTART_NEW_UI.md` - Quick start guide
- `/CGraph/VERCEL_DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `/CGraph/docs/CHAT_SYSTEM_STATUS_2026_01_27.md` - Feature status
- `/CGraph/docs/guides/DEVELOPMENT.md` - Development guide

### What Needs to Change

1. **LICENSE** - Replace MIT with proprietary
2. **package.json files** - Change `"license": "MIT"` to `"license": "UNLICENSED"`
3. **Self-hosting files** - Delete or make private
4. **Documentation** - Remove all self-hosting claims
5. **Repository visibility** - Make private on GitHub

---

## 4. Legal Implications You MUST Understand

### ⚠️ WARNING: READ THIS CAREFULLY ⚠️

#### The MIT License Cannot Be Revoked Retroactively

**What this means:**

- Anyone who downloaded/forked CGraph BEFORE you change the license has PERMANENT rights to that
  code
- They can legally use, modify, distribute, and even sell that old version
- You CANNOT sue them or send takedown notices for code they already have
- You can ONLY protect code written AFTER the license change

**Example scenario:**

- January 26, 2026: User X forks CGraph (MIT licensed)
- January 27, 2026: You change license to proprietary
- User X can legally run their fork forever
- User X can even create "CGraph Community Edition" and compete with you

**What you CAN do:**

- Make the repo private (stops NEW forks)
- Change the license for all FUTURE code
- Send takedowns for any code copied AFTER the license change
- Outpace forks by developing faster

#### Contributor Considerations

**Current state:** No Contributor License Agreement (CLA) found in this repository.

**What this means:**

- External contributors implicitly licensed their code under MIT
- You do NOT automatically own their contributions
- To use their code in a proprietary product, you need either:
  - Their written permission, OR
  - To rewrite their contributions from scratch

**Action required:** Check who has contributed:

```bash
cd /CGraph
git shortlog -sne --all
```

If ALL commits are from your team, you're fine. If external contributors exist, consult a lawyer.

#### Future Contributions

**IMPORTANT:** After changing the license, you MUST:

1. Implement a CLA (Contributor License Agreement) for any future contributors
2. Require all contributors to sign the CLA before accepting their code
3. The CLA should grant you full IP rights to their contributions

---

## 5. Phase 1: Legal Foundation

### 5.1 Replace the LICENSE File

**File:** `/CGraph/LICENSE`

**BEFORE (MIT License):**

```
MIT License

Copyright (c) 2025 CGraph

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

**AFTER (Proprietary License):**

```
CGraph Proprietary License

Copyright (c) 2025-2026 CGraph. All Rights Reserved.

NOTICE: This software and all associated documentation, source code, and
materials ("Software") are the exclusive property of CGraph.

RESTRICTIONS:
1. You may NOT copy, modify, merge, publish, distribute, sublicense, or sell
   copies of the Software.
2. You may NOT use the Software to create derivative works.
3. You may NOT reverse engineer, decompile, or disassemble the Software.
4. You may NOT remove or alter any proprietary notices on the Software.

USAGE:
This Software is provided exclusively through CGraph's hosted platform at
https://cgraph.app (or successor URLs). Access is governed by our Terms of
Service available at https://cgraph.app/terms.

NO WARRANTY:
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED.

CONTACT:
For licensing inquiries: legal@cgraph.app
```

**STATUS:** ✅ IMPLEMENTED (January 27, 2026)

---

### 5.2 Update All package.json Files

Every `package.json` in the monorepo has a `"license"` field that must change.

**Files to update:**

| File                                | Old Value | New Value      | Status  |
| ----------------------------------- | --------- | -------------- | ------- |
| `/CGraph/package.json`              | `"MIT"`   | `"UNLICENSED"` | ✅ DONE |
| `/CGraph/apps/backend/package.json` | Check     | `"UNLICENSED"` | ⚪ TODO |
| `/CGraph/apps/web/package.json`     | Check     | `"UNLICENSED"` | ⚪ TODO |
| `/CGraph/apps/mobile/package.json`  | Check     | `"UNLICENSED"` | ⚪ TODO |
| `/CGraph/docs-website/package.json` | Check     | `"UNLICENSED"` | ⚪ TODO |
| `/CGraph/packages/*/package.json`   | Check     | `"UNLICENSED"` | ⚪ TODO |

**How to verify all are updated:**

```bash
cd /CGraph
grep -r '"license"' --include="package.json" .
```

All should show `"UNLICENSED"` or `"SEE LICENSE IN LICENSE"`.

---

### 5.3 Update CONTRIBUTING.md

**File:** `/CGraph/CONTRIBUTING.md`

**Issue found:** This file currently says "CGraph is proprietary software" but the LICENSE was MIT.
After our change, this becomes accurate.

**Required changes:**

1. Add CLA requirement section
2. Clarify that contributions become property of CGraph
3. Remove any open-source community language

**STATUS:** ✅ IMPLEMENTED (January 27, 2026)

---

### 5.4 Update SECURITY.md

**File:** `/CGraph/SECURITY.md`

**Required changes:**

1. Remove references to open-source security practices
2. Update responsible disclosure to reflect proprietary status
3. Clarify that security researchers should NOT share findings publicly

**STATUS:** ✅ IMPLEMENTED (January 27, 2026)

---

### 5.5 Create Contributor License Agreement (CLA)

**File to create:** `/CGraph/CLA.md`

**Purpose:** Legally requires contributors to grant you IP rights before you accept their code.

**Implementation options:**

1. **Manual:** Require email agreement before accepting PRs
2. **Automated:** Use CLA Assistant GitHub App (https://cla-assistant.io/)
3. **Bot:** Use cla-bot or similar GitHub Action

**STATUS:** ✅ IMPLEMENTED (January 27, 2026)

---

## 6. Phase 2: Repository Restructuring

### 6.1 Make Repository Private

**Platform:** GitHub

**Steps:**

1. Go to repository Settings
2. Scroll to "Danger Zone"
3. Click "Change visibility"
4. Select "Private"
5. Type repository name to confirm

**CRITICAL:** Do this AFTER changing the license, so the last public commit has the proprietary
license.

**STATUS:** ⚪ NOT STARTED (Manual action required)

---

### 6.2 Create Public Marketing Repository

**Purpose:** Public-facing repo with no source code, just marketing content.

**Name suggestion:** `cgraph/cgraph-website` or `cgraph/about`

**Contents:**

```
cgraph/cgraph-website/
├── README.md           # Product description, features, screenshots
├── SECURITY.md         # How to report vulnerabilities
├── docs/
│   └── api/           # Public API documentation only
└── .github/
    └── ISSUE_TEMPLATE/ # Bug reports for hosted platform
```

**STATUS:** ⚪ NOT STARTED

---

### 6.3 Separate CI/CD to Private Infrastructure

**Current location:** `/CGraph/.github/workflows/`

**Files:**

- `ci.yml` - Contains build/test processes
- `deploy.yml` - Contains deployment secrets references
- `release.yml` - Release automation

**Options:**

1. Keep in private repo (simplest)
2. Move to separate `cgraph/infrastructure` private repo
3. Use external CI/CD (CircleCI, GitLab CI)

**STATUS:** ⚪ NOT STARTED

---

## 7. Phase 3: Remove Self-Hosting

### 7.1 Files to DELETE

**Docker Orchestration (DELETE THESE):**

```bash
rm /CGraph/docker-compose.yml
rm /CGraph/docker-compose.dev.yml
```

**Docker Infrastructure (DELETE ENTIRE FOLDER):**

```bash
rm -rf /CGraph/infrastructure/docker/
```

This removes:

- `Dockerfile.backend`
- `Dockerfile.backend.dev`
- `Dockerfile.web`
- `Dockerfile.backend.fly`
- `nginx.conf`
- `init-db.sql`

**Terraform (DELETE OR MOVE TO PRIVATE):**

```bash
rm -rf /CGraph/infrastructure/terraform/
```

**Environment Templates (DELETE THESE):**

```bash
rm /CGraph/.env.example
rm /CGraph/apps/backend/.env.example
rm /CGraph/apps/web/.env.example
rm /CGraph/apps/mobile/.env.example
```

**STATUS:** ⚪ NOT STARTED

---

### 7.2 Documentation to UPDATE

**File: `/CGraph/README.md`**

Remove sections:

- Docker deployment instructions
- Self-hosting guide
- Environment setup for self-hosting
- Any "run your own server" language

Replace with:

- Links to hosted platform
- Getting started with the app (as a user)
- API documentation links

**File: `/CGraph/docs/CHAT_SYSTEM_STATUS_2026_01_27.md`**

Remove from competitor comparison table:

- "Self-Hostable" row (or change CGraph to ❌)
- "Open Source" row (or change CGraph to ❌)

**Other files to check and update:**

- `/CGraph/QUICKSTART_NEW_UI.md` - Delete or sanitize
- `/CGraph/VERCEL_DEPLOYMENT_CHECKLIST.md` - Make internal-only
- `/CGraph/docs/guides/DEVELOPMENT.md` - Make internal-only

**STATUS:** ⚪ NOT STARTED

---

## 8. Phase 4: Payment Integration

### 8.1 Current Payment Infrastructure

**Backend tier system exists at:** `/CGraph/apps/backend/lib/cgraph/subscriptions/tier_limits.ex`

**Current state:**

- Tier definitions exist (Free, Premium, Enterprise)
- Limit checking functions exist
- User schema has `subscription_tier` and `subscription_expires_at` fields
- NO actual payment processing implemented

**The TODO in code (line ~185):**

```elixir
defp get_user_tier(user) do
  # TODO: Integrate with actual subscription system
  # For now, check subscription_tier field on user
  user.subscription_tier || "free"
end
```

---

### 8.2 Stripe Integration Steps

**Step 1: Create Stripe Account**

- Go to https://dashboard.stripe.com/register
- Complete business verification
- Get API keys (publishable + secret)

**Step 2: Create Products in Stripe Dashboard**

```
Products to create:
- CGraph Free      → $0/month (for tracking)
- CGraph Premium   → $9/month
- CGraph Enterprise → Custom pricing
```

**Step 3: Add Stripe to Backend**

Add to `/CGraph/apps/backend/mix.exs`:

```elixir
{:stripity_stripe, "~> 3.0"}
```

Add environment variables to production:

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Step 4: Implement Webhook Handler**

Create `/CGraph/apps/backend/lib/cgraph_web/controllers/stripe_webhook_controller.ex`:

- Handle `customer.subscription.created`
- Handle `customer.subscription.updated`
- Handle `customer.subscription.deleted`
- Update user's `subscription_tier` accordingly

**Step 5: Connect Frontend to Stripe Checkout**

The pricing UI exists at: `/CGraph/apps/web/src/components/landing/PricingSection.tsx`

Add Stripe.js:

```bash
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

Create checkout flow that calls your backend, which creates a Stripe Checkout Session.

**STATUS:** ⚪ NOT STARTED

---

### 8.3 Tier Definitions

**Current tiers from code:**

| Tier       | Monthly Price | Key Limits                              |
| ---------- | ------------- | --------------------------------------- |
| Free       | $0            | 10 forums, 5 DMs/day, 100 messages/day  |
| Premium    | $9            | Unlimited forums, 25-person video calls |
| Enterprise | Custom        | SSO, custom branding, API access        |

**File reference:** `/CGraph/apps/backend/lib/cgraph/subscriptions/tier_limits.ex`

---

## 9. Phase 5: Code Protection

### 9.1 Backend Protection (Elixir)

**Current state:** Source code in `/CGraph/apps/backend/`

**Protection method:** Deploy only compiled BEAM bytecode

**How Elixir compilation works:**

1. Source `.ex` files → Compiled `.beam` files
2. `.beam` files are bytecode, not human-readable source
3. `mix release` creates a self-contained package with only `.beam` files

**Your Fly.io deployment already does this.** As long as:

1. The repo is private
2. Only compiled releases are deployed
3. No source code is in the deployed container

**Sensitive files to especially protect:**

- `/CGraph/apps/backend/lib/cgraph/encryption/crypto.ex` (E2EE implementation)
- `/CGraph/apps/backend/lib/cgraph/auth/` (Authentication logic)
- `/CGraph/apps/backend/lib/cgraph/webrtc/signaling.ex` (Call infrastructure)

**STATUS:** ✅ Already protected via compilation (verify repo is private)

---

### 9.2 Frontend Protection (React/Vite)

**Current state:** Source code in `/CGraph/apps/web/`

**The challenge:** JavaScript must be sent to browsers, so it's always visible in DevTools.

**Protection layers:**

**Layer 1: Minification (Already enabled)** Vite's production build minifies code by default.

**Layer 2: Disable Source Maps** In `/CGraph/apps/web/vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    sourcemap: false, // Ensure this is false for production
  },
});
```

**Layer 3: Advanced Obfuscation (Optional)** Add `javascript-obfuscator`:

```bash
pnpm add -D javascript-obfuscator
```

**Reality check:** Discord's client gets reverse-engineered (BetterDiscord, Vencord). Obfuscation
slows attackers but doesn't stop them. Don't over-invest here.

**STATUS:** ⚪ VERIFY sourcemap setting

---

### 9.3 Mobile Protection (React Native)

**Current state:** Source code in `/CGraph/apps/mobile/`

**Protection method:** App Store/Play Store distribution provides some protection:

- Apps are signed with your certificates
- APK/IPA files contain compiled assets
- Still vulnerable to decompilation but harder than web

**Additional protection:**

- Use Hermes engine (compiles JS to bytecode)
- Enable ProGuard for Android
- Use code signing properly

**STATUS:** ⚪ NOT STARTED

---

## 10. Phase 6: Ongoing Operations

### 10.1 Monitor for Unauthorized Forks

**GitHub Search:** Periodically search: `"cgraph" in:name,description,readme`

**Code Search:** Search for unique strings from your codebase that would indicate copying.

**Google Alerts:** Set up alerts for "CGraph" + "open source" or "CGraph" + "self-host"

---

### 10.2 Handle DMCA Takedowns

**When to send DMCA:**

- Someone copies code released AFTER the license change
- Someone creates a confusingly similar clone
- NOT for existing MIT-licensed forks (those are legal)

**DMCA Template:** Keep a template ready. GitHub has a guide:
https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-license-in-your-repository

---

### 10.3 Legal Review Schedule

**Recommended:** Annual review with an IP attorney to:

- Ensure license is enforceable
- Review any potential infringements
- Update CLA if needed
- Verify compliance with third-party licenses in dependencies

---

## 11. File Reference: What Changed

### Files MODIFIED

| File                                            | Change                                      | Date         | Status  |
| ----------------------------------------------- | ------------------------------------------- | ------------ | ------- |
| `/CGraph/LICENSE`                               | MIT → Proprietary                           | Jan 27, 2026 | ✅ Done |
| `/CGraph/package.json`                          | `"license": "SEE LICENSE IN LICENSE"`       | Jan 27, 2026 | ✅ Done |
| `/CGraph/packages/state/package.json`           | `"license": "SEE LICENSE IN ../../LICENSE"` | Jan 27, 2026 | ✅ Done |
| `/CGraph/CONTRIBUTING.md`                       | Added CLA requirement, proprietary notice   | Jan 27, 2026 | ✅ Done |
| `/CGraph/SECURITY.md`                           | Updated for closed source                   | Jan 27, 2026 | ✅ Done |
| `/CGraph/README.md`                             | Removed self-host/open source claims        | Jan 27, 2026 | ✅ Done |
| `/CGraph/docs/CHAT_SYSTEM_STATUS_2026_01_27.md` | Removed open source comparison rows         | Jan 27, 2026 | ✅ Done |

### Files CREATED

| File                                        | Purpose                       | Date         | Status  |
| ------------------------------------------- | ----------------------------- | ------------ | ------- |
| `/CGraph/CLA.md`                            | Contributor License Agreement | Jan 27, 2026 | ✅ Done |
| `/CGraph/CLOSED_SOURCE_TRANSITION_GUIDE.md` | This document                 | Jan 27, 2026 | ✅ Done |

### Files TO DELETE

| File                                 | Reason                 | Status  |
| ------------------------------------ | ---------------------- | ------- |
| `/CGraph/docker-compose.yml`         | Enables self-hosting   | ⚪ TODO |
| `/CGraph/docker-compose.dev.yml`     | Enables self-hosting   | ⚪ TODO |
| `/CGraph/infrastructure/docker/*`    | Enables self-hosting   | ⚪ TODO |
| `/CGraph/infrastructure/terraform/*` | Enables self-hosting   | ⚪ TODO |
| `/CGraph/.env.example`               | Enables self-hosting   | ⚪ TODO |
| `/CGraph/apps/backend/.env.example`  | Enables self-hosting   | ⚪ TODO |
| `/CGraph/apps/web/.env.example`      | Enables self-hosting   | ⚪ TODO |
| `/CGraph/apps/mobile/.env.example`   | Enables self-hosting   | ⚪ TODO |
| `/CGraph/QUICKSTART_NEW_UI.md`       | Self-host instructions | ⚪ TODO |

---

## 12. Rollback Instructions

### If You Need to Revert to Open Source

**Step 1: Restore LICENSE**

```bash
git checkout <commit-before-change> -- LICENSE
```

**Step 2: Restore package.json files**

```bash
git checkout <commit-before-change> -- package.json
git checkout <commit-before-change> -- apps/*/package.json
```

**Step 3: Restore deleted files**

```bash
git checkout <commit-before-change> -- docker-compose.yml
git checkout <commit-before-change> -- docker-compose.dev.yml
# etc.
```

**Step 4: Make repository public again** GitHub Settings → Change visibility → Public

**Important commit to reference:**

```
Last open-source commit: 45c6863 (before this transition)
Date: January 27, 2026
Tag: Create with `git tag -a "last-open-source" 45c6863 -m "Last MIT-licensed version"`
```

---

## 13. FAQ and Troubleshooting

### Q: Can existing forks sue me?

**A:** No. You're not revoking their rights. You're just not granting new rights.

### Q: What if an employee leaks the source code?

**A:** This is a legal matter. Ensure employees sign NDAs. The proprietary license gives you legal
standing to pursue action.

### Q: Can I still use open-source dependencies?

**A:** Yes! Your LICENSE covers YOUR code. Dependencies keep their own licenses. Just avoid AGPL
dependencies (viral copyleft).

### Q: What about the API? Can people build apps?

**A:** You can offer a public API like Discord does. Document it separately from your source code.

### Q: Do I need a lawyer?

**A:** Strongly recommended for:

- Reviewing the proprietary license
- Verifying CLA is enforceable
- Handling any existing contributor situations
- DMCA actions

### Q: What if I want to open-source parts later?

**A:** You can always re-license YOUR code. You cannot re-license contributor code without their
permission (hence the importance of CLA).

---

## 14. Checklist for Completion

### Phase 1: Legal Foundation ✅

- [x] Replace LICENSE with proprietary license
- [x] Update root package.json license field
- [x] Create CLA.md
- [x] Update CONTRIBUTING.md
- [x] Update SECURITY.md
- [x] Update all apps/\*/package.json license fields (no explicit fields, inherit from root)
- [x] Update all packages/\*/package.json license fields
- [x] Verify no external contributors (or get permission)

### Phase 2: Repository Restructuring

- [ ] Make GitHub repository private
- [ ] Create public marketing repository
- [ ] Move CI/CD to appropriate location
- [ ] Update GitHub org settings

### Phase 3: Remove Self-Hosting

- [ ] Delete docker-compose.yml
- [ ] Delete docker-compose.dev.yml
- [ ] Delete infrastructure/docker/
- [ ] Delete or move infrastructure/terraform/
- [ ] Delete all .env.example files
- [x] Update README.md
- [x] Update docs/CHAT_SYSTEM_STATUS_2026_01_27.md
- [ ] Delete QUICKSTART_NEW_UI.md
- [ ] Review all docs/ for self-hosting mentions

### Phase 4: Payment Integration

- [ ] Create Stripe account
- [ ] Add Stripe products
- [ ] Add stripity_stripe to backend
- [ ] Implement webhook handler
- [ ] Connect frontend to Stripe Checkout
- [ ] Test payment flow end-to-end
- [ ] Enable production mode

### Phase 5: Code Protection

- [ ] Verify repo is private
- [ ] Verify sourcemaps disabled in production
- [ ] Review sensitive code locations
- [ ] Enable Hermes for mobile (optional)

### Phase 6: Ongoing Operations

- [ ] Set up monitoring for unauthorized forks
- [ ] Create DMCA template
- [ ] Schedule annual legal review
- [ ] Document incident response process

---

## Appendix A: Commands Reference

### Check Contributors

```bash
cd /CGraph
git shortlog -sne --all
```

### Find All License Fields

```bash
cd /CGraph
grep -r '"license"' --include="package.json" .
```

### Find Self-Hosting References in Docs

```bash
cd /CGraph
grep -ri "self-host\|docker\|docker-compose" --include="*.md" .
```

### Create Git Tag Before Transition

```bash
git tag -a "last-open-source" -m "Last MIT-licensed version before proprietary transition"
git push origin "last-open-source"
```

---

## Appendix B: Key Contacts

**Legal Counsel:** [Add your lawyer's contact]

**Stripe Account:** [Add Stripe account email]

**Domain Registrar:** [Add registrar for cgraph.app]

**Hosting:**

- Frontend: Vercel
- Backend: Fly.io (Frankfurt)
- Database: Supabase (Europe)

---

## Appendix C: Financial Projections (Template)

| Tier       | Price | Target Users | Monthly Revenue |
| ---------- | ----- | ------------ | --------------- |
| Free       | $0    | 100,000      | $0              |
| Premium    | $9    | 5,000        | $45,000         |
| Enterprise | $99   | 50           | $4,950          |
| **Total**  |       | 105,050      | **$49,950**     |

---

## Document History

| Version | Date         | Author       | Changes          |
| ------- | ------------ | ------------ | ---------------- |
| 1.0.0   | Jan 27, 2026 | AI Assistant | Initial creation |

---

**END OF DOCUMENT**

This document is proprietary and confidential. Do not share outside the CGraph team.
