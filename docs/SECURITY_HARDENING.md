# CGraph Security Hardening Guide

This document covers security best practices and hardening procedures for CGraph deployments. Whether you're running a small community server or a large-scale production environment, these guidelines will help protect your users and their data.

---

## Table of Contents

1. [Security Philosophy](#security-philosophy)
2. [Authentication Security](#authentication-security)
3. [Database Security](#database-security)
4. [Network Security](#network-security)
5. [API Security](#api-security)
6. [File Upload Security](#file-upload-security)
7. [Rate Limiting](#rate-limiting)
8. [Secrets Management](#secrets-management)
9. [Logging and Monitoring](#logging-and-monitoring)
10. [Incident Response](#incident-response)
11. [Compliance Checklist](#compliance-checklist)

---

## Security Philosophy

CGraph follows a defense-in-depth approach. We don't rely on any single security measure—instead, we layer multiple protections so that if one fails, others remain.

**Core Principles:**
- Never trust user input
- Encrypt everything in transit
- Minimize attack surface
- Fail securely (deny by default)
- Log security events for forensics
- Regular security audits

---

## Authentication Security

### Password Requirements

CGraph uses Bcrypt for password hashing with a work factor of 12. Here's how to configure password policies:

```elixir
# config/config.exs
config :cgraph, CGraph.Accounts,
  password_min_length: 12,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_number: true,
  password_require_special: false,
  password_max_age_days: 90,
  password_history_count: 5
```

For production, we recommend:
- **Minimum 12 characters** (we've moved beyond the old 8-character thinking)
- **Rate limit login attempts** to prevent brute force
- **Lock accounts** after 5 failed attempts within 15 minutes

### JWT Token Configuration

Our JWT tokens should be short-lived:

```elixir
# config/runtime.exs
config :cgraph, CGraph.Guardian,
  issuer: "cgraph",
  secret_key: System.fetch_env!("GUARDIAN_SECRET"),
  ttl: {1, :hour},
  token_ttl: %{
    "access" => {15, :minutes},
    "refresh" => {7, :days}
  }
```

**Why short-lived tokens?** If a token is stolen, the attacker has a limited window to use it. Users get new tokens automatically via refresh, so they won't notice any difference.

### Wallet Authentication Security

For anonymous wallet-based authentication:

```elixir
# Challenge expiration (prevent replay attacks)
config :cgraph, CGraph.Accounts.WalletAuth,
  challenge_ttl_seconds: 300,
  pin_hash_rounds: 12,
  recovery_code_count: 8,
  max_pin_attempts: 5,
  lockout_duration_minutes: 30
```

The challenge-response flow prevents replay attacks:
1. Client requests a challenge (random nonce + timestamp)
2. Client signs the challenge with their wallet
3. Server verifies signature and checks challenge hasn't expired
4. Challenge is marked as used (one-time use)

### Session Management

```elixir
# Plug configuration for sessions
config :cgraph_web, CGraphWeb.Endpoint,
  session_options: [
    store: :cookie,
    key: "_cgraph_session",
    signing_salt: System.fetch_env!("SESSION_SIGNING_SALT"),
    encryption_salt: System.fetch_env!("SESSION_ENCRYPTION_SALT"),
    max_age: 86400 * 14,  # 14 days
    same_site: "Strict",
    secure: true,
    http_only: true
  ]
```

**Critical settings:**
- `same_site: "Strict"` prevents CSRF attacks
- `secure: true` ensures cookies only sent over HTTPS
- `http_only: true` prevents JavaScript access to session cookie

---

## Database Security

### Connection Security

Always use SSL for database connections:

```elixir
# config/runtime.exs
config :cgraph, CGraph.Repo,
  ssl: true,
  ssl_opts: [
    verify: :verify_peer,
    cacertfile: "/etc/ssl/certs/ca-certificates.crt",
    server_name_indication: ~c"your-db-host.com",
    customize_hostname_check: [
      match_fun: :public_key.pkix_verify_hostname_match_fun(:https)
    ]
  ]
```

### Database User Permissions

Never use the superuser account for your application. Create a dedicated user with minimal permissions:

```sql
-- Create application user
CREATE USER cgraph_app WITH PASSWORD 'secure_password_here';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE cgraph TO cgraph_app;
GRANT USAGE ON SCHEMA public TO cgraph_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cgraph_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cgraph_app;

-- Prevent schema modifications
REVOKE CREATE ON SCHEMA public FROM cgraph_app;
```

For migrations, use a separate user with more permissions:

```sql
CREATE USER cgraph_migrator WITH PASSWORD 'different_password';
GRANT ALL ON DATABASE cgraph TO cgraph_migrator;
```

### Row-Level Security

For multi-tenant deployments, use PostgreSQL's row-level security:

```sql
-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own messages or messages in conversations they're part of
CREATE POLICY messages_access ON messages
  FOR ALL
  USING (
    sender_id = current_setting('cgraph.user_id')::uuid
    OR conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = current_setting('cgraph.user_id')::uuid
    )
  );
```

### Encryption at Rest

For sensitive data, use column-level encryption:

```elixir
# lib/cgraph/encryption.ex
defmodule CGraph.Encryption do
  @aes_key_base System.fetch_env!("ENCRYPTION_KEY")
  
  def encrypt(plaintext) do
    iv = :crypto.strong_rand_bytes(16)
    key = derive_key(@aes_key_base)
    
    {ciphertext, tag} = :crypto.crypto_one_time_aead(
      :aes_256_gcm,
      key,
      iv,
      plaintext,
      "",
      true
    )
    
    Base.encode64(iv <> tag <> ciphertext)
  end
  
  def decrypt(encrypted) do
    <<iv::binary-16, tag::binary-16, ciphertext::binary>> = 
      Base.decode64!(encrypted)
    
    key = derive_key(@aes_key_base)
    
    :crypto.crypto_one_time_aead(
      :aes_256_gcm,
      key,
      iv,
      ciphertext,
      "",
      tag,
      false
    )
  end
  
  defp derive_key(base) do
    :crypto.hash(:sha256, base)
  end
end
```

---

## Network Security

### TLS Configuration

Use strong TLS settings:

```nginx
# nginx.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
```

### Security Headers

Add these headers to every response:

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss:; font-src 'self';" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

Or configure in Elixir:

```elixir
# lib/cgraph_web/plugs/security_headers.ex
defmodule CGraphWeb.Plugs.SecurityHeaders do
  import Plug.Conn
  
  def init(opts), do: opts
  
  def call(conn, _opts) do
    conn
    |> put_resp_header("strict-transport-security", "max-age=63072000; includeSubDomains")
    |> put_resp_header("x-frame-options", "SAMEORIGIN")
    |> put_resp_header("x-content-type-options", "nosniff")
    |> put_resp_header("x-xss-protection", "1; mode=block")
    |> put_resp_header("referrer-policy", "strict-origin-when-cross-origin")
    |> put_resp_header("permissions-policy", "geolocation=(), microphone=(), camera=()")
  end
end
```

### WebSocket Security

Secure your Phoenix Channels:

```elixir
# lib/cgraph_web/channels/user_socket.ex
defmodule CGraphWeb.UserSocket do
  use Phoenix.Socket
  
  channel "user:*", CGraphWeb.UserChannel
  channel "conversation:*", CGraphWeb.ConversationChannel
  
  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case CGraph.Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        case CGraph.Guardian.resource_from_claims(claims) do
          {:ok, user} ->
            {:ok, assign(socket, :current_user, user)}
          _ ->
            :error
        end
      _ ->
        :error
    end
  end
  
  def connect(_params, _socket, _connect_info), do: :error
  
  @impl true
  def id(socket), do: "users_socket:#{socket.assigns.current_user.id}"
end
```

---

## API Security

### Input Validation

Always validate input using Ecto changesets or dedicated validation modules:

```elixir
# lib/cgraph_web/controllers/message_controller.ex
def create(conn, %{"content" => content}) do
  # Validate input
  with {:ok, sanitized} <- validate_message(content),
       {:ok, message} <- Messaging.create_message(conn.assigns.current_user, sanitized) do
    render(conn, :show, message: message)
  else
    {:error, :too_long} ->
      conn |> put_status(:bad_request) |> json(%{error: "Message too long"})
    {:error, :empty} ->
      conn |> put_status(:bad_request) |> json(%{error: "Message cannot be empty"})
    {:error, changeset} ->
      conn |> put_status(:unprocessable_entity) |> render(:errors, changeset: changeset)
  end
end

defp validate_message(content) when byte_size(content) > 4000 do
  {:error, :too_long}
end

defp validate_message(content) do
  trimmed = String.trim(content)
  if trimmed == "", do: {:error, :empty}, else: {:ok, trimmed}
end
```

### Authorization

Use a consistent authorization pattern:

```elixir
# lib/cgraph_web/plugs/authorize.ex
defmodule CGraphWeb.Plugs.Authorize do
  import Plug.Conn
  import Phoenix.Controller
  
  def init(permission), do: permission
  
  def call(conn, permission) do
    user = conn.assigns[:current_user]
    resource = conn.assigns[:resource]
    
    if authorized?(user, resource, permission) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "You don't have permission to do that"})
      |> halt()
    end
  end
  
  defp authorized?(nil, _resource, _permission), do: false
  
  defp authorized?(user, %Group{} = group, permission) do
    CGraph.Groups.has_permission?(user, group, permission)
  end
  
  defp authorized?(user, %Conversation{} = conv, _permission) do
    CGraph.Messaging.participant?(conv, user)
  end
end
```

### SQL Injection Prevention

Ecto protects against SQL injection by default, but be careful with raw queries:

```elixir
# BAD - vulnerable to SQL injection
query = "SELECT * FROM users WHERE name = '#{name}'"
Repo.query(query)

# GOOD - parameterized query
query = "SELECT * FROM users WHERE name = $1"
Repo.query(query, [name])

# BETTER - use Ecto
from(u in User, where: u.name == ^name) |> Repo.all()
```

### CORS Configuration

```elixir
# lib/cgraph_web/endpoint.ex
plug Corsica,
  origins: [
    "https://cgraph.app",
    "https://app.cgraph.io"
  ],
  allow_credentials: true,
  allow_headers: ["content-type", "authorization"],
  expose_headers: ["x-request-id"],
  max_age: 86400
```

For development, you might allow all origins, but **never do this in production**.

---

## File Upload Security

### Validation

```elixir
# lib/cgraph/uploads/validator.ex
defmodule CGraph.Uploads.Validator do
  @max_size 10 * 1024 * 1024  # 10MB
  @allowed_types %{
    "image/jpeg" => [".jpg", ".jpeg"],
    "image/png" => [".png"],
    "image/gif" => [".gif"],
    "image/webp" => [".webp"],
    "application/pdf" => [".pdf"]
  }
  
  def validate(upload) do
    with :ok <- check_size(upload),
         :ok <- check_type(upload),
         :ok <- check_content(upload) do
      {:ok, upload}
    end
  end
  
  defp check_size(%{size: size}) when size > @max_size do
    {:error, :file_too_large}
  end
  defp check_size(_), do: :ok
  
  defp check_type(%{content_type: type}) do
    if Map.has_key?(@allowed_types, type) do
      :ok
    else
      {:error, :invalid_type}
    end
  end
  
  defp check_content(%{path: path, content_type: claimed_type}) do
    # Verify actual content matches claimed type
    actual_type = get_actual_type(path)
    
    if actual_type == claimed_type do
      :ok
    else
      {:error, :content_type_mismatch}
    end
  end
  
  defp get_actual_type(path) do
    # Use file magic bytes to detect actual type
    case File.read(path) do
      {:ok, <<0xFF, 0xD8, 0xFF, _::binary>>} -> "image/jpeg"
      {:ok, <<0x89, 0x50, 0x4E, 0x47, _::binary>>} -> "image/png"
      {:ok, <<0x47, 0x49, 0x46, _::binary>>} -> "image/gif"
      {:ok, <<0x52, 0x49, 0x46, 0x46, _::binary-4, 0x57, 0x45, 0x42, 0x50, _::binary>>} -> "image/webp"
      {:ok, <<0x25, 0x50, 0x44, 0x46, _::binary>>} -> "application/pdf"
      _ -> "application/octet-stream"
    end
  end
end
```

### Virus Scanning

Integrate ClamAV for virus scanning:

```elixir
# lib/cgraph/uploads/virus_scanner.ex
defmodule CGraph.Uploads.VirusScanner do
  @clamd_host "localhost"
  @clamd_port 3310
  
  def scan(file_path) do
    case :gen_tcp.connect(~c"#{@clamd_host}", @clamd_port, [:binary, active: false]) do
      {:ok, socket} ->
        :gen_tcp.send(socket, "zSCAN #{file_path}\0")
        result = receive_response(socket)
        :gen_tcp.close(socket)
        parse_result(result)
      {:error, reason} ->
        {:error, {:connection_failed, reason}}
    end
  end
  
  defp receive_response(socket) do
    case :gen_tcp.recv(socket, 0, 30_000) do
      {:ok, data} -> data
      {:error, reason} -> "ERROR: #{reason}"
    end
  end
  
  defp parse_result(result) do
    cond do
      String.contains?(result, "OK") -> :clean
      String.contains?(result, "FOUND") -> {:infected, result}
      true -> {:error, result}
    end
  end
end
```

### Secure Storage

Store uploaded files outside the web root with randomized names:

```elixir
# lib/cgraph/uploads/storage.ex
defmodule CGraph.Uploads.Storage do
  @base_path "/var/cgraph/uploads"
  
  def store(upload) do
    # Generate random filename
    ext = Path.extname(upload.filename)
    random_name = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    filename = "#{random_name}#{ext}"
    
    # Create date-based directory structure
    date = Date.utc_today()
    dir = Path.join([@base_path, "#{date.year}", "#{date.month}", "#{date.day}"])
    File.mkdir_p!(dir)
    
    # Store file
    dest = Path.join(dir, filename)
    File.cp!(upload.path, dest)
    
    {:ok, %{path: dest, filename: filename}}
  end
end
```

---

## Rate Limiting

Use Hammer for rate limiting:

```elixir
# lib/cgraph_web/plugs/rate_limiter.ex
defmodule CGraphWeb.Plugs.RateLimiter do
  import Plug.Conn
  import Phoenix.Controller
  
  def init(opts), do: opts
  
  def call(conn, opts) do
    key = rate_limit_key(conn, opts)
    limit = Keyword.get(opts, :limit, 100)
    window = Keyword.get(opts, :window_ms, 60_000)
    
    case Hammer.check_rate(key, window, limit) do
      {:allow, count} ->
        conn
        |> put_resp_header("x-ratelimit-limit", "#{limit}")
        |> put_resp_header("x-ratelimit-remaining", "#{limit - count}")
        |> put_resp_header("x-ratelimit-reset", "#{System.system_time(:second) + div(window, 1000)}")
        
      {:deny, _} ->
        conn
        |> put_status(:too_many_requests)
        |> put_resp_header("retry-after", "#{div(window, 1000)}")
        |> json(%{error: "Rate limit exceeded. Please slow down."})
        |> halt()
    end
  end
  
  defp rate_limit_key(conn, opts) do
    case Keyword.get(opts, :by, :ip) do
      :ip -> 
        ip = conn.remote_ip |> :inet.ntoa() |> to_string()
        "rate_limit:#{conn.request_path}:#{ip}"
        
      :user ->
        user_id = conn.assigns[:current_user]&.id || "anonymous"
        "rate_limit:#{conn.request_path}:#{user_id}"
    end
  end
end
```

Configure different limits for different endpoints:

```elixir
# lib/cgraph_web/router.ex
pipeline :auth_rate_limit do
  plug CGraphWeb.Plugs.RateLimiter, limit: 5, window_ms: 60_000  # 5 per minute
end

pipeline :api_rate_limit do
  plug CGraphWeb.Plugs.RateLimiter, limit: 100, window_ms: 60_000  # 100 per minute
end

pipeline :search_rate_limit do
  plug CGraphWeb.Plugs.RateLimiter, limit: 30, window_ms: 60_000  # 30 per minute
end
```

---

## Secrets Management

### Environment Variables

Never commit secrets to version control. Use environment variables:

```bash
# Required secrets
export SECRET_KEY_BASE=$(mix phx.gen.secret)
export GUARDIAN_SECRET=$(mix phx.gen.secret)
export DATABASE_URL="ecto://user:pass@host/cgraph"
export ENCRYPTION_KEY=$(openssl rand -hex 32)
export SESSION_SIGNING_SALT=$(mix phx.gen.secret 32)
export SESSION_ENCRYPTION_SALT=$(mix phx.gen.secret 32)
```

### Secrets in Production

For production, use a secrets manager:

**AWS Secrets Manager:**
```elixir
# config/runtime.exs
if config_env() == :prod do
  {:ok, secrets} = ExAws.SecretsManager.get_secret_value("cgraph/prod")
                   |> ExAws.request()
  
  secret_data = Jason.decode!(secrets["SecretString"])
  
  config :cgraph, CGraph.Repo,
    url: secret_data["DATABASE_URL"]
    
  config :cgraph, CGraph.Guardian,
    secret_key: secret_data["GUARDIAN_SECRET"]
end
```

**HashiCorp Vault:**
```elixir
# Use Vaultex for Vault integration
{:ok, secrets} = Vaultex.Client.read("secret/data/cgraph/prod")

config :cgraph, CGraph.Repo,
  url: secrets["data"]["DATABASE_URL"]
```

### Key Rotation

Plan for regular key rotation:

```elixir
# lib/cgraph/key_rotation.ex
defmodule CGraph.KeyRotation do
  @doc """
  Rotate encryption keys without downtime.
  
  1. Add new key to list of valid keys
  2. Re-encrypt data with new key (background job)
  3. Remove old key once migration complete
  """
  
  def rotate_encryption_key(new_key) do
    # Start background job to re-encrypt sensitive data
    Oban.insert(CGraph.Workers.ReEncryptData.new(%{new_key: new_key}))
  end
  
  def rotate_jwt_secret(new_secret) do
    # New secret becomes primary
    # Old tokens still valid until they expire naturally
    Application.put_env(:cgraph, :jwt_secrets, [new_secret | current_secrets()])
    
    # Schedule removal of old secret after token TTL
    Process.send_after(self(), {:remove_old_secret}, :timer.hours(24))
  end
end
```

---

## Logging and Monitoring

### Security Event Logging

```elixir
# lib/cgraph/security/audit_log.ex
defmodule CGraph.Security.AuditLog do
  require Logger
  
  def log_login_attempt(user, success, metadata \\ %{}) do
    log_event("auth.login", %{
      user_id: user.id,
      success: success,
      ip: metadata[:ip],
      user_agent: metadata[:user_agent]
    })
  end
  
  def log_permission_denied(user, resource, action) do
    log_event("auth.permission_denied", %{
      user_id: user.id,
      resource_type: resource.__struct__,
      resource_id: resource.id,
      action: action
    })
  end
  
  def log_sensitive_data_access(user, data_type, record_id) do
    log_event("data.access", %{
      user_id: user.id,
      data_type: data_type,
      record_id: record_id
    })
  end
  
  defp log_event(event_type, data) do
    entry = %{
      event: event_type,
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      data: data
    }
    
    # Log to file
    Logger.info(fn -> Jason.encode!(entry) end, event_type: event_type)
    
    # Also store in database for analysis
    CGraph.Repo.insert!(%CGraph.Security.AuditEntry{
      event_type: event_type,
      data: data,
      inserted_at: DateTime.utc_now()
    })
  end
end
```

### Alert Configuration

Set up alerts for security events:

```elixir
# lib/cgraph/security/alerts.ex
defmodule CGraph.Security.Alerts do
  @slack_webhook System.get_env("SECURITY_SLACK_WEBHOOK")
  
  def send_alert(severity, message, details \\ %{}) do
    payload = %{
      text: ":warning: *Security Alert* (#{severity})",
      attachments: [
        %{
          color: severity_color(severity),
          fields: [
            %{title: "Message", value: message, short: false},
            %{title: "Time", value: DateTime.utc_now() |> to_string(), short: true},
            %{title: "Details", value: Jason.encode!(details), short: false}
          ]
        }
      ]
    }
    
    HTTPoison.post(@slack_webhook, Jason.encode!(payload), [
      {"Content-Type", "application/json"}
    ])
  end
  
  defp severity_color(:critical), do: "#dc3545"
  defp severity_color(:high), do: "#fd7e14"
  defp severity_color(:medium), do: "#ffc107"
  defp severity_color(:low), do: "#17a2b8"
end
```

### Failed Login Monitoring

```elixir
# lib/cgraph/security/brute_force_detector.ex
defmodule CGraph.Security.BruteForceDetector do
  use GenServer
  
  @threshold 10
  @window_minutes 5
  
  def start_link(_) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end
  
  def record_failure(ip_address) do
    GenServer.cast(__MODULE__, {:failure, ip_address})
  end
  
  @impl true
  def handle_cast({:failure, ip}, state) do
    now = System.system_time(:second)
    key = ip_to_string(ip)
    
    failures = Map.get(state, key, [])
    recent = Enum.filter(failures, fn t -> now - t < @window_minutes * 60 end)
    updated = [now | recent]
    
    if length(updated) >= @threshold do
      CGraph.Security.Alerts.send_alert(
        :high,
        "Possible brute force attack detected",
        %{ip: key, attempts: length(updated), window: "#{@window_minutes} minutes"}
      )
      
      # Block the IP temporarily
      CGraph.Security.Firewall.block_ip(ip, :timer.hours(1))
    end
    
    {:noreply, Map.put(state, key, updated)}
  end
  
  defp ip_to_string(ip) when is_tuple(ip), do: :inet.ntoa(ip) |> to_string()
  defp ip_to_string(ip), do: to_string(ip)
end
```

---

## Incident Response

### Incident Response Checklist

When a security incident occurs:

1. **Contain** - Limit the damage
   - Block suspicious IPs
   - Revoke compromised tokens
   - Disable affected accounts

2. **Assess** - Understand what happened
   - Review audit logs
   - Identify affected users/data
   - Determine attack vector

3. **Remediate** - Fix the vulnerability
   - Patch the security hole
   - Rotate compromised credentials
   - Re-secure affected accounts

4. **Recover** - Return to normal operations
   - Restore from clean backups if needed
   - Re-enable services
   - Notify affected users

5. **Learn** - Prevent future incidents
   - Document the incident
   - Update security procedures
   - Implement additional monitoring

### Emergency Commands

```bash
# Revoke all sessions for a user
mix cgraph.security.revoke_sessions --user-id UUID

# Block an IP address
mix cgraph.security.block_ip 1.2.3.4 --duration 24h

# Force password reset for all users
mix cgraph.security.force_password_reset --all

# Export audit logs for investigation
mix cgraph.security.export_logs --from 2024-01-01 --to 2024-01-31 --output /tmp/audit.json

# Check for compromised passwords (against known breach databases)
mix cgraph.security.check_passwords --report-only
```

---

## Compliance Checklist

Use this checklist for security audits:

### Authentication
- [ ] Passwords hashed with bcrypt (cost factor ≥ 12)
- [ ] Account lockout after failed attempts
- [ ] Session timeout configured
- [ ] Multi-factor authentication available
- [ ] Secure password reset flow

### Authorization
- [ ] Principle of least privilege applied
- [ ] Role-based access control implemented
- [ ] Authorization checked on every request
- [ ] Resource ownership verified

### Data Protection
- [ ] Encryption at rest for sensitive data
- [ ] TLS 1.2+ for data in transit
- [ ] PII handling compliant with regulations
- [ ] Data retention policies implemented
- [ ] Secure data deletion process

### Infrastructure
- [ ] Firewall configured
- [ ] Unnecessary ports closed
- [ ] Security updates applied
- [ ] Intrusion detection in place
- [ ] Regular backups tested

### Application Security
- [ ] Input validation on all endpoints
- [ ] Output encoding to prevent XSS
- [ ] CSRF protection enabled
- [ ] SQL injection prevention
- [ ] Rate limiting configured

### Logging & Monitoring
- [ ] Security events logged
- [ ] Logs stored securely
- [ ] Alerting configured
- [ ] Log retention policy
- [ ] Regular log review

### Incident Response
- [ ] Incident response plan documented
- [ ] Contact list up to date
- [ ] Runbooks for common scenarios
- [ ] Regular incident drills

---

## Staying Current

Security is not a one-time effort. Keep your systems secure by:

1. **Subscribe to security advisories** for Elixir, Phoenix, and dependencies
2. **Run dependency audits regularly**: `mix hex.audit`
3. **Perform penetration testing** annually (or after major changes)
4. **Review and update** this document quarterly
5. **Train your team** on security best practices

For security vulnerabilities, contact security@cgraph.app (replace with your actual security contact).

---

*This document should be reviewed and updated at least quarterly, or whenever there are significant changes to the application architecture.*
