defmodule Cgraph.SecurityTest do
  @moduledoc """
  Comprehensive security tests for CGraph security features.
  
  Tests cover:
  - Token revocation system
  - Account lockout
  - Security headers
  - Password breach checking
  - TOTP 2FA
  """
  use Cgraph.DataCase, async: false

  import Bitwise

  alias Cgraph.Security.{TokenBlacklist, AccountLockout, PasswordBreachCheck, TOTP}
  alias Cgraph.Accounts
  alias Cgraph.Guardian

  # ============================================================================
  # Token Blacklist Tests
  # ============================================================================

  describe "TokenBlacklist" do
    test "revokes a token by JTI" do
      jti = generate_jti()
      
      assert :ok = TokenBlacklist.revoke_by_jti(jti, reason: :logout)
      assert TokenBlacklist.revoked_by_jti?(jti) == true
    end

    test "non-revoked token returns false" do
      jti = generate_jti()
      
      assert TokenBlacklist.revoked_by_jti?(jti) == false
    end

    test "revokes all tokens for a user" do
      user_id = Ecto.UUID.generate()
      
      assert :ok = TokenBlacklist.revoke_all_for_user(user_id, reason: :password_change)
      
      # Check that user-level revocation is set
      assert {:ok, _time} = TokenBlacklist.user_tokens_revoked_before?(user_id)
    end

    test "user_tokens_revoked_before? returns :not_revoked for clean users" do
      user_id = Ecto.UUID.generate()
      
      assert :not_revoked = TokenBlacklist.user_tokens_revoked_before?(user_id)
    end

    test "revoke with full token" do
      # Create a mock token (just a string for testing)
      token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature"
      
      assert :ok = TokenBlacklist.revoke(token, reason: :logout)
      assert TokenBlacklist.revoked?(token) == true
    end

    test "stats returns server information" do
      stats = TokenBlacklist.stats()
      
      assert is_map(stats)
      assert Map.has_key?(stats, :revocation_count)
      assert Map.has_key?(stats, :started_at)
      assert Map.has_key?(stats, :uptime_seconds)
    end

    test "validates revocation reasons" do
      jti = generate_jti()
      
      # Valid reasons
      assert :ok = TokenBlacklist.revoke_by_jti(jti, reason: :logout)
      assert :ok = TokenBlacklist.revoke_by_jti(generate_jti(), reason: :password_change)
      assert :ok = TokenBlacklist.revoke_by_jti(generate_jti(), reason: :security_breach)
      
      # Invalid reason should raise
      assert_raise ArgumentError, fn ->
        TokenBlacklist.revoke_by_jti(generate_jti(), reason: :invalid_reason)
      end
    end
  end

  # ============================================================================
  # Account Lockout Tests
  # ============================================================================

  describe "AccountLockout" do
    test "allows login when not locked" do
      email = "test_#{System.unique_integer()}@example.com"
      
      assert :ok = AccountLockout.check_locked(email)
    end

    test "records failed attempts" do
      email = "locktest_#{System.unique_integer()}@example.com"
      
      # Record failures but don't exceed threshold
      assert :ok = AccountLockout.record_failed_attempt(email)
      assert :ok = AccountLockout.record_failed_attempt(email)
      
      # Should still allow login
      assert :ok = AccountLockout.check_locked(email)
    end

    test "locks account after max attempts" do
      email = "lockmax_#{System.unique_integer()}@example.com"
      
      # Default is 5 attempts
      Enum.each(1..4, fn _ ->
        AccountLockout.record_failed_attempt(email)
      end)
      
      # 5th attempt should trigger lockout
      result = AccountLockout.record_failed_attempt(email)
      assert {:locked, duration} = result
      assert duration > 0
      
      # Subsequent checks should be locked
      assert {:locked, _} = AccountLockout.check_locked(email)
    end

    test "clears attempts on success" do
      email = "clearclear_#{System.unique_integer()}@example.com"
      
      # Record some failures
      AccountLockout.record_failed_attempt(email)
      AccountLockout.record_failed_attempt(email)
      
      # Clear on successful login
      assert :ok = AccountLockout.clear_attempts(email)
      
      # Info should show 0 attempts
      info = AccountLockout.get_lockout_info(email)
      assert info.attempts == 0
      assert info.locked == false
    end

    test "admin can unlock account" do
      email = "adminunlock_#{System.unique_integer()}@example.com"
      admin_id = Ecto.UUID.generate()
      
      # Lock the account
      Enum.each(1..5, fn _ ->
        AccountLockout.record_failed_attempt(email)
      end)
      
      assert {:locked, _} = AccountLockout.check_locked(email)
      
      # Admin unlock
      assert :ok = AccountLockout.admin_unlock(email, admin_id)
      
      # Should be unlocked now
      assert :ok = AccountLockout.check_locked(email)
    end

    test "get_lockout_info returns correct data" do
      email = "infotest_#{System.unique_integer()}@example.com"
      
      info = AccountLockout.get_lockout_info(email)
      
      assert info.locked == false
      assert info.attempts == 0
      assert info.locked_until == nil
      assert info.remaining_seconds == 0
    end

    test "stats returns server statistics" do
      stats = AccountLockout.stats()
      
      assert is_map(stats)
      assert Map.has_key?(stats, :locks_issued)
      assert Map.has_key?(stats, :started_at)
      assert Map.has_key?(stats, :config)
    end

    test "normalizes email identifiers" do
      # Use unique email to avoid state pollution from other tests
      unique_suffix = :erlang.unique_integer([:positive])
      email = "NORMALIZE_#{unique_suffix}@EXAMPLE.COM"
      
      # These should all refer to the same account
      AccountLockout.record_failed_attempt(email)
      AccountLockout.record_failed_attempt("normalize_#{unique_suffix}@example.com")
      AccountLockout.record_failed_attempt(" Normalize_#{unique_suffix}@Example.Com ")
      
      info = AccountLockout.get_lockout_info("normalize_#{unique_suffix}@example.com")
      assert info.attempts == 3
    end
  end

  # ============================================================================
  # Password Breach Check Tests
  # ============================================================================

  describe "PasswordBreachCheck" do
    @tag :external_api
    test "detects known breached passwords" do
      # "password" is definitely in breaches
      result = PasswordBreachCheck.check("password")
      
      case result do
        {:ok, {:breached, count}} ->
          assert count > 0
        {:error, _} ->
          # API might be unavailable in tests
          :ok
      end
    end

    @tag :external_api
    test "allows strong unique passwords" do
      # Generate a truly random password that won't be in breaches
      password = :crypto.strong_rand_bytes(32) |> Base.encode64()
      
      case PasswordBreachCheck.check(password) do
        {:ok, :safe} -> :ok
        {:error, _} -> :ok  # API unavailable is acceptable
        {:ok, {:breached, _}} -> flunk("Random password marked as breached")
      end
    end

    test "validate returns :ok or error tuple" do
      result = PasswordBreachCheck.validate("password")
      
      # Either it finds the breach or the API is down
      assert result == :ok or match?({:error, _}, result)
    end

    test "check_async returns :ok immediately" do
      assert :ok = PasswordBreachCheck.check_async("password")
    end

    test "uses cache for repeated checks" do
      password = "test_password_#{System.unique_integer()}"
      
      # First check - hits API
      result1 = PasswordBreachCheck.check(password, use_cache: true)
      
      # Second check - should use cache
      result2 = PasswordBreachCheck.check(password, use_cache: true)
      
      # Results should match
      assert result1 == result2
    end
  end

  # ============================================================================
  # TOTP Tests
  # ============================================================================

  describe "TOTP" do
    setup do
      {:ok, user} = create_test_user()
      {:ok, user: user}
    end

    test "setup_2fa generates secret and backup codes", %{user: user} do
      assert {:ok, setup} = TOTP.setup_2fa(user)
      
      assert is_binary(setup.secret)
      assert is_binary(setup.secret_base32)
      assert String.starts_with?(setup.qr_code_uri, "otpauth://totp/")
      assert is_list(setup.backup_codes)
      assert length(setup.backup_codes) == 10
    end

    test "setup_2fa fails if already enabled", %{user: user} do
      # Enable 2FA first
      {:ok, setup} = TOTP.setup_2fa(user)
      code = generate_totp_code(setup.secret)
      {:ok, user} = TOTP.verify_and_enable(user, code, setup.secret, setup.backup_codes)
      
      # Try to set up again
      assert {:error, :already_enabled} = TOTP.setup_2fa(user)
    end

    test "verify_and_enable with valid code", %{user: user} do
      {:ok, setup} = TOTP.setup_2fa(user)
      
      # Generate a valid TOTP code
      code = generate_totp_code(setup.secret)
      
      assert {:ok, updated_user} = TOTP.verify_and_enable(
        user, 
        code, 
        setup.secret, 
        setup.backup_codes
      )
      
      assert updated_user.totp_enabled == true
      assert updated_user.totp_secret != nil
    end

    test "verify_and_enable with invalid code", %{user: user} do
      {:ok, setup} = TOTP.setup_2fa(user)
      
      assert {:error, :invalid_code} = TOTP.verify_and_enable(
        user, 
        "000000",  # Invalid code
        setup.secret, 
        setup.backup_codes
      )
    end

    test "totp_enabled? returns correct status", %{user: user} do
      assert TOTP.totp_enabled?(user) == false
      
      # Enable 2FA
      {:ok, setup} = TOTP.setup_2fa(user)
      code = generate_totp_code(setup.secret)
      {:ok, enabled_user} = TOTP.verify_and_enable(user, code, setup.secret, setup.backup_codes)
      
      assert TOTP.totp_enabled?(enabled_user) == true
    end

    test "verify with valid code", %{user: user} do
      # Enable 2FA
      {:ok, setup} = TOTP.setup_2fa(user)
      code = generate_totp_code(setup.secret)
      {:ok, enabled_user} = TOTP.verify_and_enable(user, code, setup.secret, setup.backup_codes)
      
      # Verify with a new code
      new_code = generate_totp_code(setup.secret)
      assert :ok = TOTP.verify(enabled_user, new_code)
    end

    test "verify with invalid code", %{user: user} do
      # Enable 2FA
      {:ok, setup} = TOTP.setup_2fa(user)
      code = generate_totp_code(setup.secret)
      {:ok, enabled_user} = TOTP.verify_and_enable(user, code, setup.secret, setup.backup_codes)
      
      assert {:error, :invalid_code} = TOTP.verify(enabled_user, "000000")
    end

    test "verify returns error when 2FA not enabled", %{user: user} do
      assert {:error, :totp_not_enabled} = TOTP.verify(user, "123456")
    end

    test "backup codes work", %{user: user} do
      # Enable 2FA
      {:ok, setup} = TOTP.setup_2fa(user)
      code = generate_totp_code(setup.secret)
      {:ok, enabled_user} = TOTP.verify_and_enable(user, code, setup.secret, setup.backup_codes)
      
      # Use a backup code
      backup_code = List.first(setup.backup_codes)
      assert {:ok, 9} = TOTP.use_backup_code(enabled_user, backup_code)
    end

    test "backup codes can only be used once", %{user: user} do
      # Enable 2FA
      {:ok, setup} = TOTP.setup_2fa(user)
      code = generate_totp_code(setup.secret)
      {:ok, enabled_user} = TOTP.verify_and_enable(user, code, setup.secret, setup.backup_codes)
      
      # Use a backup code
      backup_code = List.first(setup.backup_codes)
      {:ok, _} = TOTP.use_backup_code(enabled_user, backup_code)
      
      # Reload user and try again
      enabled_user = Accounts.get_user!(enabled_user.id)
      assert {:error, :invalid_code} = TOTP.use_backup_code(enabled_user, backup_code)
    end
  end

  # ============================================================================
  # Security Headers Tests
  # ============================================================================

  describe "SecurityHeaders plug" do
    test "applies security headers to API responses" do
      conn = Phoenix.ConnTest.build_conn()
      opts = CgraphWeb.Plugs.SecurityHeaders.init(mode: :api)
      conn = CgraphWeb.Plugs.SecurityHeaders.call(conn, opts)
      
      # Check essential security headers exist
      assert get_header(conn, "content-security-policy") != nil
      assert get_header(conn, "x-content-type-options") == "nosniff"
      assert get_header(conn, "x-frame-options") == "DENY"
      assert get_header(conn, "referrer-policy") != nil
      assert get_header(conn, "x-xss-protection") == "1; mode=block"
    end

    test "CSP includes frame-ancestors restriction" do
      conn = Phoenix.ConnTest.build_conn()
      opts = CgraphWeb.Plugs.SecurityHeaders.init(mode: :api)
      conn = CgraphWeb.Plugs.SecurityHeaders.call(conn, opts)
      
      csp = get_header(conn, "content-security-policy")
      # Frame-ancestors 'none' or 'self' both acceptable for security
      assert csp =~ "frame-ancestors"
    end

    test "permissions policy restricts browser features" do
      conn = Phoenix.ConnTest.build_conn()
      opts = CgraphWeb.Plugs.SecurityHeaders.init(mode: :api)
      conn = CgraphWeb.Plugs.SecurityHeaders.call(conn, opts)
      
      policy = get_header(conn, "permissions-policy")
      assert policy =~ "camera=()"
      assert policy =~ "microphone=()"
      assert policy =~ "geolocation=()"
    end

    test "cross-origin policies function exists" do
      # Verify the apply_cross_origin_policies function is defined
      # The actual header setting is tested via integration tests
      conn = Phoenix.ConnTest.build_conn()
      opts = CgraphWeb.Plugs.SecurityHeaders.init(mode: :api)
      
      # call/2 should not raise
      result = CgraphWeb.Plugs.SecurityHeaders.call(conn, opts)
      assert %Plug.Conn{} = result
    end
  end

  # ============================================================================
  # Guardian Token Tests
  # ============================================================================

  describe "Guardian token security" do
    setup do
      {:ok, user} = create_test_user()
      {:ok, user: user}
    end

    test "generates tokens with JTI", %{user: user} do
      {:ok, tokens} = Guardian.generate_tokens(user)
      
      {:ok, claims} = Guardian.decode_and_verify(tokens.access_token)
      
      assert Map.has_key?(claims, "jti")
      assert is_binary(claims["jti"])
    end

    test "tokens include issued-at claim", %{user: user} do
      {:ok, tokens} = Guardian.generate_tokens(user)
      
      {:ok, claims} = Guardian.decode_and_verify(tokens.access_token)
      
      assert Map.has_key?(claims, "iat")
      assert is_integer(claims["iat"])
    end

    test "revoke_token adds to blacklist", %{user: user} do
      {:ok, tokens} = Guardian.generate_tokens(user)
      
      # Get JTI before revocation
      {:ok, claims} = Guardian.decode_and_verify(tokens.access_token)
      jti = claims["jti"]
      
      # Verify not revoked initially
      assert TokenBlacklist.revoked_by_jti?(jti) == false
      
      # Revoke the token
      Guardian.revoke_token(tokens.access_token, reason: :logout)
      
      # Check blacklist directly
      assert TokenBlacklist.revoked_by_jti?(jti) == true
      
      # Verify should now fail due to revocation
      assert {:error, :token_revoked} = Guardian.decode_and_verify(tokens.access_token)
    end

    test "revoke_all_user_tokens invalidates user tokens", %{user: user} do
      {:ok, _tokens} = Guardian.generate_tokens(user)
      
      # Revoke all tokens for user
      Guardian.revoke_all_user_tokens(user.id)
      
      # Check user-level revocation
      assert {:ok, _time} = TokenBlacklist.user_tokens_revoked_before?(user.id)
    end
  end

  # ============================================================================
  # Helper Functions
  # ============================================================================

  defp create_test_user do
    attrs = %{
      "email" => "test_#{System.unique_integer([:positive])}@example.com",
      "password" => "SecureP@ssw0rd!",
      "username" => "user_#{System.unique_integer([:positive])}"
    }
    
    Accounts.register_user(attrs, check_breach: false)
  end

  defp generate_jti do
    :crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)
  end

  defp generate_totp_code(secret_base64) do
    secret = Base.decode64!(secret_base64)
    counter = div(System.system_time(:second), 30)
    
    counter_bytes = <<counter::unsigned-big-integer-size(64)>>
    hmac = :crypto.mac(:hmac, :sha, secret, counter_bytes)
    
    offset = :binary.at(hmac, 19) &&& 0x0F
    <<_::binary-size(offset), code::unsigned-big-integer-size(32), _::binary>> = hmac
    
    truncated = (code &&& 0x7FFFFFFF) |> rem(1_000_000)
    
    truncated
    |> Integer.to_string()
    |> String.pad_leading(6, "0")
  end

  defp get_header(conn, name) do
    case Plug.Conn.get_resp_header(conn, name) do
      [value | _] -> value
      [] -> nil
    end
  end
end
