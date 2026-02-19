# ──────────────────────────────────────────────────────────────────────────────
# WAF & Firewall Rulesets
# Codifies OWASP + custom rules from cdn_configuration.yaml
# ──────────────────────────────────────────────────────────────────────────────

# ── Managed WAF — OWASP Core Ruleset ────────────────────────────────────────

resource "cloudflare_ruleset" "waf_managed" {
  zone_id     = local.zone_id
  name        = "CGraph WAF Managed Rules"
  description = "OWASP SQLi + XSS protection"
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  # Deploy Cloudflare OWASP Core Ruleset
  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee" # Cloudflare OWASP Core Ruleset
      overrides {
        # Block all paranoia levels for SQLi & XSS categories
        categories {
          category = "sqli"
          action   = "block"
          enabled  = true
        }
        categories {
          category = "xss"
          action   = "block"
          enabled  = true
        }
      }
    }
    expression  = "true"
    description = "OWASP SQLi + XSS block"
    enabled     = true
  }
}

# ── Custom WAF Rules ────────────────────────────────────────────────────────

resource "cloudflare_ruleset" "waf_custom" {
  zone_id     = local.zone_id
  name        = "CGraph Custom Firewall Rules"
  description = "Bot blocking, path protection"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  # Block known bad bots
  rules {
    action      = "block"
    expression  = "(cf.client.bot) and not (cf.bot_management.verified_bot)"
    description = "Block unverified bots"
    enabled     = true
  }

  # Challenge suspicious requests to admin paths
  rules {
    action      = "managed_challenge"
    expression  = "(http.request.uri.path contains \"/admin\") and (cf.threat_score gt 10)"
    description = "Challenge suspicious admin access"
    enabled     = true
  }
}
