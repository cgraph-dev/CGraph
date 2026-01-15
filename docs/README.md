# CGraph Documentation

> **Current Version: 0.9.2** | Enterprise-grade real-time communication platform

Welcome to the official CGraph documentation. This resource provides comprehensive guidance for
developers, operators, and contributors.

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

---

## 📋 Release Notes

| Version                                             | Date          | Highlights                                            |
| --------------------------------------------------- | ------------- | ----------------------------------------------------- |
| [**v0.9.2**](release-notes/V0.9.2_RELEASE_NOTES.md) | January 2026  | **Latest** - Friend request idempotency, scroll fixes |
| [v0.9.1](release-notes/V0.9.1_RELEASE_NOTES.md)     | January 2026  | Chat message editing, typing indicators               |
| [v0.9.0](release-notes/V0.9.0_RELEASE_NOTES.md)     | January 2026  | Major release - new architecture                      |
| [v0.7.57](release-notes/V0.7.57_RELEASE_NOTES.md)   | December 2025 | Legacy stable                                         |
| [All Releases →](release-notes/)                    |               | Complete version history                              |

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

<sub>**CGraph Documentation** • Version 0.9.2 • Last updated: January 2026</sub>
