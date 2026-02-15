# CGraph Product Roadmap

> **Version: 0.9.24** | Last Updated: February 2026 **Status:** Pre-Launch → Public Beta Target: Q2
> 2026

---

## Vision Statement

CGraph aims to be the **most trusted collaboration platform** for communities, teams, and
creators—combining the best of CGraph's real-time experience with **end-to-end encryption by
default** and modern customization.

---

## Release Timeline

```
            2026
    ┌─────────────────────────────────────────────────────────────┐
    │ Q1          │ Q2          │ Q3          │ Q4                │
    ├─────────────┼─────────────┼─────────────┼───────────────────┤
    │ v0.9.x      │ v1.0        │ v1.1        │ v1.2              │
    │ Pre-Launch  │ Public Beta │ Growth      │ Enterprise        │
    │             │             │             │                   │
    │ • Security  │ • Launch    │ • Mobile GA │ • Self-hosting    │
    │   audit     │ • Mobile    │ • Threads   │ • Admin console   │
    │ • Stability │   beta      │ • Reactions │ • SSO/SAML        │
    │ • Polish    │ • Forums    │   expansion │ • Audit logs UI   │
    │             │             │             │                   │
    └─────────────┴─────────────┴─────────────┴───────────────────┘
```

---

## Current Release: v0.9.24 (February 2026)

> **Note:** Many features listed under v0.9.9–v1.1 milestones below have already been implemented
> (e.g., Polls, Events, Reactions, Moderation Tools, Push Notifications). See
> `docs/PROJECT_STATUS.md` for accurate feature completion tracking (59/69 features, 85%).

### ✅ Completed Features

| Category           | Feature                | Status     |
| ------------------ | ---------------------- | ---------- |
| **Core Messaging** | Real-time channels     | ✅ Shipped |
|                    | Direct messages (E2EE) | ✅ Shipped |
|                    | Group DMs (E2EE)       | ✅ Shipped |
|                    | Message editing        | ✅ Shipped |
|                    | Message deletion       | ✅ Shipped |
|                    | Message forwarding     | ✅ Shipped |
|                    | Message scheduling     | ✅ Shipped |
| **Voice/Video**    | Voice channels         | ✅ Shipped |
|                    | Video calls            | ✅ Shipped |
|                    | Screen sharing         | ✅ Shipped |
| **Security**       | E2EE (Signal Protocol) | ✅ Shipped |
|                    | Device verification    | ✅ Shipped |
|                    | Safety numbers         | ✅ Shipped |
| **Media**          | File sharing           | ✅ Shipped |
|                    | GIF integration        | ✅ Shipped |
|                    | Image previews         | ✅ Shipped |
| **Customization**  | Theme system           | ✅ Shipped |
|                    | Custom CSS             | ✅ Shipped |
|                    | Seasonal events        | ✅ Shipped |
| **Platform**       | Web app                | ✅ Shipped |
|                    | Mobile (React Native)  | 🟡 Beta    |
|                    | Landing page           | ✅ Shipped |

---

## v0.9.9 - Pre-Launch Hardening (February 2026)

**Theme:** Security audit, bug fixes, performance

**Release Date:** Week of February 17, 2026

### Planned Work

| Priority | Task                              | Owner    | Status         |
| -------- | --------------------------------- | -------- | -------------- |
| P0       | External E2EE audit completion    | Security | 🔄 In Progress |
| P0       | Penetration test remediation      | Security | 🔄 In Progress |
| P1       | Performance optimization pass     | Platform | 📋 Planned     |
| P1       | Mobile crash fixes                | Mobile   | 📋 Planned     |
| P1       | Accessibility audit (WCAG 2.1 AA) | Frontend | 📋 Planned     |
| P2       | Error message improvements        | UX       | 📋 Planned     |
| P2       | Onboarding flow polish            | Product  | 📋 Planned     |

### Feature Freeze

**Date:** February 10, 2026

After this date, only the following are allowed:

- Security fixes
- Critical bug fixes
- Performance improvements
- Documentation updates

---

## v1.0.0 - Public Beta Launch (March 2026)

**Theme:** Public launch, mobile beta, forums

**Target Date:** March 17, 2026 (St. Patrick's Day 🍀)

### New Features

| Feature            | Description                              | Priority |
| ------------------ | ---------------------------------------- | -------- |
| **Public Servers** | Discoverable community servers           | P0       |
| **Invite System**  | Shareable invite links                   | P0       |
| **Forum Channels** | Threaded forum-style discussions         | P1       |
| **Mobile Beta**    | iOS/Android public TestFlight/Play Store | P0       |
| **Bot API v1**     | Initial bot/integration framework        | P2       |

### Launch Checklist

- [ ] Security audit report published
- [ ] Mobile apps in TestFlight/Play Store
- [ ] Status page live (status.cgraph.org)
- [ ] Support ticketing system ready
- [ ] Community CGraph/server seeded
- [ ] Press kit and launch blog post
- [ ] Analytics and error tracking verified

---

## v1.1.0 - Community Growth (June 2026)

**Theme:** Engagement features, mobile GA

### Planned Features

| Feature                | Description                 | Priority |
| ---------------------- | --------------------------- | -------- |
| **Threads**            | Message threads in channels | P1       |
| **Reaction Expansion** | Custom server emojis        | P1       |
| **Polls**              | Native polling in channels  | P2       |
| **Events**             | Scheduled server events     | P2       |
| **Mobile GA**          | Full mobile app release     | P0       |
| **Push Notifications** | Rich push for mobile        | P0       |
| **Moderation Tools**   | AutoMod, ban appeals        | P1       |

---

## v1.2.0 - Enterprise Ready (September 2026)

**Theme:** Self-hosting, enterprise features

### Planned Features

| Feature               | Description                   | Priority |
| --------------------- | ----------------------------- | -------- |
| **Self-Hosting**      | Docker/Kubernetes deployment  | P1       |
| **Admin Console**     | Web-based server management   | P1       |
| **SSO/SAML**          | Enterprise identity providers | P1       |
| **Audit Logs UI**     | Visual audit log viewer       | P2       |
| **Compliance Export** | GDPR, legal hold exports      | P2       |
| **SLA Tiers**         | Uptime guarantees             | P2       |

---

## Long-Term Vision (2027+)

### Exploration Areas

| Area                       | Description                      | Timeline  |
| -------------------------- | -------------------------------- | --------- |
| **AI Features**            | Smart summarization, translation | H1 2027   |
| **Federated Messaging**    | Cross-instance communication     | H2 2027   |
| **Desktop Apps**           | Native Electron/Tauri apps       | H1 2027   |
| **Post-Quantum Crypto**    | PQXDH migration                  | 2027-2028 |
| **Decentralized Identity** | DID/Verifiable credentials       | 2028+     |

---

## Release Process

### Versioning (SemVer)

- **Major (X.0.0):** Breaking changes, major milestones
- **Minor (0.X.0):** New features, backward compatible
- **Patch (0.0.X):** Bug fixes, security patches

### Release Cadence

| Release Type | Frequency | Branch |
| ------------ | --------- | ------ |
| Major        | 6 months  | `main` |
| Minor        | 6-8 weeks | `main` |
| Patch        | As needed | `main` |
| Hotfix       | Emergency | `main` |

### Quality Gates

Before any release:

- [ ] All CI checks passing
- [ ] No P0/P1 bugs open
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Changelog updated
- [ ] Documentation current

---

## Feature Freeze Policy

### When Feature Freeze Applies

Feature freezes are declared 2 weeks before major releases (x.0.0).

### What's Allowed During Freeze

| Allowed               | Not Allowed                             |
| --------------------- | --------------------------------------- |
| ✅ Security fixes     | ❌ New features                         |
| ✅ Critical bug fixes | ❌ Refactoring                          |
| ✅ Performance fixes  | ❌ UI changes                           |
| ✅ Documentation      | ❌ Dependency updates (except security) |
| ✅ Test additions     | ❌ Experimental code                    |

### Freeze Exception Process

1. Create issue with `freeze-exception` label
2. Justify why this can't wait
3. Require approval from 2 maintainers
4. Must include rollback plan

---

## Success Metrics

### v1.0 Launch Targets

| Metric             | Target | Measurement    |
| ------------------ | ------ | -------------- |
| Daily Active Users | 1,000  | Analytics      |
| Messages Sent/Day  | 50,000 | Database       |
| Mobile App Rating  | 4.0+   | App Stores     |
| Error Rate         | <0.5%  | Sentry         |
| P95 Latency        | <200ms | Fly.io Metrics |
| Uptime             | 99.5%  | Status Page    |

### v1.0 → v1.2 Growth Targets

| Metric               | v1.0 | v1.1 | v1.2 |
| -------------------- | ---- | ---- | ---- |
| DAU                  | 1K   | 10K  | 50K  |
| Servers              | 100  | 1K   | 5K   |
| Mobile Users         | 20%  | 40%  | 50%  |
| Enterprise Customers | 0    | 5    | 25   |

---

## How to Provide Feedback

### Community Channels

- **GitHub Discussions:** Feature requests, ideas
- **GitHub Issues:** Bug reports
- **CGraph/CGraph Server:** Real-time chat
- **Email:** feedback@cgraph.app

### Prioritization Framework

We prioritize based on:

1. **Impact:** How many users affected?
2. **Effort:** How complex to implement?
3. **Alignment:** Does it fit our vision?
4. **Security:** Does it improve trust?

---

<sub>**CGraph Product Roadmap** • Version 0.9.24 • Last updated: February 2026</sub>
