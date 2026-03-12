# Phase 39: Enterprise Features - Context

**Gathered:** 2026-03-11 **Status:** Ready for execution

<domain>
## Phase Boundary

Enterprise features for CGraph as a hosted platform (like Reddit/Discord). Admin console with
org/user management. SSO (SAML 2.0 + OIDC). Enterprise Organization model (org-level subscriptions,
settings, group ownership). Enterprise audit logging. Data residency controls. Custom branding /
white-label. API rate limiting tiers.

**REMOVED:** Self-hosting (Task 6.3) — CGraph hosts everything. No on-premise deployment.
**DEFERRED:** Desktop app (Task 6.4) — enterprise and normal users use the same web/mobile app.

Corresponds to ATOMIC_PLAN v2.1 Phase 6 (Tasks 6.1, 6.2, 6.5–6.8 + new Enterprise Org model).

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
- SSOProvider tied to Organization (org_id FK), not tenants

### Enterprise Organizations (replaces 6.3 + 6.4 — ~40h)

- Organization schema: name, slug, owner, subscription_tier, settings
- OrgSettings: SSO config, allowed email domains, feature flags, branding
- OrgMembership: join table with roles (owner/admin/member)
- Groups can optionally belong to an Organization (optional org_id FK)
- Enterprise users login through the SAME web/mobile app — no separate portal
- Org-level subscription covers all members

### Enterprise Features (6.5–6.8)

- Audit logging: enterprise-grade activity logs with export (24h)
- Data residency: region selection EU/US/APAC for enterprise orgs (30h)
- Custom branding: white-label via OrgSettings.branding (20h)
- API rate limiting tiers: Free/Premium/Enterprise with configurable limits (12h)

</decisions>

<specifics>
## Specific Ideas

- Admin console: real-time user count, message volume graphs
- SSO: test mode with mock IdP for development
- Branding: CSS variable override system for white-label via OrgSettings
- Organization dashboard: member activity, group usage, subscription status

</specifics>

<deferred>
## Deferred Ideas

- Desktop application (Electron/Tauri wrapper for web app)
- Mobile MDM (Mobile Device Management) integration
- SCIM provisioning for automated user sync
- Custom plugin marketplace for enterprise
- On-premise / self-hosted deployment

</deferred>

---

_Phase: 39-enterprise-desktop_ _Context gathered: 2026-03-11_
