# CGraph — Cloudflare Terraform IaC

Infrastructure-as-Code for all Cloudflare resources powering CGraph.

## Resources Managed

| Resource           | File               | Description                                   |
| ------------------ | ------------------ | --------------------------------------------- |
| DNS Zone + Records | `dns.tf`           | Zone data source, 6 CNAME records, SPF/DMARC  |
| Pages Project      | `pages.tf`         | `cgraph-web` project + custom domains         |
| R2 Bucket          | `pages.tf`         | `cgraph-uploads` object storage               |
| Zone Settings      | `zone_settings.tf` | SSL/TLS, performance, caching, security       |
| Health Check       | `zone_settings.tf` | Backend `/health` endpoint monitoring         |
| WAF Rules          | `waf.tf`           | OWASP managed ruleset + custom firewall rules |
| Rate Limiting      | `rate_limiting.tf` | API, auth, AI endpoint rate limits            |
| Cache Rules        | `cache.tf`         | Static/API/WebSocket/HTML cache policies      |
| Response Headers   | `headers.tf`       | Security headers + CORS for API               |

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5
- Cloudflare API token with permissions:
  - Zone: Read, DNS Edit, Cache Purge
  - Zone Settings: Edit
  - Firewall Services: Edit
  - Page Rules: Edit
  - Cloudflare Pages: Edit
  - R2: Edit

## Quick Start

```bash
cd infrastructure/terraform

# Copy and configure variables
cp production.tfvars.example production.tfvars
# Edit production.tfvars with your account ID

# Set API token
export TF_VAR_cloudflare_api_token="your-token-here"

# Initialize and apply
terraform init
terraform plan -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

## Importing Existing Resources

Since these resources already exist in the Cloudflare dashboard, import them before the first
`terraform apply`:

```bash
# Zone (use zone ID from dashboard)
terraform import cloudflare_zone_settings_override.main <zone_id>

# DNS records (use record IDs from API or dashboard)
terraform import 'cloudflare_record.root' <zone_id>/<record_id>
terraform import 'cloudflare_record.api'  <zone_id>/<record_id>
# ... repeat for each record

# Pages project
terraform import cloudflare_pages_project.web <account_id>/cgraph-web

# R2 bucket
terraform import cloudflare_r2_bucket.uploads <account_id>/cgraph-uploads
```

## State Management

For team use, configure a remote backend (S3-compatible with R2):

```hcl
terraform {
  backend "s3" {
    bucket   = "cgraph-terraform-state"
    key      = "cloudflare/terraform.tfstate"
    region   = "auto"
    endpoint = "https://<account_id>.r2.cloudflarestorage.com"
  }
}
```
