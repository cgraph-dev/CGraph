# CGraph Documentation

> **Current Version: 0.9.8** | Enterprise-grade real-time communication platform

⚠️ **Proprietary Software** - CGraph is proprietary software. Self-hosting is not permitted.

Welcome to the official CGraph documentation. This resource provides comprehensive guidance for
developers and users of our hosted platform.

---

## 📊 Project Status

| Document                                                  | Description                                 |
| --------------------------------------------------------- | ------------------------------------------- |
| [**Current State Dashboard**](CURRENT_STATE_DASHBOARD.md) | Real-time project health overview           |
| [**Project Status**](PROJECT_STATUS.md)                   | Feature tracking, architecture, and roadmap |
| [**Codebase Audit Report**](CODEBASE_AUDIT_REPORT.md)     | Full codebase quality review                |

---

## 🔒 Quality & Security

| Document                                                    | Description                            |
| ----------------------------------------------------------- | -------------------------------------- |
| [**Quality Gates**](QUALITY_GATES.md)                       | CI requirements and enforcement policy |
| [**CGraph Essentials**](CGRAPH_ESSENTIALS.md)               | The 20 rules that matter most          |
| [**Security Review Tracking**](SECURITY_REVIEW_TRACKING.md) | Audit schedule and findings            |
| [**Code Standards**](CODE_SIMPLIFICATION_GUIDELINES.md)     | Comprehensive coding guidelines        |

---

## 🏗️ Architecture

| Document                                                     | Description                          |
| ------------------------------------------------------------ | ------------------------------------ |
| [**Architecture Diagrams**](ARCHITECTURE_DIAGRAMS.md)        | Visual system architecture (Mermaid) |
| [**Schema Ownership**](SCHEMA_OWNERSHIP.md)                  | Database table ownership matrix      |
| [**Architecture Decision Records**](architecture/decisions/) | Why we chose what we chose           |

---

## 📖 Operations & API

| Document                                            | Description                    |
| --------------------------------------------------- | ------------------------------ |
| [**Operational Runbooks**](OPERATIONAL_RUNBOOKS.md) | Deployment, incidents, DB ops  |
| [**API Documentation**](API_DOCUMENTATION.md)       | REST & WebSocket API reference |
| [**Testing Strategy**](TESTING_STRATEGY.md)         | Test pyramid and examples      |
| [**Security Testing**](SECURITY_TESTING.md)         | Security test framework        |
| [**Threat Model**](THREAT_MODEL.md)                 | STRIDE analysis & mitigations  |

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
| [User Guide](guides/USER_GUIDE.md)       | Complete end-user documentation |
| [Contributing](../CONTRIBUTING.md)       | How to contribute to CGraph     |

### Developer Guides

| Document                           | Description                   |
| ---------------------------------- | ----------------------------- |
| [Deployment](guides/DEPLOYMENT.md) | Production deployment guide   |
| [Frontend](guides/FRONTEND.md)     | Web application documentation |
| [Mobile](guides/MOBILE.md)         | React Native mobile app guide |
| [Security](guides/SECURITY.md)     | Security best practices       |

### API Reference

| Document                              | Description                     |
| ------------------------------------- | ------------------------------- |
| [API Overview](api/API.md)            | REST API introduction           |
| [API Reference](api/API_REFERENCE.md) | Detailed endpoint documentation |
| [OpenAPI Spec](api/openapi.yaml)      | OpenAPI 3.0 specification       |

### Architecture

| Document                                                          | Description                     |
| ----------------------------------------------------------------- | ------------------------------- |
| [Architecture Overview](architecture/ARCHITECTURE.md)             | System architecture             |
| [Database Design](architecture/DATABASE.md)                       | Schema and data model           |
| [Database Scaling](architecture/DATABASE_SCALING.md)              | Scaling strategies              |
| [Presence System](architecture/PRESENCE_ARCHITECTURE.md)          | Real-time presence architecture |
| [Real-time Communication](architecture/REALTIME_COMMUNICATION.md) | WebSocket implementation        |
| [Technical Overview](architecture/TECHNICAL_OVERVIEW.md)          | Technical deep-dive             |
| [AI Integration](architecture/AI_INTEGRATION.md)                  | Future AI features (Claude)     |

---

## 📋 Release Notes

| Version                                             | Date         | Highlights                                                   |
| --------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| [**v0.9.6**](release-notes/V0.9.6_RELEASE_NOTES.md) | January 2026 | **Latest** - Avatar borders everywhere, deployment readiness |
| [v0.9.5](release-notes/V0.9.5_RELEASE_NOTES.md)     | January 2026 | Security hardening, Stripe payments                          |
| [v0.9.4](release-notes/V0.9.4_RELEASE_NOTES.md)     | January 2026 | Proprietary transition, code protection                      |
| [v0.9.2](release-notes/V0.9.2_RELEASE_NOTES.md)     | January 2026 | Friend request idempotency, scroll fixes                     |
| [v0.9.1](release-notes/V0.9.1_RELEASE_NOTES.md)     | January 2026 | Chat message editing, typing indicators                      |
| [v0.9.0](release-notes/V0.9.0_RELEASE_NOTES.md)     | January 2026 | Major release - new architecture                             |
| [All Releases →](release-notes/)                    |              | Complete version history                                     |

---

## 🔐 Security & CI/CD

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

| Resource          | Link                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| Source Code       | [github.com/cgraph-dev/CGraph](https://github.com/cgraph-dev/CGraph) |
| Official Website  | [cgraph.org](https://www.cgraph.org)                                 |
| Community Discord | [discord.gg/cgraph](https://discord.gg/cgraph)                       |
| Security Policy   | [SECURITY.md](../SECURITY.md)                                        |
| Code of Conduct   | [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)                          |

---

## 📁 Documentation Structure

```
docs/
├── README.md                 # This index file
├── api/                      # API documentation
│   ├── API.md
│   ├── API_REFERENCE.md
│   └── openapi.yaml
├── architecture/             # System architecture
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── PRESENCE_ARCHITECTURE.md
│   └── decisions/            # Architecture Decision Records
├── guides/                   # User and developer guides
│   ├── QUICKSTART.md
│   ├── DEPLOYMENT.md
│   ├── USER_GUIDE.md
│   └── ...
├── release-notes/            # Version history (v0.7.x - v0.9.x)
├── LEGAL/                    # Privacy policy & Terms of Service
└── archive/                  # Historical documentation
```

---

## 📦 Archive

Historical and completed documentation is preserved in [archive/](archive/). These documents contain
outdated information but are retained for historical reference and audit purposes.

---

<sub>**CGraph Documentation** • Version 0.9.8 • Proprietary Software • Last updated: January
2026</sub>
