# Phase 39: Enterprise + Desktop - Context

**Gathered:** 2026-03-11 **Status:** Ready for execution

<domain>
## Phase Boundary

Enterprise features for organizational deployment. Admin console with org/user management. SSO (SAML
2.0 + OIDC). Self-hosting package (Docker Compose + Helm). Desktop apps (Electron/Tauri). Enterprise
audit logging. Data residency controls. Custom branding / white-label. API rate limiting tiers.
Corresponds to ATOMIC_PLAN v2.1 Phase 6 (Tasks 6.1–6.8).

Version target: v2.0.0

</domain>

<decisions>
## Implementation Decisions

### Admin Console (6.1 — 80h)

- Organization management: create/edit/delete orgs, member management
- User management: CRUD, role assignment, suspension, data export
- Analytics dashboard: usage metrics, engagement, revenue
- Full-stack: backend API + web admin panel

### SSO Integration (6.2 — 40h)

- SAML 2.0 + OpenID Connect (OIDC) for enterprise customers
- Identity provider configuration UI
- Just-in-time user provisioning
- Session management integration with existing auth system

### Self-Hosting (6.3 — 40h)

- Docker Compose stack: all services in single compose file
- Helm chart: Kubernetes deployment for production
- Documentation: installation guide, configuration reference, upgrade guide
- Environment variable catalog for all configuration options

### Desktop Apps (6.4 — 60h)

- Electron or Tauri wrapper for web app
- Native notifications
- System tray integration
- Auto-update mechanism
- macOS + Windows + Linux builds

### Enterprise Features (6.5–6.8)

- Audit logging: enterprise-grade activity logs with export (24h)
- Data residency: region selection EU/US/APAC (30h)
- Custom branding: white-label option with custom colors/logos (20h)
- API rate limiting tiers: Free/Pro/Enterprise with configurable limits (12h)

</decisions>

<specifics>
## Specific Ideas

- Admin console: real-time user count, message volume graphs
- SSO: test mode with mock IdP for development
- Self-hosting: one-command setup script
- Desktop: deep link handling for cgraph:// protocol
- Branding: CSS variable override system for white-label

</specifics>

<deferred>
## Deferred Ideas

- Mobile MDM (Mobile Device Management) integration
- SCIM provisioning for automated user sync
- Custom plugin marketplace for enterprise
- On-premise deployment with air-gap support

</deferred>

---

_Phase: 39-enterprise-desktop_ _Context gathered: 2026-03-11_
