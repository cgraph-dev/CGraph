defmodule CGraph.Crypto.E2EE.RatchetStateTest do
  @moduledoc "Tests for ratchet state validation and safety numbers."
  use CGraph.DataCase, async: true

  alias CGraph.Crypto.E2EE.{RatchetState, SecretSession}

  describe "verify_ratchet_advance/2" do
    test "accepts first message (no prior ratchet key)" do
      session = %SecretSession{current_ratchet_public_key: nil, message_count: 0}
      header = :crypto.strong_rand_bytes(32)

      assert {:ok, :valid} = RatchetState.verify_ratchet_advance(session, header)
    end

    test "accepts same ratchet key (same chain)" do
      key = :crypto.strong_rand_bytes(32)
      session = %SecretSession{current_ratchet_public_key: key, message_count: 5}

      assert {:ok, :valid} = RatchetState.verify_ratchet_advance(session, key)
    end

    test "accepts new ratchet key (DH ratchet step)" do
      old_key = :crypto.strong_rand_bytes(32)
      new_key = :crypto.strong_rand_bytes(32)
      session = %SecretSession{current_ratchet_public_key: old_key, message_count: 5}

      assert {:ok, :valid} = RatchetState.verify_ratchet_advance(session, new_key)
    end

    test "rejects empty ratchet header" do
      session = %SecretSession{current_ratchet_public_key: nil, message_count: 0}

      assert {:error, :invalid_ratchet_header} = RatchetState.verify_ratchet_advance(session, "")
    end

    test "rejects nil ratchet header" do
      session = %SecretSession{current_ratchet_public_key: nil, message_count: 0}

      assert {:error, :invalid_ratchet_header} = RatchetState.verify_ratchet_advance(session, nil)
    end
  end

  describe "compute_safety_number/2" do
    test "produces a 60-digit string in groups of 5" do
      key1 = :crypto.strong_rand_bytes(32)
      key2 = :crypto.strong_rand_bytes(32)

      number = RatchetState.compute_safety_number(key1, key2)

      # Should be 12 groups of 5 digits, separated by spaces
      groups = String.split(number, " ")
      assert length(groups) == 12

      for group <- groups do
        assert String.length(group) == 5
        assert String.match?(group, ~r/^\d{5}$/)
      end
    end

    test "is deterministic for same keys" do
      key1 = :crypto.strong_rand_bytes(32)
      key2 = :crypto.strong_rand_bytes(32)

      n1 = RatchetState.compute_safety_number(key1, key2)
      n2 = RatchetState.compute_safety_number(key1, key2)

      assert n1 == n2
    end

    test "is order-independent (same result regardless of who initiates)" do
      key1 = :crypto.strong_rand_bytes(32)
      key2 = :crypto.strong_rand_bytes(32)

      n1 = RatchetState.compute_safety_number(key1, key2)
      n2 = RatchetState.compute_safety_number(key2, key1)

      assert n1 == n2
    end

    test "produces different numbers for different key pairs" do
      key1 = :crypto.strong_rand_bytes(32)
      key2 = :crypto.strong_rand_bytes(32)
      key3 = :crypto.strong_rand_bytes(32)

      n1 = RatchetState.compute_safety_number(key1, key2)
      n2 = RatchetState.compute_safety_number(key1, key3)

      assert n1 != n2
    end
  end

  describe "fingerprint/1" do
    test "returns a hex string" do
      key = :crypto.strong_rand_bytes(32)
      fp = RatchetState.fingerprint(key)

      assert String.match?(fp, ~r/^[0-9a-f]{16}$/)
    end

    test "is deterministic" do
      key = :crypto.strong_rand_bytes(32)

      assert RatchetState.fingerprint(key) == RatchetState.fingerprint(key)
    end

    test "different keys produce different fingerprints" do
      key1 = :crypto.strong_rand_bytes(32)
      key2 = :crypto.strong_rand_bytes(32)

      assert RatchetState.fingerprint(key1) != RatchetState.fingerprint(key2)
    end
  end
end
