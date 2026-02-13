defmodule CGraph.Chaos.CircuitBreakerValidatorTest do
  @moduledoc """
  Tests for circuit breaker validation.
  Verifies fuse health reporting works correctly.
  """
  use ExUnit.Case, async: true

  alias CGraph.Chaos.CircuitBreakerValidator

  describe "known_fuses/0" do
    test "returns list of known fuse names" do
      fuses = CircuitBreakerValidator.known_fuses()
      assert is_list(fuses)
      assert :redis_fuse in fuses
      assert :apns_fuse in fuses
      assert :fcm_fuse in fuses
      assert :expo_fuse in fuses
      assert :web_push_fuse in fuses
      assert :mailer_fuse in fuses
    end
  end

  describe "health_report/0" do
    test "returns a map of fuse statuses" do
      report = CircuitBreakerValidator.health_report()
      assert is_map(report)

      for fuse <- CircuitBreakerValidator.known_fuses() do
        assert Map.has_key?(report, fuse),
               "Expected #{fuse} in health report"
        assert report[fuse] in [:ok, :blown, :not_found],
               "Expected valid status for #{fuse}, got: #{inspect(report[fuse])}"
      end
    end
  end

  describe "validate_fuse/1" do
    test "returns valid status for known fuses" do
      status = CircuitBreakerValidator.validate_fuse(:redis_fuse)
      assert status in [:ok, :blown, :not_found]
    end

    test "returns :not_found for unknown fuses" do
      status = CircuitBreakerValidator.validate_fuse(:nonexistent_fuse)
      assert status == :not_found
    end
  end
end
