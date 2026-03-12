defmodule CGraphWeb.API.V1.EnterpriseJSON do
  @moduledoc """
  JSON rendering for Enterprise API responses.

  Covers organizations, SSO providers, compliance, org memberships,
  org settings, admin console, and enterprise analytics.
  """

  # ---------------------------------------------------------------------------
  # Organizations
  # ---------------------------------------------------------------------------

  @spec organization(map()) :: map()
  def organization(org) do
    %{
      data: %{
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscription_tier: org.subscription_tier,
        logo_url: org.logo_url,
        max_members: org.max_members,
        owner_id: org.owner_id,
        inserted_at: format_datetime(org.inserted_at),
        updated_at: format_datetime(org.updated_at)
      }
    }
  end

  @spec organizations(list(), map()) :: map()
  def organizations(orgs, meta) do
    %{
      data: Enum.map(orgs, &organization_item/1),
      meta: pagination_meta(meta)
    }
  end

  defp organization_item(org) do
    %{
      id: org.id,
      name: org.name,
      slug: org.slug,
      subscription_tier: org.subscription_tier,
      logo_url: org.logo_url,
      max_members: org.max_members,
      owner_id: org.owner_id,
      inserted_at: format_datetime(org.inserted_at)
    }
  end

  # ---------------------------------------------------------------------------
  # Organization Members
  # ---------------------------------------------------------------------------

  @spec org_membership(map()) :: map()
  def org_membership(membership) do
    %{
      data: %{
        id: membership.id,
        org_id: membership.org_id,
        user_id: membership.user_id,
        role: membership.role,
        joined_at: format_datetime(membership.joined_at),
        inserted_at: format_datetime(membership.inserted_at)
      }
    }
  end

  @spec org_members(list(), map()) :: map()
  def org_members(members, meta) do
    %{
      data: Enum.map(members, &org_member_item/1),
      meta: pagination_meta(meta)
    }
  end

  defp org_member_item(membership) do
    %{
      id: membership.id,
      user_id: membership.user_id,
      role: membership.role,
      joined_at: format_datetime(membership.joined_at),
      user: member_user(membership)
    }
  end

  defp member_user(%{user: %{id: _} = user}) do
    %{
      id: user.id,
      username: Map.get(user, :username),
      display_name: Map.get(user, :display_name),
      avatar_url: Map.get(user, :avatar_url)
    }
  end

  defp member_user(_), do: nil

  # ---------------------------------------------------------------------------
  # Organization Settings
  # ---------------------------------------------------------------------------

  @spec org_settings(map()) :: map()
  def org_settings(settings) do
    %{
      data: %{
        id: settings.id,
        org_id: settings.org_id,
        sso_enabled: settings.sso_enabled,
        allowed_domains: settings.allowed_domains,
        default_role: settings.default_role,
        max_groups: settings.max_groups,
        features: settings.features,
        branding: settings.branding,
        data_region: settings.data_region,
        updated_at: format_datetime(settings.updated_at)
      }
    }
  end

  # ---------------------------------------------------------------------------
  # SSO Providers
  # ---------------------------------------------------------------------------

  @spec sso_provider(map()) :: map()
  def sso_provider(provider) do
    %{
      data: %{
        id: provider.id,
        name: provider.name,
        type: provider.type,
        enabled: provider.enabled,
        org_id: provider.org_id,
        inserted_at: format_datetime(provider.inserted_at),
        updated_at: format_datetime(provider.updated_at)
      }
    }
  end

  @spec sso_providers(list()) :: map()
  def sso_providers(providers) do
    %{
      data: Enum.map(providers, fn p ->
        %{
          id: p.id,
          name: p.name,
          type: p.type,
          enabled: p.enabled,
          org_id: p.org_id,
          inserted_at: format_datetime(p.inserted_at)
        }
      end)
    }
  end

  @spec sso_redirect(String.t()) :: map()
  def sso_redirect(url) do
    %{data: %{redirect_url: url}}
  end

  @spec sso_callback_result(map()) :: map()
  def sso_callback_result(result) do
    %{
      data: %{
        user: result.user,
        token: result.token,
        provider: result.provider
      }
    }
  end

  # ---------------------------------------------------------------------------
  # Admin Console
  # ---------------------------------------------------------------------------

  @spec admin_user(map()) :: map()
  def admin_user(admin) do
    %{
      data: %{
        id: admin.id,
        email: admin.email,
        mfa_enabled: admin.mfa_enabled,
        last_login_at: format_datetime(admin.last_login_at),
        role_id: admin.role_id,
        user_id: admin.user_id,
        permissions: admin.permissions,
        inserted_at: format_datetime(admin.inserted_at)
      }
    }
  end

  @spec admin_users(list(), map()) :: map()
  def admin_users(admins, meta) do
    %{
      data: Enum.map(admins, fn a ->
        %{
          id: a.id,
          email: a.email,
          mfa_enabled: a.mfa_enabled,
          last_login_at: format_datetime(a.last_login_at),
          role_id: a.role_id,
          user_id: a.user_id,
          permissions: a.permissions,
          inserted_at: format_datetime(a.inserted_at)
        }
      end),
      meta: pagination_meta(meta)
    }
  end

  @spec admin_role(map()) :: map()
  def admin_role(role) do
    %{
      data: %{
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        inserted_at: format_datetime(role.inserted_at)
      }
    }
  end

  @spec admin_roles(list()) :: map()
  def admin_roles(roles) do
    %{
      data: Enum.map(roles, fn r ->
        %{
          id: r.id,
          name: r.name,
          description: r.description,
          permissions: r.permissions
        }
      end)
    }
  end

  # ---------------------------------------------------------------------------
  # Audit Entries
  # ---------------------------------------------------------------------------

  @spec audit_entries(list(), map()) :: map()
  def audit_entries(entries, meta) do
    %{
      data: Enum.map(entries, &audit_entry_item/1),
      meta: pagination_meta(meta)
    }
  end

  @spec audit_entry(map()) :: map()
  def audit_entry(entry) do
    %{data: audit_entry_item(entry)}
  end

  defp audit_entry_item(entry) do
    %{
      id: entry.id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      changes_before: entry.changes_before,
      changes_after: entry.changes_after,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      admin_id: entry.admin_id,
      inserted_at: format_datetime(entry.inserted_at)
    }
  end

  # ---------------------------------------------------------------------------
  # Compliance
  # ---------------------------------------------------------------------------

  @spec compliance_report(map()) :: map()
  def compliance_report(report) do
    %{
      data: %{
        framework: report.framework,
        status: report.status,
        score: report.score,
        checks: report.checks,
        generated_at: format_datetime(report.generated_at)
      }
    }
  end

  @spec compliance_status(map()) :: map()
  def compliance_status(status) do
    %{
      data: %{
        frameworks: status.frameworks,
        overall_score: status.overall_score,
        last_audit_at: format_datetime(Map.get(status, :last_audit_at))
      }
    }
  end

  # ---------------------------------------------------------------------------
  # Analytics
  # ---------------------------------------------------------------------------

  @spec analytics_overview(map()) :: map()
  def analytics_overview(overview) do
    %{data: overview}
  end

  @spec analytics_time_series(list()) :: map()
  def analytics_time_series(series) do
    %{data: series}
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp format_datetime(nil), do: nil
  defp format_datetime(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp format_datetime(%NaiveDateTime{} = dt), do: NaiveDateTime.to_iso8601(dt)
  defp format_datetime(other), do: to_string(other)

  defp pagination_meta(meta) when is_map(meta) do
    %{
      cursor: Map.get(meta, :cursor),
      has_more: Map.get(meta, :has_more, false),
      total: Map.get(meta, :total)
    }
  end

  defp pagination_meta(_), do: %{}
end
