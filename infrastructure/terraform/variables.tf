# ──────────────────────────────────────────────────────────────────────────────
# Variables — provide via terraform.tfvars or environment (TF_VAR_*)
# ──────────────────────────────────────────────────────────────────────────────

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone/DNS/Pages/R2 permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "zone_name" {
  description = "Primary domain (Cloudflare zone)"
  type        = string
  default     = "cgraph.org"
}

variable "environment" {
  description = "Deployment environment (production / staging)"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["production", "staging"], var.environment)
    error_message = "Must be 'production' or 'staging'."
  }
}

variable "fly_backend_hostname" {
  description = "Fly.io backend hostname"
  type        = string
  default     = "cgraph-backend.fly.dev"
}
