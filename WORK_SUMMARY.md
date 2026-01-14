# CGraph Work Summary

> **Version:** 0.9.1  
> **Last Updated:** January 14, 2026  
> **Status:** Active Development

---

## Quick Project Overview

CGraph is an all-in-one open-source communication platform with:

- **End-to-End Encryption** - Signal Protocol (Double Ratchet)
- **Real-Time Messaging** - Phoenix Channels, sub-50ms latency
- **Community Forums** - MyBB-style with Reddit-style discovery
- **Gamification** - XP, levels, achievements, quests, streaks
- **Cross-Platform** - Web (React), Mobile (React Native), Backend (Elixir/Phoenix)

---

## Repository Structure

```
CGraph/
├── apps/
│   ├── web/          # React + Vite + TailwindCSS
│   ├── mobile/       # React Native + Expo
│   └── backend/      # Elixir + Phoenix + PostgreSQL
├── packages/
│   ├── shared/       # Shared types, utils, constants
│   ├── crypto/       # Signal Protocol encryption
│   └── ui/           # Shared UI components
├── docs/             # Documentation
│   ├── guides/       # How-to guides
│   ├── api/          # API reference
│   ├── architecture/ # System design
│   ├── release-notes/# Version history
│   └── archive/      # Completed/historical docs
└── infrastructure/   # Docker, Kubernetes, CI/CD
```

---

## Current Implementation Status

### ✅ Fully Implemented

| Feature                                 | Web | Mobile | Backend |
| --------------------------------------- | :-: | :----: | :-----: |
| Authentication (Email/Password)         | ✅  |   ✅   |   ✅    |
| Real-Time Messaging                     | ✅  |   ✅   |   ✅    |
| Forum System (Posts, Comments, Voting)  | ✅  |   ✅   |   ✅    |
| Gamification (XP, Levels, Achievements) | ✅  |   ✅   |   ✅    |
| E2E Encryption Infrastructure           | ✅  |   ✅   |   ✅    |
| UI Components (GlassCard, Animations)   | ✅  |   ✅   |   N/A   |
| Avatar Customization                    | ✅  |   ✅   |   ✅    |
| Thread Prefixes & Ratings               | ✅  |   ✅   |   ✅    |
| Poll System                             | ✅  |   ✅   |   ✅    |
| File Attachments                        | ✅  |   ✅   |   ✅    |

### 🔄 Integration Pending (Hooks Exist, Backend Connection Needed)

| Feature               | Status            | Files to Update                                     |
| --------------------- | ----------------- | --------------------------------------------------- |
| Premium Subscriptions | Hooks placeholder | `apps/web/src/features/premium/hooks/usePremium.ts` |
| Coin System           | Hooks placeholder | `apps/web/src/features/premium/hooks/useCoins.ts`   |
| 2FA Authentication    | Hooks placeholder | `apps/web/src/features/auth/hooks/useAuth.ts`       |
| Session Management    | Hooks placeholder | `apps/web/src/features/auth/hooks/useAuth.ts`       |
| Group Permissions     | Hooks placeholder | `apps/web/src/features/groups/hooks/useGroups.ts`   |

### 📋 Planned for v0.9.0

| Feature                  | Priority | Notes                 |
| ------------------------ | -------- | --------------------- |
| WebRTC Voice/Video Calls | High     | Infrastructure exists |
| Matrix Federation        | Medium   | Spec research done    |
| Advanced Moderation AI   | Medium   | Content filtering     |
| Plugin Marketplace       | Low      | Architecture designed |

---

## Key Documentation

| Document                                                               | Purpose                           |
| ---------------------------------------------------------------------- | --------------------------------- |
| [README.md](README.md)                                                 | Project overview and quick start  |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                     | How to contribute                 |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)                     | Developer standards and practices |
| [docs/guides/QUICKSTART.md](docs/guides/QUICKSTART.md)                 | Getting started guide             |
| [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md)                 | Complete API documentation        |
| [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | System architecture               |
| [CHANGELOG.md](CHANGELOG.md)                                           | Version history                   |

---

## Getting Started (Quick Commands)

```bash
# Clone and setup
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph
pnpm install

# Start development
pnpm web          # Web app (localhost:5173)
pnpm mobile       # Mobile app (Expo)
pnpm backend:start # Backend (localhost:4000)

# Run tests
pnpm test

# Build for production
pnpm build
```

---

## Known Issues & TODOs

### Critical (64 items tracked)

- DDD feature hooks are placeholders needing backend integration
- Premium/Coins hooks return stub data
- Voice recorder needs expo-av implementation

### See Full List

- Code TODOs: `grep -r "TODO" apps/`
- Implementation gaps: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

## Recent Changes (v0.9.1)

- CI now builds backend and web Docker images each PR to validate health checks early.
- Security workflow runs gitleaks, hadolint (backend/web Dockerfiles), Sobelow, pnpm audit, Syft SBOM, and Grype vulnerability scan with artifacts uploaded.
- Context7 MCP helper noted in `.vscode/mcp.json`; supply your own API key when prompted.

---

## Contact & Resources

- **GitHub:** https://github.com/cgraph-dev/CGraph
- **Discord:** https://discord.gg/cgraph
- **Documentation Site:** Run `cd docs-website && pnpm start`
