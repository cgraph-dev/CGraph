/**
 * Enterprise Module Types
 *
 * Type definitions for SSO, organizations, compliance, analytics,
 * and admin console enterprise features.
 */

// ============================================================================
// Organizations
// ============================================================================

export type OrgRole = 'owner' | 'admin' | 'member';
export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: SubscriptionTier;
  logoUrl: string | null;
  maxMembers: number;
  ownerId: string;
  insertedAt: string;
  updatedAt: string;
}

export interface OrgMembership {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  insertedAt: string;
  user?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface OrgSettings {
  id: string;
  orgId: string;
  ssoEnabled: boolean;
  allowedDomains: string[];
  defaultRole: string;
  maxGroups: number;
  features: Record<string, boolean>;
  branding: Record<string, string>;
  dataRegion: string;
  updatedAt: string;
}

// ============================================================================
// SSO
// ============================================================================

export type SSOProviderType = 'saml' | 'oidc';

export interface SSOProvider {
  id: string;
  name: string;
  type: SSOProviderType;
  enabled: boolean;
  orgId: string;
  insertedAt: string;
  updatedAt?: string;
}

export interface SSOInitiateResponse {
  redirectUrl: string;
}

export interface SSOCallbackResponse {
  user: Record<string, unknown>;
  token: string;
  provider: string;
}

// ============================================================================
// Compliance
// ============================================================================

export type ComplianceFramework = 'soc2' | 'gdpr' | 'hipaa';
export type ComplianceCheckStatus = 'compliant' | 'non_compliant' | 'error';

export interface ComplianceCheck {
  name: string;
  description: string;
  passed: boolean;
}

export interface ComplianceReport {
  framework: ComplianceFramework;
  status: ComplianceCheckStatus;
  score: number;
  checks: ComplianceCheck[];
  generatedAt: string;
}

export interface ComplianceStatus {
  frameworks: Array<{
    framework: ComplianceFramework;
    score: number;
    status: ComplianceCheckStatus;
  }>;
  overallScore: number;
  lastAuditAt: string | null;
}

export interface DataRegion {
  id: string;
  name: string;
  available: boolean;
}

// ============================================================================
// White Label
// ============================================================================

export interface WhiteLabelBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  fontFamily: string;
  appName: string;
}

// ============================================================================
// Analytics
// ============================================================================

export interface AnalyticsOverview {
  users: { total: number };
  groups: { total: number };
  organizations: { total: number };
  messages: { today: number };
  generatedAt: string;
}

export interface AnalyticsTimeSeriesPoint {
  date: string;
  value: number;
}

export interface OrgBreakdown {
  orgId: string;
  members: number;
  groups: number;
  generatedAt: string;
}

// ============================================================================
// Enterprise Admin Console
// ============================================================================

export type AdminRoleName = 'super_admin' | 'admin' | 'moderator' | 'analyst';

export interface EnterpriseAdminRole {
  id: string;
  name: AdminRoleName;
  description: string | null;
  permissions: Record<string, boolean>;
  insertedAt?: string;
}

export interface EnterpriseAdminUser {
  id: string;
  email: string;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  roleId: string;
  userId: string;
  permissions: Record<string, boolean>;
  insertedAt: string;
}

export interface EnterpriseAuditEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  changesBefore: Record<string, unknown> | null;
  changesAfter: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  adminId: string;
  insertedAt: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface PaginationMeta {
  cursor: string | null;
  hasMore: boolean;
  total: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  data: T;
}
