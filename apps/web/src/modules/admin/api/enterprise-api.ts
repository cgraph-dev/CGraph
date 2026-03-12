/**
 * Enterprise API Client
 *
 * API functions for enterprise features: organizations, SSO,
 * compliance, analytics, and admin console management.
 */

import { api as apiClient } from '@/lib/api';
import type {
  Organization,
  OrgMembership,
  OrgSettings,
  SSOProvider,
  SSOInitiateResponse,
  ComplianceReport,
  ComplianceStatus,
  DataRegion,
  AnalyticsOverview,
  AnalyticsTimeSeriesPoint,
  OrgBreakdown,
  EnterpriseAdminUser,
  EnterpriseAdminRole,
  EnterpriseAuditEntry,
  PaginatedResponse,
} from './enterprise-types';

// ============================================================================
// Raw API response interfaces (snake_case from backend)
// ============================================================================

interface RawOrg {
  id: string;
  name: string;
  slug: string;
  subscription_tier: Organization['subscriptionTier'];
  logo_url: string | null;
  max_members: number;
  owner_id: string;
  inserted_at: string;
  updated_at: string;
}

interface RawMembershipUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface RawMembership {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMembership['role'];
  joined_at: string;
  inserted_at: string;
  user?: RawMembershipUser | null;
}

interface RawSSOProvider {
  id: string;
  name: string;
  type: SSOProvider['type'];
  enabled: boolean;
  org_id: string;
  inserted_at: string;
  updated_at?: string;
}

interface RawAdminUser {
  id: string;
  email: string;
  mfa_enabled: boolean;
  last_login_at: string | null;
  role_id: string;
  user_id: string;
  permissions: Record<string, boolean>;
  inserted_at: string;
}

interface RawAuditEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes_before: Record<string, unknown> | null;
  changes_after: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  admin_id: string;
  inserted_at: string;
}

// ============================================================================
// Response Transformers (snake_case → camelCase)
// ============================================================================

function transformOrg(raw: RawOrg): Organization {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    subscriptionTier: raw.subscription_tier,
    logoUrl: raw.logo_url || null,
    maxMembers: raw.max_members || 0,
    ownerId: raw.owner_id,
    insertedAt: raw.inserted_at,
    updatedAt: raw.updated_at,
  };
}

function transformMembership(raw: RawMembership): OrgMembership {
  const user = raw.user;
  return {
    id: raw.id,
    orgId: raw.org_id,
    userId: raw.user_id,
    role: raw.role,
    joinedAt: raw.joined_at,
    insertedAt: raw.inserted_at,
    user: user
      ? {
          id: user.id,
          username: user.username || null,
          displayName: user.display_name || null,
          avatarUrl: user.avatar_url || null,
        }
      : undefined,
  };
}

function transformSSOProvider(raw: RawSSOProvider): SSOProvider {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    enabled: raw.enabled,
    orgId: raw.org_id,
    insertedAt: raw.inserted_at,
    updatedAt: raw.updated_at,
  };
}

function transformAdminUser(raw: RawAdminUser): EnterpriseAdminUser {
  return {
    id: raw.id,
    email: raw.email,
    mfaEnabled: raw.mfa_enabled,
    lastLoginAt: raw.last_login_at || null,
    roleId: raw.role_id,
    userId: raw.user_id,
    permissions: raw.permissions || {},
    insertedAt: raw.inserted_at,
  };
}

function transformAuditEntry(raw: RawAuditEntry): EnterpriseAuditEntry {
  return {
    id: raw.id,
    action: raw.action,
    resourceType: raw.resource_type,
    resourceId: raw.resource_id || null,
    changesBefore: raw.changes_before || null,
    changesAfter: raw.changes_after || null,
    ipAddress: raw.ip_address || null,
    userAgent: raw.user_agent || null,
    adminId: raw.admin_id,
    insertedAt: raw.inserted_at,
  };
}

// ============================================================================
// Organizations API
// ============================================================================

export const organizationsApi = {
  async listOrgs(cursor?: string): Promise<PaginatedResponse<Organization>> {
    const params = cursor ? `?cursor=${cursor}` : '';
    const res = await apiClient.get(`/api/v1/organizations${params}`);
    return {
      data: (res.data.data || []).map(transformOrg),
      meta: {
        cursor: res.data.meta?.cursor || null,
        hasMore: res.data.meta?.has_more || false,
        total: res.data.meta?.total || null,
      },
    };
  },

  async createOrg(params: { name: string; slug?: string }): Promise<Organization> {
    const res = await apiClient.post('/api/v1/organizations', params);
    return transformOrg(res.data.data);
  },

  async getOrg(slug: string): Promise<Organization> {
    const res = await apiClient.get(`/api/v1/organizations/${slug}`);
    return transformOrg(res.data.data);
  },

  async updateOrg(slug: string, params: Partial<Organization>): Promise<Organization> {
    const res = await apiClient.put(`/api/v1/organizations/${slug}`, params);
    return transformOrg(res.data.data);
  },

  async deleteOrg(slug: string): Promise<void> {
    await apiClient.delete(`/api/v1/organizations/${slug}`);
  },

  async listMembers(slug: string, cursor?: string): Promise<PaginatedResponse<OrgMembership>> {
    const params = cursor ? `?cursor=${cursor}` : '';
    const res = await apiClient.get(`/api/v1/organizations/${slug}/members${params}`);
    return {
      data: (res.data.data || []).map(transformMembership),
      meta: {
        cursor: res.data.meta?.cursor || null,
        hasMore: res.data.meta?.has_more || false,
        total: res.data.meta?.total || null,
      },
    };
  },

  async addMember(slug: string, userId: string, role: string = 'member'): Promise<OrgMembership> {
    const res = await apiClient.post(`/api/v1/organizations/${slug}/members`, {
      user_id: userId,
      role,
    });
    return transformMembership(res.data.data);
  },

  async removeMember(slug: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/v1/organizations/${slug}/members/${userId}`);
  },

  async updateSettings(slug: string, settings: Partial<OrgSettings>): Promise<OrgSettings> {
    const res = await apiClient.put(`/api/v1/organizations/${slug}/settings`, settings);
    return res.data.data;
  },

  async transferOwnership(slug: string, newOwnerId: string): Promise<Organization> {
    const res = await apiClient.post(`/api/v1/organizations/${slug}/transfer`, {
      new_owner_id: newOwnerId,
    });
    return transformOrg(res.data.data);
  },
};

// ============================================================================
// SSO API
// ============================================================================

export const ssoApi = {
  async listProviders(orgId: string): Promise<SSOProvider[]> {
    const res = await apiClient.get(`/api/v1/admin/enterprise/sso/providers?org_id=${orgId}`);
    return (res.data.data || []).map(transformSSOProvider);
  },

  async createProvider(params: {
    name: string;
    type: string;
    org_id: string;
    config: Record<string, string>;
  }): Promise<SSOProvider> {
    const res = await apiClient.post('/api/v1/admin/enterprise/sso/providers', params);
    return transformSSOProvider(res.data.data);
  },

  async updateProvider(
    id: string,
    params: Partial<{ name: string; enabled: boolean; config: Record<string, string> }>
  ): Promise<SSOProvider> {
    const res = await apiClient.put(`/api/v1/admin/enterprise/sso/providers/${id}`, params);
    return transformSSOProvider(res.data.data);
  },

  async deleteProvider(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/enterprise/sso/providers/${id}`);
  },

  async initiate(providerId: string): Promise<SSOInitiateResponse> {
    const res = await apiClient.post(`/api/v1/sso/${providerId}/initiate`);
    return { redirectUrl: res.data.data.redirect_url };
  },
};

// ============================================================================
// Compliance API
// ============================================================================

export const complianceApi = {
  async getStatus(orgId: string): Promise<ComplianceStatus> {
    const res = await apiClient.get(`/api/v1/admin/enterprise/compliance/${orgId}/status`);
    const d = res.data.data;
    return {
      frameworks: d.frameworks || [],
      overallScore: d.overall_score || 0,
      lastAuditAt: d.last_audit_at || null,
    };
  },

  async runAudit(orgId: string, framework: string): Promise<ComplianceReport> {
    const res = await apiClient.post(`/api/v1/admin/enterprise/compliance/${orgId}/audit`, {
      framework,
    });
    const d = res.data.data;
    return {
      framework: d.framework,
      status: d.status,
      score: d.score,
      checks: d.checks || [],
      generatedAt: d.generated_at,
    };
  },

  async listRegions(): Promise<DataRegion[]> {
    const res = await apiClient.get('/api/v1/admin/enterprise/compliance/regions');
    return res.data.data || [];
  },

  async getBranding(orgId: string): Promise<Record<string, string>> {
    const res = await apiClient.get(`/api/v1/admin/enterprise/compliance/${orgId}/branding`);
    return res.data.data || {};
  },

  async updateBranding(orgId: string, branding: Record<string, string>): Promise<void> {
    await apiClient.put(`/api/v1/admin/enterprise/compliance/${orgId}/branding`, { branding });
  },
};

// ============================================================================
// Enterprise Analytics API
// ============================================================================

export const enterpriseAnalyticsApi = {
  async getOverview(): Promise<AnalyticsOverview> {
    const res = await apiClient.get('/api/v1/admin/enterprise/analytics/overview');
    return res.data.data;
  },

  async getOrgBreakdown(orgId: string): Promise<OrgBreakdown> {
    const res = await apiClient.get(`/api/v1/admin/enterprise/analytics/org/${orgId}`);
    return res.data.data;
  },

  async getTimeSeries(
    metric: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsTimeSeriesPoint[]> {
    const params = new URLSearchParams({ metric });
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const res = await apiClient.get(`/api/v1/admin/enterprise/analytics/time-series?${params}`);
    return res.data.data || [];
  },

  async exportOrgAnalytics(orgId: string): Promise<Record<string, unknown>[]> {
    const res = await apiClient.get(`/api/v1/admin/enterprise/analytics/org/${orgId}/export`);
    return res.data.data || [];
  },
};

// ============================================================================
// Enterprise Admin Console API
// ============================================================================

export const enterpriseAdminApi = {
  async listAdmins(cursor?: string): Promise<PaginatedResponse<EnterpriseAdminUser>> {
    const params = cursor ? `?cursor=${cursor}` : '';
    const res = await apiClient.get(`/api/v1/admin/enterprise/admins${params}`);
    return {
      data: (res.data.data || []).map(transformAdminUser),
      meta: {
        cursor: res.data.meta?.cursor || null,
        hasMore: res.data.meta?.has_more || false,
        total: res.data.meta?.total || null,
      },
    };
  },

  async createAdmin(params: {
    email: string;
    user_id: string;
    role_id: string;
  }): Promise<EnterpriseAdminUser> {
    const res = await apiClient.post('/api/v1/admin/enterprise/admins', params);
    return transformAdminUser(res.data.data);
  },

  async deleteAdmin(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/admin/enterprise/admins/${id}`);
  },

  async listRoles(): Promise<EnterpriseAdminRole[]> {
    const res = await apiClient.get('/api/v1/admin/enterprise/roles');
    return res.data.data || [];
  },

  async listAuditEntries(cursor?: string): Promise<PaginatedResponse<EnterpriseAuditEntry>> {
    const params = cursor ? `?cursor=${cursor}` : '';
    const res = await apiClient.get(`/api/v1/admin/enterprise/audit${params}`);
    return {
      data: (res.data.data || []).map(transformAuditEntry),
      meta: {
        cursor: res.data.meta?.cursor || null,
        hasMore: res.data.meta?.has_more || false,
        total: res.data.meta?.total || null,
      },
    };
  },

  async getPlatformStats(): Promise<Record<string, unknown>> {
    const res = await apiClient.get('/api/v1/admin/enterprise/stats');
    return res.data.data || {};
  },
};

// ============================================================================
// Composed Enterprise API
// ============================================================================

export const enterpriseApi = {
  ...organizationsApi,
  ...ssoApi,
  ...complianceApi,
  ...enterpriseAnalyticsApi,
  ...enterpriseAdminApi,
};
