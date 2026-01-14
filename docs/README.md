# CGraph Documentation

Welcome to the CGraph documentation. This documentation is organized into the following sections:

## 📚 Documentation Sections

### [Guides](guides/)

Getting started, deployment, and operational guides for CGraph.

- [Quickstart](guides/QUICKSTART.md) - Get up and running in 5 minutes
- [User Guide](guides/USER_GUIDE.md) - Complete user documentation
- [Deployment](guides/DEPLOYMENT.md) - Production deployment guide
- [Mobile](guides/MOBILE.md) - Mobile app documentation
- [Frontend](guides/FRONTEND.md) - Web frontend documentation
- [Security](guides/SECURITY.md) - Security best practices
- [Context7 Helper](guides/CONTEXT7_HELPER.md) - Using the MCP assistant safely

### [API Reference](api/)

Complete API documentation and OpenAPI specifications.

- [API Overview](api/API.md) - REST API introduction
- [API Reference](api/API_REFERENCE.md) - Detailed endpoint documentation
- [OpenAPI Spec](api/openapi.yaml) - OpenAPI 3.0 specification

### [Architecture](architecture/)

System design, database schema, and technical architecture.

- [Architecture Overview](architecture/ARCHITECTURE.md) - System architecture
- [Database](architecture/DATABASE.md) - Database schema and design
- [Database Scaling](architecture/DATABASE_SCALING.md) - Scaling strategies
- [Presence Architecture](architecture/PRESENCE_ARCHITECTURE.md) - Real-time presence
- [Real-time Communication](architecture/REALTIME_COMMUNICATION.md) - WebSocket architecture
- [Technical Overview](architecture/TECHNICAL_OVERVIEW.md) - Technical deep-dive

### [Release Notes](release-notes/)

Version history and changelog for all releases.

- [V0.7.57](release-notes/V0.7.57_RELEASE_NOTES.md) - Latest stable
- [V0.7.56](release-notes/V0.7.56_RELEASE_NOTES.md)
- [V0.7.47](release-notes/V0.7.47_RELEASE_NOTES.md)
- [V0.7.45](release-notes/V0.7.45_RELEASE_NOTES.md)
- [V0.7.44](release-notes/V0.7.44_RELEASE_NOTES.md)
- [All releases...](release-notes/)

### CI & Security Notes

- CI builds backend and web Docker images on every PR and runs gitleaks, hadolint (both Dockerfiles), Sobelow, pnpm audit, Syft SBOM generation, and Grype scanning; see `.github/workflows/ci.yml`.
- Context7 MCP helper is configured in `.vscode/mcp.json`; supply your own `CONTEXT7_API_KEY` when prompted.

---

## 🚀 Quick Links

| Resource                                       | Description       |
| ---------------------------------------------- | ----------------- |
| [GitHub](https://github.com/cgraph-dev/CGraph) | Source code       |
| [Website](https://www.cgraph.org)              | Official website  |
| [Discord](https://discord.gg/cgraph)           | Community chat    |
| [Contributing](guides/CONTRIBUTING.md)         | How to contribute |

---

## 📖 Documentation Structure

```
docs/
├── README.md              # This file
├── api/                   # API documentation
│   ├── API.md
│   ├── API_REFERENCE.md
│   └── openapi.yaml
├── architecture/          # System architecture
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── decisions/         # ADRs
├── guides/                # User and developer guides
│   ├── QUICKSTART.md
│   ├── DEPLOYMENT.md
│   └── ...
├── release-notes/         # Version history
│   └── V0.7.XX_RELEASE_NOTES.md
├── LEGAL/                 # Privacy & Terms
└── archive/               # Historical docs (30+ files)
```

---

## 📁 Archive

Historical and completed documentation is preserved in [archive/](archive/). These documents may
contain outdated information but are kept for reference.

---

_Version: 0.9.1 | Last updated: January 14, 2026_
