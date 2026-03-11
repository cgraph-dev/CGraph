# CGraph Documentation

> **Current Version: 1.0.0** | Enterprise-grade real-time communication platform

⚠️ **Proprietary Software** - CGraph is proprietary software. Self-hosting is not permitted.

Welcome to the official CGraph documentation. This resource provides comprehensive guidance for
developers and users of our hosted platform.

---

## 🏗️ Architecture (START HERE)

| Document                                                    | Description                              |
| ----------------------------------------------------------- | ---------------------------------------- |
| [**CLAUDE.md**](../CLAUDE.md)                               | AI agent instructions & project overview |
| [**Architecture Diagrams**](ARCHITECTURE_DIAGRAMS.md)       | Visual system architecture (Mermaid)     |
| [**Architecture Enforcement**](ARCHITECTURE_ENFORCEMENT.md) | Layer boundary enforcement rules         |
| [**Schema Ownership**](SCHEMA_OWNERSHIP.md)                 | Database table ownership matrix          |

### Module Architecture (New in v0.9.31, updated v1.0.0)

```
apps/web/src/
├── modules/           # 12 feature modules (auth, chat, forums, etc.)
├── shared/            # Shared primitives (components, hooks, utils)
├── components/        # Application-level components
├── pages/             # Route pages
└── stores/            # Zustand state management
```

**Import patterns:**

```typescript
// Shared UI primitives
import { GlassCard, Button, toast } from '@/shared/components/ui';
import { useDebounce } from '@/shared/hooks';

// Module components
import { ChatWindow } from '@/modules/chat';
import { ForumPost } from '@/modules/forums';
```

---

## 📊 Product & Roadmap

| Document                          | Description                    |
| --------------------------------- | ------------------------------ |
| [**Product Roadmap**](ROADMAP.md) | Timeline, releases, and vision |

---

## 🔒 Quality & Security

| Document                                                    | Description                            |
| ----------------------------------------------------------- | -------------------------------------- |
| [**Quality Gates**](QUALITY_GATES.md)                       | CI requirements and enforcement policy |
| [**CGraph Essentials**](CGRAPH_ESSENTIALS.md)               | The 20 rules that matter most          |
| [**Security Review Tracking**](SECURITY_REVIEW_TRACKING.md) | Audit schedule and findings            |
| [**Security Audit Checklist**](SECURITY_AUDIT_CHECKLIST.md) | Pre-audit checklist                    |
| [**Security Testing**](SECURITY_TESTING.md)                 | Security test framework                |
| [**Threat Model**](THREAT_MODEL.md)                         | STRIDE analysis & mitigations          |

---

## 📖 Operations & API

| Document                                            | Description                    |
| --------------------------------------------------- | ------------------------------ |
| [**Operational Runbooks**](OPERATIONAL_RUNBOOKS.md) | Deployment, incidents, DB ops  |
| [**API Reference**](api/API_REFERENCE.md)           | REST & WebSocket API reference |
| [**API Contracts**](API_CONTRACTS.md)               | API contract definitions       |
| [**OpenAPI Spec**](api/openapi.yaml)                | OpenAPI 3.0 specification      |
| [**Testing Strategy**](TESTING_STRATEGY.md)         | Test pyramid and examples      |
| [**SLO Document**](SLO_DOCUMENT.md)                 | Service level objectives       |

---

## 🗺️ Product

| Document                          | Description                    |
| --------------------------------- | ------------------------------ |
| [**Product Roadmap**](ROADMAP.md) | Timeline, releases, and vision |

---

## 📚 Documentation Index

### Getting Started

| Document                                 | Description                     |
| ---------------------------------------- | ------------------------------- |
| [Quickstart Guide](guides/QUICKSTART.md) | Get up and running in 5 minutes |
| [Deployment](guides/DEPLOYMENT.md)       | Production deployment guide     |

### Developer Guides

| Document                                           | Description                   |
| -------------------------------------------------- | ----------------------------- |
| [Frontend](guides/FRONTEND.md)                     | Web application documentation |
| [Mobile](guides/MOBILE.md)                         | React Native mobile app guide |
| [Security](guides/SECURITY.md)                     | Security best practices       |
| [CI/CD Secrets](guides/CI_CD_SECRETS.md)           | Secrets management            |
| [Testing](guides/TESTING.md)                       | Testing guide                 |
| [Monitoring](guides/MONITORING.md)                 | Observability guide           |
| [Operations](guides/OPERATIONS.md)                 | Operations guide              |
| [Store Architecture](guides/STORE_ARCHITECTURE.md) | Zustand state management      |
| [Troubleshooting](guides/TROUBLESHOOTING.md)       | Common issues & fixes         |

### API Reference

| Document                              | Description                     |
| ------------------------------------- | ------------------------------- |
| [API Reference](api/API_REFERENCE.md) | Detailed endpoint documentation |
| [OpenAPI Spec](api/openapi.yaml)      | OpenAPI 3.0 specification       |

### Architecture

| Document                                                          | Description                     |
| ----------------------------------------------------------------- | ------------------------------- |
| [Architecture Overview](architecture/ARCHITECTURE.md)             | System architecture             |
| [Database Design](architecture/DATABASE.md)                       | Schema and data model           |
| [Presence System](architecture/PRESENCE_ARCHITECTURE.md)          | Real-time presence architecture |
| [Real-time Communication](architecture/REALTIME_COMMUNICATION.md) | WebSocket implementation        |
| [Technical Overview](architecture/TECHNICAL_OVERVIEW.md)          | Technical deep-dive             |
| [AI Integration](architecture/AI_INTEGRATION.md)                  | AI features (Claude)            |

### Architecture Decision Records (ADR)

| Document                                                          | Description               |
| ----------------------------------------------------------------- | ------------------------- |
| [ADR Index](adr/README.md)                                        | Complete list of ADRs     |
| [001 - Monorepo Structure](adr/001-monorepo-structure.md)         | Monorepo architecture     |
| [019 - Elixir/Phoenix Backend](adr/019-elixir-phoenix-backend.md) | Backend technology choice |
| [004 - Signal Protocol (E2EE)](adr/004-signal-protocol-e2ee.md)   | End-to-end encryption     |

### Feature Documentation

| Document                                              | Description                                   |
| ----------------------------------------------------- | --------------------------------------------- |
| [Customization System](CUSTOMIZATION_SYSTEM.md)       | Themes, avatars, cosmetics                    |
| [Gamification System](GAMIFICATION_SYSTEM.md)         | Achievements & rewards (historical reference) |
| [Components](COMPONENTS.md)                           | UI component reference                        |
| [Lottie Prompts](design/LOTTIE_GENERATION_PROMPTS.md) | Animation design specs                        |

### Legal

| Document                                                          | Description                     |
| ----------------------------------------------------------------- | ------------------------------- |
| [Terms of Service](LEGAL/TERMS_OF_SERVICE.md)                     | ToS                             |
| [Privacy Policy](LEGAL/PRIVACY_POLICY.md)                         | Privacy policy                  |
| [GDPR](LEGAL/GDPR.md)                                             | GDPR compliance                 |
| [Cookie Policy](LEGAL/COOKIE_POLICY.md)                           | Cookie usage                    |
| [DMCA Template](LEGAL/DMCA_TEMPLATE.md)                           | DMCA takedown                   |
| [Presence System](architecture/PRESENCE_ARCHITECTURE.md)          | Real-time presence architecture |
| [Real-time Communication](architecture/REALTIME_COMMUNICATION.md) | WebSocket implementation        |
| [Technical Overview](architecture/TECHNICAL_OVERVIEW.md)          | Technical deep-dive             |
| [AI Integration](architecture/AI_INTEGRATION.md)                  | Future AI features (Claude)     |

---

## � Security & CI/CD

- **CI Pipeline**: Automated builds on every PR with security scanning
  - Backend and web Docker image builds
  - Gitleaks secret scanning
  - Hadolint Dockerfile linting
  - Sobelow Elixir security analysis
  - pnpm audit for dependency vulnerabilities
  - Syft SBOM generation
  - Grype container scanning

See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) for full configuration.

---

## 🚀 Quick Links

| Resource         | Link                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| Source Code      | [github.com/cgraph-dev/CGraph](https://github.com/cgraph-dev/CGraph) |
| Official Website | [cgraph.org](https://www.cgraph.org)                                 |
| Security Policy  | [SECURITY.md](../SECURITY.md)                                        |

---

## 📁 Documentation Structure

```
docs/
├── README.md                 # This index file
├── adr/                      # Architecture Decision Records (11)
├── api/                      # API reference + OpenAPI spec
├── architecture/             # System architecture docs (6)
├── assets/                   # Brand assets (logo, favicon)
├── design/                   # Design specifications
├── guides/                   # Developer & operations guides (11)
├── LEGAL/                    # Privacy policy, ToS, GDPR, DMCA
└── *.md                      # Root-level reference docs
```

> Historical and completed documentation is preserved in [`.archived/`](../.archived/) with
> mirror-structure paths for easy recovery.

---

<sub>**CGraph Documentation** • Version 1.0.0 • Proprietary Software • Last updated: March
2026</sub>
