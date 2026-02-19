# ──────────────────────────────────────────────────────────────────────────────
# CGraph — Cloudflare Terraform IaC
#
# Codifies all Cloudflare resources previously configured via dashboard/YAML.
# Manages: DNS, Pages, R2, WAF, rate limiting, cache rules, SSL/TLS, headers.
#
# Usage:
#   cd infrastructure/terraform
#   terraform init
#   terraform plan -var-file=production.tfvars
#   terraform apply -var-file=production.tfvars
#
# Required env vars (or pass via -var):
#   TF_VAR_cloudflare_api_token
# ──────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  # Recommended: configure remote backend for team use
  # backend "s3" {
  #   bucket   = "cgraph-terraform-state"
  #   key      = "cloudflare/terraform.tfstate"
  #   region   = "auto"
  #   endpoint = "https://<account_id>.r2.cloudflarestorage.com"
  # }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
