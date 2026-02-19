# ──────────────────────────────────────────────────────────────────────────────
# Outputs
# ──────────────────────────────────────────────────────────────────────────────

output "zone_id" {
  description = "Cloudflare zone ID"
  value       = local.zone_id
}

output "pages_project_name" {
  description = "Cloudflare Pages project name"
  value       = cloudflare_pages_project.web.name
}

output "pages_domains" {
  description = "Custom domains attached to Pages"
  value = [
    cloudflare_pages_domain.web.domain,
    cloudflare_pages_domain.app.domain,
  ]
}

output "r2_bucket_name" {
  description = "R2 uploads bucket name"
  value       = cloudflare_r2_bucket.uploads.name
}

output "dns_records" {
  description = "DNS records managed by Terraform"
  value = {
    root = cloudflare_record.root.hostname
    www  = cloudflare_record.www.hostname
    web  = cloudflare_record.web.hostname
    app  = cloudflare_record.app.hostname
    api  = cloudflare_record.api.hostname
    docs = cloudflare_record.docs.hostname
  }
}

output "healthcheck_id" {
  description = "Backend health check ID"
  value       = cloudflare_healthcheck.backend.id
}
