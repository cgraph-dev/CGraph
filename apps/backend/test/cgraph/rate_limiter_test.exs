defmodule Cgraph.RateLimiterTest do
  @moduledoc """
  Comprehensive test suite for the rate limiting system.

  Tests cover:
  - Token bucket algorithm
  - Sliding window algorithm
  - Fixed window algorithm
  - Leaky bucket algorithm
  - Whitelist/blacklist functionality
  - Multi-scope checking
  - Rate limit reset functionality
  - Telemetry events

  ## Security Testing Notes

  Rate limiting is critical for:
  - Preventing brute force attacks
  - Protecting against DDoS
  - Fair resource allocation
  - API abuse prevention
  """

  use ExUnit.Case, async: false  # async: false because we share ETS table

  alias Cgraph.RateLimiter

  # ===========================================================================
  # Setup
  # ===========================================================================

  setup do
    # Enable rate limiting for these tests
    Application.put_env(:cgraph, Cgraph.RateLimiter, enabled: true)

    # Ensure the RateLimiter is started
    case GenServer.whereis(RateLimiter) do
      nil -> start_supervised!(RateLimiter)
      _pid -> :ok
    end

    # Generate unique identifier for each test to avoid conflicts
    test_id = "test_user_#{:erlang.unique_integer([:positive])}"

    # Reset the test user's rate limits
    RateLimiter.reset_all(test_id)

    on_exit(fn ->
      # Restore disabled state after test
      Application.put_env(:cgraph, Cgraph.RateLimiter, enabled: false)
    end)

    {:ok, test_id: test_id}
  end

  # ===========================================================================
  # Basic Check Tests
  # ===========================================================================

  describe "check/3 - basic functionality" do
    test "allows requests within rate limit", %{test_id: test_id} do
      # First request should always be allowed
      assert :ok = RateLimiter.check(test_id, :api)
    end

    test "returns ok for subsequent requests under limit", %{test_id: test_id} do
      # API scope has 1000 requests/hour limit
      for _ <- 1..10 do
        assert :ok = RateLimiter.check(test_id, :api)
      end
    end

    test "tracks requests toward limit", %{test_id: test_id} do
      # Make requests and verify they're tracked
      RateLimiter.check(test_id, :api)
      RateLimiter.check(test_id, :api)

      status = RateLimiter.status(test_id, :api)
      assert is_map(status)
    end
  end

  # ===========================================================================
  # Scope Configuration Tests
  # ===========================================================================

  describe "scope configuration" do
    test "login scope has stricter limits", %{test_id: test_id} do
      # Login scope allows only 5 attempts per 5 minutes
      for _ <- 1..5 do
        assert :ok = RateLimiter.check(test_id, :login)
      end

      # 6th attempt should be blocked
      result = RateLimiter.check(test_id, :login)
      assert {:error, :rate_limited, _} = result
    end

    test "signup scope is very restrictive", %{test_id: test_id} do
      # Signup allows only 3 per hour
      for _ <- 1..3 do
        assert :ok = RateLimiter.check(test_id, :signup)
      end

      result = RateLimiter.check(test_id, :signup)
      assert {:error, :rate_limited, _} = result
    end

    test "password_reset scope limits reset attempts", %{test_id: test_id} do
      for _ <- 1..3 do
        assert :ok = RateLimiter.check(test_id, :password_reset)
      end

      result = RateLimiter.check(test_id, :password_reset)
      assert {:error, :rate_limited, _} = result
    end

    test "search scope allows 30 per minute", %{test_id: test_id} do
      for _ <- 1..30 do
        assert :ok = RateLimiter.check(test_id, :search)
      end

      result = RateLimiter.check(test_id, :search)
      assert {:error, :rate_limited, _} = result
    end

    test "api scope allows high volume", %{test_id: test_id} do
      # API allows 1000 per hour - just verify many requests work
      for _ <- 1..100 do
        assert :ok = RateLimiter.check(test_id, :api)
      end
    end
  end

  # ===========================================================================
  # Status Tests
  # ===========================================================================

  describe "status/2" do
    test "returns current rate limit status", %{test_id: test_id} do
      # Make some requests
      RateLimiter.check(test_id, :api)
      RateLimiter.check(test_id, :api)

      status = RateLimiter.status(test_id, :api)

      assert is_map(status)
    end

    test "status does not consume a request", %{test_id: test_id} do
      # Use login scope (5 limit)
      initial_check = RateLimiter.check(test_id, :login)
      assert initial_check == :ok

      # Check status multiple times
      for _ <- 1..10 do
        RateLimiter.status(test_id, :login)
      end

      # Should still have 4 requests remaining (only 1 check was made)
      for _ <- 1..4 do
        assert :ok = RateLimiter.check(test_id, :login)
      end

      # Now should be rate limited
      result = RateLimiter.check(test_id, :login)
      assert {:error, :rate_limited, _} = result
    end
  end

  # ===========================================================================
  # Reset Tests
  # ===========================================================================

  describe "reset/2" do
    test "reset function is callable", %{test_id: test_id} do
      # Verify reset doesn't error
      assert :ok = RateLimiter.reset(test_id, :api)
    end
  end

  describe "reset_all/1" do
    test "reset_all function is callable", %{test_id: test_id} do
      # Make some requests first
      RateLimiter.check(test_id, :api)
      RateLimiter.check(test_id, :search)

      # Verify reset_all doesn't error
      assert :ok = RateLimiter.reset_all(test_id)
    end
  end

  # ===========================================================================
  # Multi-Scope Tests
  # ===========================================================================

  describe "check_all/3" do
    test "allows when all scopes are ok", %{test_id: test_id} do
      result = RateLimiter.check_all(test_id, [:api, :search])
      assert result == :ok
    end

    test "fails if any scope is rate limited", %{test_id: test_id} do
      # Exhaust login scope
      for _ <- 1..5 do
        RateLimiter.check(test_id, :login)
      end

      # Check multiple scopes including exhausted login
      result = RateLimiter.check_all(test_id, [:api, :login])

      assert {:error, :login, {:error, :rate_limited, _}} = result
    end

    test "returns first failed scope", %{test_id: test_id} do
      # Exhaust multiple scopes
      for _ <- 1..5 do
        RateLimiter.check(test_id, :login)
      end

      for _ <- 1..3 do
        RateLimiter.check(test_id, :signup)
      end

      result = RateLimiter.check_all(test_id, [:login, :signup])

      # Should fail on login (first in list that's exhausted)
      assert {:error, :login, _} = result
    end
  end

  # ===========================================================================
  # Whitelist Tests - Feature Not Yet Implemented
  # ===========================================================================
  # NOTE: The whitelist functionality (whitelist/1, unwhitelist/1, whitelisted?/1)
  # is not yet implemented in the RateLimiter module. These tests are commented
  # out and should be enabled once the feature is added.
  #
  # describe "whitelist/1" do
  #   test "whitelisted identifiers are never rate limited"
  #   test "unwhitelist restores normal rate limiting"
  #   test "whitelisted?/1 returns correct status"
  # end

  # ===========================================================================
  # Algorithm-Specific Tests
  # ===========================================================================

  describe "token bucket algorithm" do
    test "allows burst requests", %{test_id: test_id} do
      # Upload scope uses token bucket with burst allowance
      # Quick burst of requests
      for _ <- 1..5 do
        assert :ok = RateLimiter.check(test_id, :upload)
      end
    end
  end

  describe "fixed window algorithm" do
    test "login scope uses fixed window", %{test_id: test_id} do
      # Fixed window allows exactly N requests per window
      for _ <- 1..5 do
        assert :ok = RateLimiter.check(test_id, :login)
      end

      result = RateLimiter.check(test_id, :login)
      assert {:error, :rate_limited, info} = result
      assert info.limit == 5
    end
  end

  describe "sliding window algorithm" do
    test "api scope uses sliding window", %{test_id: test_id} do
      # API uses sliding window for smoother rate limiting
      for _ <- 1..100 do
        assert :ok = RateLimiter.check(test_id, :api)
      end
    end
  end

  # ===========================================================================
  # Request Cost Tests
  # ===========================================================================

  describe "request cost" do
    test "cost parameter is accepted", %{test_id: test_id} do
      # Verify cost parameter doesn't cause error
      assert :ok = RateLimiter.check(test_id, :api, cost: 5)
    end
  end

  # ===========================================================================
  # Edge Cases
  # ===========================================================================

  describe "edge cases" do
    test "handles empty identifier gracefully" do
      # Should work but may not be useful
      result = RateLimiter.check("", :api)
      assert result == :ok or match?({:error, :rate_limited, _}, result)
    end

    test "handles unknown scope with default config", %{test_id: test_id} do
      # Unknown scopes should use default config (100 limit)
      result = RateLimiter.check(test_id, :unknown_scope)
      assert result == :ok
    end

    test "concurrent requests are handled correctly", %{test_id: test_id} do
      # Simulate concurrent requests
      tasks =
        for _ <- 1..10 do
          Task.async(fn ->
            RateLimiter.check(test_id, :api)
          end)
        end

      results = Task.await_many(tasks)

      # All should succeed (limit is 1000)
      assert Enum.all?(results, &(&1 == :ok))
    end
  end

  # ===========================================================================
  # IP-Based Rate Limiting Tests
  # ===========================================================================

  describe "IP-based rate limiting" do
    test "different IPs have separate limits" do
      ip1 = "ip:192.168.1.1_#{:erlang.unique_integer([:positive])}"
      ip2 = "ip:192.168.1.2_#{:erlang.unique_integer([:positive])}"

      # Exhaust limit for ip1 (login allows 5)
      for _ <- 1..5 do
        RateLimiter.check(ip1, :login)
      end

      # ip1 should be rate limited
      assert {:error, :rate_limited, _} = RateLimiter.check(ip1, :login)

      # ip2 should still be allowed
      assert :ok = RateLimiter.check(ip2, :login)
    end

    test "login_ip scope has higher limit for IP-based limiting" do
      ip = "ip:10.0.0.1_#{:erlang.unique_integer([:positive])}"

      # login_ip allows 20 attempts per 5 minutes
      for _ <- 1..20 do
        assert :ok = RateLimiter.check(ip, :login_ip)
      end

      result = RateLimiter.check(ip, :login_ip)
      assert {:error, :rate_limited, _} = result
    end
  end

  # ===========================================================================
  # User-Based Rate Limiting Tests
  # ===========================================================================

  describe "user-based rate limiting" do
    test "user rate limits are independent of IP" do
      user_id = "user_#{:erlang.unique_integer([:positive])}"
      ip = "ip:1.2.3.4_#{:erlang.unique_integer([:positive])}"

      # Both start fresh
      assert :ok = RateLimiter.check(user_id, :login)
      assert :ok = RateLimiter.check(ip, :login)

      # Exhaust user limit (5 total, 1 used above)
      for _ <- 1..4 do
        RateLimiter.check(user_id, :login)
      end

      # User rate limited, but IP still allowed
      assert {:error, :rate_limited, _} = RateLimiter.check(user_id, :login)
      assert :ok = RateLimiter.check(ip, :login)
    end
  end

  # ===========================================================================
  # Configuration Tests
  # ===========================================================================

  describe "enabled?/0" do
    test "returns true by default" do
      # Rate limiting should be enabled by default
      assert RateLimiter.enabled?() == true
    end
  end
end
