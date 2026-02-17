# CGraph Security Testing Framework

> **Version: 0.9.31** | Last Updated: January 2026

Guidelines and patterns for security testing in CGraph.

---

## Overview

Security testing is essential for maintaining trust in our E2EE messaging platform. This document
outlines:

1. Security test categories
2. Test patterns and examples
3. CI/CD integration
4. Vulnerability scanning

---

## 1. Security Test Categories

### 1.1 Authentication Tests

```elixir
# test/cgraph/security/auth_test.exs

defmodule CGraph.Security.AuthTest do
  use CGraph.DataCase
  alias CGraph.Accounts

  describe "password security" do
    test "rejects weak passwords" do
      weak_passwords = [
        "password",
        "12345678",
        "qwertyui",
        "user@example.com",  # Same as email
        "abc",              # Too short
      ]

      for password <- weak_passwords do
        result = Accounts.validate_password(password)
        assert {:error, _} = result, "Should reject: #{password}"
      end
    end

    test "enforces password requirements" do
      # Minimum 12 characters, mixed case, number, symbol
      valid = "SecureP@ss123!"
      assert :ok = Accounts.validate_password(valid)
    end

    test "uses Argon2id for hashing" do
      hash = Accounts.hash_password("test-password")
      assert String.starts_with?(hash, "$argon2id$")
    end

    test "resists timing attacks on login" do
      # Valid user login should take similar time as invalid user
      {:ok, user} = create_user()

      {valid_time, _} = :timer.tc(fn ->
        Accounts.authenticate(user.email, "correct-password")
      end)

      {invalid_time, _} = :timer.tc(fn ->
        Accounts.authenticate("nonexistent@example.com", "wrong-password")
      end)

      # Times should be within 10% of each other
      assert abs(valid_time - invalid_time) < (valid_time * 0.1)
    end
  end

  describe "session security" do
    test "tokens expire after configured time" do
      {:ok, user} = create_user()
      {:ok, token} = Accounts.create_session_token(user)

      # Fast-forward time
      token = %{token | inserted_at: ~N[2020-01-01 00:00:00]}

      assert {:error, :expired} = Accounts.verify_session_token(token.token)
    end

    test "refresh tokens are single-use" do
      {:ok, user} = create_user()
      {:ok, refresh_token} = Accounts.create_refresh_token(user)

      # First use succeeds
      assert {:ok, _new_tokens} = Accounts.use_refresh_token(refresh_token)

      # Second use fails
      assert {:error, :already_used} = Accounts.use_refresh_token(refresh_token)
    end

    test "session revocation works" do
      {:ok, user} = create_user()
      {:ok, token} = Accounts.create_session_token(user)

      :ok = Accounts.revoke_session(user, token.id)

      assert {:error, :revoked} = Accounts.verify_session_token(token.token)
    end
  end
end
```

### 1.2 Authorization Tests (IDOR Prevention)

```elixir
# test/cgraph/security/authorization_test.exs

defmodule CGraph.Security.AuthorizationTest do
  use CGraph.DataCase
  alias CGraph.{Channels, Messages, Servers}

  describe "message access control" do
    test "users cannot read messages from channels they don't have access to" do
      {:ok, server} = create_server()
      {:ok, channel} = create_channel(server)
      {:ok, other_user} = create_user()  # Not in server
      {:ok, message} = create_message(channel)

      assert {:error, :unauthorized} =
        Messages.get_message(other_user, message.id)
    end

    test "users cannot delete others' messages without permission" do
      {:ok, server} = create_server()
      {:ok, channel} = create_channel(server)
      {:ok, member} = add_member(server)  # Regular member
      {:ok, message} = create_message(channel, author: server.owner)

      assert {:error, :unauthorized} =
        Messages.delete_message(member, message.id)
    end

    test "users cannot edit others' messages" do
      {:ok, channel} = create_channel()
      {:ok, author} = create_user()
      {:ok, other} = create_user()
      {:ok, message} = create_message(channel, author: author)

      assert {:error, :unauthorized} =
        Messages.update_message(other, message.id, %{content: "hacked"})
    end
  end

  describe "server access control" do
    test "private servers are not visible to non-members" do
      {:ok, server} = create_server(visibility: :private)
      {:ok, other_user} = create_user()

      assert {:error, :not_found} = Servers.get_server(other_user, server.id)
    end

    test "server settings require admin role" do
      {:ok, server} = create_server()
      {:ok, member} = add_member(server, role: :member)

      assert {:error, :unauthorized} =
        Servers.update_settings(member, server.id, %{name: "New Name"})
    end

    test "cannot access server by guessing ID" do
      {:ok, _server} = create_server()
      {:ok, other_user} = create_user()

      # Try random UUIDs
      for _ <- 1..10 do
        random_id = Ecto.UUID.generate()
        result = Servers.get_server(other_user, random_id)
        assert {:error, :not_found} = result
      end
    end
  end
end
```

### 1.3 Input Validation Tests

```elixir
# test/cgraph/security/input_validation_test.exs

defmodule CGraph.Security.InputValidationTest do
  use CGraph.ConnCase

  describe "XSS prevention" do
    test "message content is sanitized" do
      {:ok, user, conn} = auth_user()
      {:ok, channel} = create_channel(user)

      xss_payloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror='alert(1)'>",
        "<svg onload='alert(1)'>",
        "javascript:alert(1)",
        "<body onload='alert(1)'>",
      ]

      for payload <- xss_payloads do
        conn = post(conn, ~p"/api/v1/channels/#{channel.id}/messages", %{
          content: payload
        })

        response = json_response(conn, 201)
        refute response["content"] =~ "<script"
        refute response["content"] =~ "onerror"
        refute response["content"] =~ "javascript:"
      end
    end

    test "rejects excessively long input" do
      {:ok, user, conn} = auth_user()
      {:ok, channel} = create_channel(user)

      # 1MB of text
      huge_content = String.duplicate("a", 1_000_000)

      conn = post(conn, ~p"/api/v1/channels/#{channel.id}/messages", %{
        content: huge_content
      })

      assert json_response(conn, 400)["error"] =~ "too long"
    end
  end

  describe "SQL injection prevention" do
    test "search queries are parameterized" do
      {:ok, user, conn} = auth_user()

      sql_payloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "1; SELECT * FROM users",
        "UNION SELECT password FROM users",
      ]

      for payload <- sql_payloads do
        # Should not cause database errors
        conn = get(conn, ~p"/api/v1/search", %{q: payload})
        status = conn.status

        assert status in [200, 400],
          "SQL injection attempt should not cause 500: #{payload}"
      end
    end
  end

  describe "path traversal prevention" do
    test "file uploads reject path traversal" do
      {:ok, user, conn} = auth_user()

      traversal_names = [
        "../../../etc/passwd",
        "..\\..\\windows\\system32\\config\\sam",
        "%2e%2e%2f%2e%2e%2f",
        "....//....//",
      ]

      for filename <- traversal_names do
        upload = %Plug.Upload{
          path: "/tmp/test.txt",
          filename: filename,
          content_type: "text/plain"
        }

        conn = post(conn, ~p"/api/v1/upload", %{file: upload})

        if conn.status == 201 do
          response = json_response(conn, 201)
          refute response["path"] =~ ".."
        end
      end
    end
  end
end
```

### 1.4 Cryptographic Tests

```typescript
// apps/web/src/lib/e2ee/__tests__/crypto.security.test.ts

import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  deriveSharedSecret,
  encryptMessage,
  decryptMessage,
  verifySignature,
} from '../crypto';

describe('E2EE Cryptographic Security', () => {
  describe('Key Generation', () => {
    it('generates unique keys each time', async () => {
      const keys1 = await generateKeyPair();
      const keys2 = await generateKeyPair();

      expect(keys1.publicKey).not.toEqual(keys2.publicKey);
      expect(keys1.privateKey).not.toEqual(keys2.privateKey);
    });

    it('private key cannot be derived from public key', async () => {
      const { publicKey, privateKey } = await generateKeyPair();

      // This is a conceptual test - in practice, we verify
      // that the key generation uses proper cryptographic primitives
      expect(publicKey.length).toBeGreaterThan(0);
      expect(privateKey.length).toBeGreaterThan(0);

      // Private key should not be extractable in production
      // This would be enforced by CryptoKey extractable: false
    });
  });

  describe('Message Encryption', () => {
    it('ciphertext does not contain plaintext', async () => {
      const plaintext = 'Secret message content here';
      const key = await generateEncryptionKey();

      const ciphertext = await encryptMessage(plaintext, key);

      expect(ciphertext).not.toContain(plaintext);
      expect(ciphertext).not.toContain('Secret');
      expect(ciphertext).not.toContain('message');
    });

    it('same plaintext produces different ciphertext (IV randomness)', async () => {
      const plaintext = 'Hello';
      const key = await generateEncryptionKey();

      const ciphertexts = await Promise.all(
        Array(10)
          .fill(null)
          .map(() => encryptMessage(plaintext, key))
      );

      // All ciphertexts should be unique (random IV)
      const unique = new Set(ciphertexts);
      expect(unique.size).toBe(10);
    });

    it('rejects tampered ciphertext', async () => {
      const plaintext = 'Original message';
      const key = await generateEncryptionKey();

      const ciphertext = await encryptMessage(plaintext, key);

      // Tamper with ciphertext
      const tamperedBytes = new Uint8Array(Buffer.from(ciphertext, 'base64'));
      tamperedBytes[20] ^= 0xff; // Flip bits
      const tampered = Buffer.from(tamperedBytes).toString('base64');

      await expect(decryptMessage(tampered, key)).rejects.toThrow(
        /decryption failed|tag mismatch/i
      );
    });
  });

  describe('Forward Secrecy', () => {
    it('compromised session key does not expose past messages', async () => {
      // Simulate Triple Ratchet - each message uses derived key
      const session = await createSession();

      const messages = [];
      for (let i = 0; i < 5; i++) {
        const { ciphertext, key } = await session.encryptMessage(`Message ${i}`);
        messages.push({ ciphertext, key });
        await session.ratchet(); // Advance ratchet
      }

      // If attacker gets key for message 3, they can't decrypt 0-2
      const stolenKey = messages[3].key;

      for (let i = 0; i < 3; i++) {
        await expect(decryptMessage(messages[i].ciphertext, stolenKey)).rejects.toThrow();
      }
    });
  });

  describe('Signature Verification', () => {
    it('rejects messages with invalid signatures', async () => {
      const { publicKey: senderPub, privateKey: senderPriv } = await generateKeyPair();
      const { privateKey: attackerPriv } = await generateKeyPair();

      const message = 'Authentic message';

      // Attacker signs with their key
      const fakeSignature = await signMessage(message, attackerPriv);

      // Verification with sender's public key should fail
      const isValid = await verifySignature(message, fakeSignature, senderPub);
      expect(isValid).toBe(false);
    });
  });
});
```

### 1.5 Rate Limiting Tests

```elixir
# test/cgraph_web/security/rate_limiting_test.exs

defmodule CGraphWeb.Security.RateLimitingTest do
  use CGraphWeb.ConnCase

  describe "authentication rate limiting" do
    test "blocks after 5 failed login attempts" do
      conn = build_conn()

      # 5 failed attempts
      for _ <- 1..5 do
        conn = post(conn, ~p"/api/v1/auth/login", %{
          email: "user@example.com",
          password: "wrong"
        })
        assert conn.status == 401
      end

      # 6th attempt is rate limited
      conn = post(conn, ~p"/api/v1/auth/login", %{
        email: "user@example.com",
        password: "wrong"
      })
      assert conn.status == 429
      assert json_response(conn, 429)["error"] =~ "Too many attempts"
    end

    test "rate limit applies per IP" do
      # Different IPs should have separate limits
      conn1 = build_conn() |> put_req_header("x-forwarded-for", "1.1.1.1")
      conn2 = build_conn() |> put_req_header("x-forwarded-for", "2.2.2.2")

      # Exhaust limit for IP 1
      for _ <- 1..5 do
        post(conn1, ~p"/api/v1/auth/login", %{email: "a@b.com", password: "x"})
      end

      # IP 2 should still work
      result = post(conn2, ~p"/api/v1/auth/login", %{
        email: "a@b.com",
        password: "x"
      })
      assert result.status in [401, 200]  # Not 429
    end
  end

  describe "API rate limiting" do
    test "message sending is rate limited" do
      {:ok, user, conn} = auth_user()
      {:ok, channel} = create_channel(user)

      # Send 60 messages (at limit)
      for _ <- 1..60 do
        post(conn, ~p"/api/v1/channels/#{channel.id}/messages", %{
          content: "Hello"
        })
      end

      # 61st should be blocked
      result = post(conn, ~p"/api/v1/channels/#{channel.id}/messages", %{
        content: "Too many"
      })
      assert result.status == 429
    end
  end
end
```

---

## 2. CI/CD Security Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1' # Weekly Monday 6am

jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Audit npm dependencies
        run: pnpm audit --audit-level=high
        continue-on-error: true

      - name: Audit Elixir dependencies
        working-directory: apps/backend
        run: mix deps.audit

  secret-scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Gitleaks scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Elixir
        uses: erlef/setup-beam@v1
        with:
          elixir-version: '1.17'
          otp-version: '27'

      - name: Sobelow security scan
        working-directory: apps/backend
        run: |
          mix deps.get
          mix sobelow --config

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run security test suite
        working-directory: apps/backend
        run: |
          mix deps.get
          mix test test/cgraph/security/ --trace

      - name: Run frontend security tests
        working-directory: apps/web
        run: |
          pnpm install
          pnpm test:security
```

### Sobelow Configuration

```elixir
# apps/backend/.sobelow-conf
[
  verbose: true,
  private: false,
  skip: false,
  router: "lib/cgraph_web/router.ex",
  exit: "high",
  format: "txt",
  ignore: [
    # Document any false positives here
    # {"SQL.Query", "lib/cgraph/search.ex", 42}
  ]
]
```

---

## 3. Penetration Testing Guide

### Scope for External Pentest

**In Scope:**

- Web application (app.cgraph.org)
- API endpoints (cgraph-backend.fly.dev)
- Mobile applications (iOS, Android)
- WebSocket connections
- Authentication flows
- E2EE implementation

**Out of Scope:**

- Third-party services (Fly.io, Vercel infrastructure)
- Physical security
- Social engineering
- DDoS testing

### Test Cases for Pentest

1. **Authentication Bypass**
   - JWT manipulation
   - Session fixation
   - OAuth flow hijacking

2. **Authorization Issues**
   - IDOR (Insecure Direct Object Reference)
   - Privilege escalation
   - Missing function-level access control

3. **Injection**
   - SQL injection
   - XSS (reflected, stored, DOM)
   - Command injection
   - Template injection

4. **Cryptographic Issues**
   - Key extraction
   - Weak algorithms
   - Implementation flaws

5. **Business Logic**
   - Rate limiting bypass
   - Race conditions
   - Payment manipulation (future)

---

## 4. Vulnerability Disclosure

### Responsible Disclosure Policy

See [SECURITY.md](../SECURITY.md) for full policy.

**Summary:**

- Report to: security@cgraph.app
- Response time: 48 hours
- No legal action for good-faith reports
- Credit given (with permission)
- Bounties for critical/high severity (post-launch)

---

<sub>**CGraph Security Testing Framework** • Version 0.9.31</sub>
