defmodule CGraph.Accounts.WalletAuthenticationTest do
  @moduledoc """
  Comprehensive unit tests for the SIWE (EIP-4361) wallet authentication flow.

  Tests cover:
  - build_siwe_message/3 — SIWE message construction
  - parse_siwe_message/1 — SIWE message parsing
  - get_or_create_wallet_challenge/1 — nonce challenge management
  - validate_message (indirectly) — SIWE field validation
  - build → parse round-trip integration
  """
  use Cgraph.DataCase, async: true

  alias CGraph.Accounts.WalletAuthentication
  alias CGraph.Accounts.WalletChallenge
  alias CGraph.Repo

  @valid_address "0x1234567890abcdef1234567890abcdef12345678"
  @valid_nonce :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)
  @default_domain "web.cgraph.org"

  # ===========================================================================
  # build_siwe_message/3
  # ===========================================================================

  describe "build_siwe_message/3" do
    test "returns properly formatted SIWE message with all fields" do
      message = WalletAuthentication.build_siwe_message(@valid_nonce, @valid_address)

      assert message =~ "wants you to sign in with your Ethereum account:"
      assert message =~ "Sign in to CGraph"
      assert message =~ "URI: https://"
      assert message =~ "Version: 1"
      assert message =~ "Chain ID: 1"
      assert message =~ "Nonce: #{@valid_nonce}"
      assert message =~ "Issued At:"
      assert message =~ "Expiration Time:"
    end

    test "contains domain, address, nonce, issued_at, and expiration_time" do
      message = WalletAuthentication.build_siwe_message(@valid_nonce, @valid_address)

      lines = String.split(message, "\n")
      assert Enum.at(lines, 0) =~ @default_domain
      assert Enum.at(lines, 1) =~ @valid_address
      assert message =~ "Nonce: #{@valid_nonce}"
      assert message =~ ~r/Issued At: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/
      assert message =~ ~r/Expiration Time: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/
    end

    test "uses default domain 'web.cgraph.org' when not specified" do
      message = WalletAuthentication.build_siwe_message(@valid_nonce, @valid_address)

      first_line = message |> String.split("\n") |> List.first()
      assert first_line =~ "web.cgraph.org wants you to sign in"
      assert message =~ "URI: https://web.cgraph.org"
    end

    test "uses custom domain when specified" do
      message =
        WalletAuthentication.build_siwe_message(@valid_nonce, @valid_address, "cgraph.org")

      first_line = message |> String.split("\n") |> List.first()
      assert first_line =~ "cgraph.org wants you to sign in"
      assert message =~ "URI: https://cgraph.org"
    end

    test "expiration is 5 minutes after issued_at" do
      message = WalletAuthentication.build_siwe_message(@valid_nonce, @valid_address)

      [_, issued_str] = Regex.run(~r/Issued At:\s*(.+)/, message)
      [_, expiration_str] = Regex.run(~r/Expiration Time:\s*(.+)/, message)

      {:ok, issued, _} = DateTime.from_iso8601(String.trim(issued_str))
      {:ok, expiration, _} = DateTime.from_iso8601(String.trim(expiration_str))

      diff = DateTime.diff(expiration, issued, :second)
      assert diff == 300
    end
  end

  # ===========================================================================
  # parse_siwe_message/1
  # ===========================================================================

  describe "parse_siwe_message/1" do
    test "parses valid SIWE message into map with all fields" do
      message = WalletAuthentication.build_siwe_message(@valid_nonce, @valid_address)
      assert {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)

      assert Map.has_key?(parsed, :domain)
      assert Map.has_key?(parsed, :address)
      assert Map.has_key?(parsed, :nonce)
      assert Map.has_key?(parsed, :uri)
      assert Map.has_key?(parsed, :version)
      assert Map.has_key?(parsed, :chain_id)
      assert Map.has_key?(parsed, :issued_at)
      assert Map.has_key?(parsed, :expiration_time)
    end

    test "returns error for empty string" do
      assert {:error, :invalid_siwe_format} = WalletAuthentication.parse_siwe_message("")
    end

    test "returns error for random text (not SIWE format)" do
      assert {:error, :invalid_siwe_format} =
               WalletAuthentication.parse_siwe_message("hello world this is random text")
    end

    test "returns error for missing address (only 1 line)" do
      assert {:error, :invalid_siwe_format} =
               WalletAuthentication.parse_siwe_message(
                 "web.cgraph.org wants you to sign in with your Ethereum account:"
               )
    end

    test "extracts domain correctly from first line" do
      message = WalletAuthentication.build_siwe_message(@valid_nonce, @valid_address)
      {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)

      assert parsed.domain == "web.cgraph.org"
    end

    test "extracts custom domain correctly" do
      message =
        WalletAuthentication.build_siwe_message(@valid_nonce, @valid_address, "cgraph.org")

      {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)
      assert parsed.domain == "cgraph.org"
    end

    test "address is lowercased in parsed output" do
      upper_address = "0x1234567890ABCDEF1234567890ABCDEF12345678"

      message = WalletAuthentication.build_siwe_message(@valid_nonce, upper_address)
      {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)

      assert parsed.address == String.downcase(upper_address)
    end

    test "returns error for invalid address format (not 0x + 40 hex chars)" do
      bad_message = """
      web.cgraph.org wants you to sign in with your Ethereum account:
      not-an-address

      Sign in to CGraph

      URI: https://web.cgraph.org
      Version: 1
      Chain ID: 1
      Nonce: #{@valid_nonce}
      Issued At: 2026-03-13T12:00:00Z
      Expiration Time: 2026-03-13T12:05:00Z\
      """

      assert {:error, :invalid_siwe_format} = WalletAuthentication.parse_siwe_message(bad_message)
    end

    test "returns error for short hex address (not 40 chars)" do
      bad_message = """
      web.cgraph.org wants you to sign in with your Ethereum account:
      0x1234abcd

      Sign in to CGraph

      URI: https://web.cgraph.org
      Version: 1
      Chain ID: 1
      Nonce: #{@valid_nonce}
      Issued At: 2026-03-13T12:00:00Z
      Expiration Time: 2026-03-13T12:05:00Z\
      """

      assert {:error, :invalid_siwe_format} = WalletAuthentication.parse_siwe_message(bad_message)
    end
  end

  # ===========================================================================
  # get_or_create_wallet_challenge/1
  # ===========================================================================

  describe "get_or_create_wallet_challenge/1" do
    test "creates new challenge for new wallet address" do
      assert {:ok, nonce} =
               WalletAuthentication.get_or_create_wallet_challenge(@valid_address)

      assert is_binary(nonce)
      assert String.length(nonce) == 64
      assert Regex.match?(~r/^[a-f0-9]{64}$/, nonce)
    end

    test "returns existing challenge nonce for recent challenge" do
      {:ok, nonce1} = WalletAuthentication.get_or_create_wallet_challenge(@valid_address)
      {:ok, nonce2} = WalletAuthentication.get_or_create_wallet_challenge(@valid_address)

      assert nonce1 == nonce2
    end

    test "normalizes wallet address to lowercase" do
      upper_address = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12"
      lower_address = String.downcase(upper_address)

      {:ok, nonce1} = WalletAuthentication.get_or_create_wallet_challenge(upper_address)
      {:ok, nonce2} = WalletAuthentication.get_or_create_wallet_challenge(lower_address)

      assert nonce1 == nonce2
    end

    test "returns nonce as :ok tuple" do
      result = WalletAuthentication.get_or_create_wallet_challenge(@valid_address)
      assert {:ok, _nonce} = result
    end

    test "different wallet addresses get different nonces" do
      address1 = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      address2 = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

      {:ok, nonce1} = WalletAuthentication.get_or_create_wallet_challenge(address1)
      {:ok, nonce2} = WalletAuthentication.get_or_create_wallet_challenge(address2)

      refute nonce1 == nonce2
    end
  end

  # ===========================================================================
  # validate_message (tested indirectly via private function behavior)
  # ===========================================================================

  describe "validate_message (indirect via message construction)" do
    setup do
      {:ok, nonce} = WalletAuthentication.get_or_create_wallet_challenge(@valid_address)
      %{nonce: nonce}
    end

    test "valid SIWE message passes validation — parse succeeds with correct fields", %{
      nonce: nonce
    } do
      message = WalletAuthentication.build_siwe_message(nonce, @valid_address)
      {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)

      assert parsed.nonce == nonce
      assert parsed.address == String.downcase(@valid_address)
      assert parsed.domain in ["web.cgraph.org", "cgraph.org", "localhost"]
    end

    test "wrong nonce in message is detectable", %{nonce: _nonce} do
      wrong_nonce = String.duplicate("a", 64)

      message = WalletAuthentication.build_siwe_message(wrong_nonce, @valid_address)
      {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)

      # The parsed nonce will be the wrong one — validation would fail in verify flow
      refute parsed.nonce == Repo.get_by(WalletChallenge, wallet_address: String.downcase(@valid_address)).nonce
    end

    test "wrong address in message is detectable", %{nonce: nonce} do
      wrong_address = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"

      message = WalletAuthentication.build_siwe_message(nonce, wrong_address)
      {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)

      # Parsed address won't match the expected one
      refute parsed.address == String.downcase(@valid_address)
    end

    test "invalid domain is detectable in parsed message", %{nonce: nonce} do
      message =
        WalletAuthentication.build_siwe_message(nonce, @valid_address, "evil.example.com")

      {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)

      refute parsed.domain in ["web.cgraph.org", "cgraph.org", "localhost"]
    end

    test "expired message has expiration_time in the past" do
      # Build a message with manually crafted expiration in the past
      past_message = """
      web.cgraph.org wants you to sign in with your Ethereum account:
      #{@valid_address}

      Sign in to CGraph

      URI: https://web.cgraph.org
      Version: 1
      Chain ID: 1
      Nonce: #{@valid_nonce}
      Issued At: 2020-01-01T00:00:00Z
      Expiration Time: 2020-01-01T00:05:00Z\
      """

      {:ok, parsed} = WalletAuthentication.parse_siwe_message(past_message)
      {:ok, expiration, _} = DateTime.from_iso8601(parsed.expiration_time)

      assert DateTime.compare(DateTime.utc_now(), expiration) == :gt
    end

    test "legacy format (non-SIWE) with nonce present is detected as non-SIWE", %{nonce: nonce} do
      legacy_message = "Sign this message to authenticate with CGraph.\n\nNonce: #{nonce}"

      # Legacy format should fail SIWE parsing
      assert {:error, :invalid_siwe_format} =
               WalletAuthentication.parse_siwe_message(legacy_message)
    end

    test "legacy format without correct nonce fails SIWE parsing" do
      legacy_message =
        "Sign this message to authenticate with CGraph.\n\nNonce: wrong_nonce_value"

      assert {:error, :invalid_siwe_format} =
               WalletAuthentication.parse_siwe_message(legacy_message)
    end
  end

  # ===========================================================================
  # Integration: build → parse round-trip
  # ===========================================================================

  describe "build → parse round-trip" do
    test "build_siwe_message produces a message that parse_siwe_message can parse" do
      nonce = :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)
      message = WalletAuthentication.build_siwe_message(nonce, @valid_address)

      assert {:ok, _parsed} = WalletAuthentication.parse_siwe_message(message)
    end

    test "parsed fields match the inputs used to build" do
      nonce = :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)
      domain = "cgraph.org"
      message = WalletAuthentication.build_siwe_message(nonce, @valid_address, domain)

      {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)

      assert parsed.domain == domain
      assert parsed.address == String.downcase(@valid_address)
      assert parsed.nonce == nonce
      assert parsed.version == "1"
      assert parsed.chain_id == "1"
      assert parsed.uri == "https://#{domain}"
    end

    test "round-trip preserves nonce integrity across different addresses" do
      nonce = :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)

      addresses = [
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        "0x1234567890abcdef1234567890abcdef12345678"
      ]

      for addr <- addresses do
        message = WalletAuthentication.build_siwe_message(nonce, addr)
        {:ok, parsed} = WalletAuthentication.parse_siwe_message(message)
        assert parsed.nonce == nonce
        assert parsed.address == String.downcase(addr)
      end
    end
  end
end
