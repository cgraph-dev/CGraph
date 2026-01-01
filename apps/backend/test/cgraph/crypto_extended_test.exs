defmodule Cgraph.CryptoExtendedTest do
  @moduledoc """
  Extended test suite for Cgraph.Crypto context.
  Tests encryption, hashing, and security utilities.
  """
  use ExUnit.Case, async: true

  alias Cgraph.Crypto

  # ============================================================================
  # Key Generation
  # ============================================================================

  describe "generate_key/1" do
    test "generates a 32-byte key by default" do
      key = Crypto.generate_key()
      
      assert byte_size(key) == 32
    end

    test "generates keys of specified length" do
      key = Crypto.generate_key(bytes: 16)
      
      assert byte_size(key) == 16
    end

    test "generates unique keys each time" do
      key1 = Crypto.generate_key()
      key2 = Crypto.generate_key()
      
      assert key1 != key2
    end
  end

  # ============================================================================
  # Encryption / Decryption
  # ============================================================================

  describe "encrypt/3 and decrypt/3" do
    test "encrypts and decrypts plaintext" do
      key = Crypto.generate_key()
      plaintext = "secret message"
      
      {:ok, encrypted} = Crypto.encrypt(plaintext, key)
      {:ok, decrypted} = Crypto.decrypt(encrypted, key)
      
      assert decrypted == plaintext
    end

    test "encrypted data is a map with ciphertext" do
      key = Crypto.generate_key()
      plaintext = "secret message"
      
      {:ok, encrypted} = Crypto.encrypt(plaintext, key)
      
      assert is_map(encrypted)
      assert Map.has_key?(encrypted, :ciphertext)
    end

    test "same plaintext encrypts differently each time" do
      key = Crypto.generate_key()
      plaintext = "secret message"
      
      {:ok, encrypted1} = Crypto.encrypt(plaintext, key)
      {:ok, encrypted2} = Crypto.encrypt(plaintext, key)
      
      # Different nonces should produce different ciphertext
      assert encrypted1.nonce != encrypted2.nonce
    end

    test "wrong key fails to decrypt" do
      key1 = Crypto.generate_key()
      key2 = Crypto.generate_key()
      plaintext = "secret message"
      
      {:ok, encrypted} = Crypto.encrypt(plaintext, key1)
      
      # Decrypting with wrong key should fail
      result = Crypto.decrypt(encrypted, key2)
      assert match?({:error, _}, result)
    end
  end

  describe "encrypt_compact/2 and decrypt_compact/2" do
    test "encrypts and decrypts in compact format" do
      key = Crypto.generate_key()
      plaintext = "compact secret"
      
      {:ok, encrypted} = Crypto.encrypt_compact(plaintext, key)
      {:ok, decrypted} = Crypto.decrypt_compact(encrypted, key)
      
      assert decrypted == plaintext
    end

    test "compact format is a string" do
      key = Crypto.generate_key()
      plaintext = "compact secret"
      
      {:ok, encrypted} = Crypto.encrypt_compact(plaintext, key)
      
      assert is_binary(encrypted)
    end
  end

  # ============================================================================
  # Hashing
  # ============================================================================

  describe "hash/2" do
    test "produces consistent hash for same input" do
      data = "test data"
      
      hash1 = Crypto.hash(data)
      hash2 = Crypto.hash(data)
      
      assert hash1 == hash2
    end

    test "different inputs produce different hashes" do
      hash1 = Crypto.hash("data1")
      hash2 = Crypto.hash("data2")
      
      assert hash1 != hash2
    end
  end

  describe "hmac/3" do
    test "produces consistent HMAC for same input and key" do
      data = "test data"
      key = "secret key"
      
      hmac1 = Crypto.hmac(data, key)
      hmac2 = Crypto.hmac(data, key)
      
      assert hmac1 == hmac2
    end

    test "different keys produce different HMACs" do
      data = "test data"
      
      hmac1 = Crypto.hmac(data, "key1")
      hmac2 = Crypto.hmac(data, "key2")
      
      assert hmac1 != hmac2
    end
  end

  # ============================================================================
  # Password Hashing
  # ============================================================================

  describe "hash_password/1 and verify_password/2" do
    test "hashes and verifies password" do
      password = "SuperSecret123!"
      
      hash = Crypto.hash_password(password)
      
      assert Crypto.verify_password(password, hash) == true
    end

    test "wrong password fails verification" do
      password = "SuperSecret123!"
      wrong_password = "WrongPassword456!"
      
      hash = Crypto.hash_password(password)
      
      assert Crypto.verify_password(wrong_password, hash) == false
    end

    test "same password hashes differently each time" do
      password = "SuperSecret123!"
      
      hash1 = Crypto.hash_password(password)
      hash2 = Crypto.hash_password(password)
      
      assert hash1 != hash2
    end
  end

  # ============================================================================
  # Token Generation
  # ============================================================================

  describe "generate_token/1" do
    test "generates token of default length" do
      token = Crypto.generate_token()
      
      assert is_binary(token)
    end

    test "generates tokens of specified length" do
      token = Crypto.generate_token(16)
      
      assert is_binary(token)
    end

    test "generates unique tokens" do
      token1 = Crypto.generate_token()
      token2 = Crypto.generate_token()
      
      assert token1 != token2
    end
  end

  describe "generate_otp/1" do
    test "generates 6-digit OTP by default" do
      otp = Crypto.generate_otp()
      
      assert String.length(otp) == 6
      assert String.match?(otp, ~r/^\d+$/)
    end

    test "generates OTP of specified length" do
      otp = Crypto.generate_otp(4)
      
      assert String.length(otp) == 4
      assert String.match?(otp, ~r/^\d+$/)
    end
  end

  # ============================================================================
  # Security Utilities
  # ============================================================================

  describe "secure_compare/2" do
    test "returns true for equal strings" do
      assert Crypto.secure_compare("abc", "abc") == true
    end

    test "returns false for different strings" do
      assert Crypto.secure_compare("abc", "xyz") == false
    end

    test "returns false for strings of different length" do
      assert Crypto.secure_compare("short", "longer string") == false
    end
  end

  describe "url_encode/1 and url_decode/1" do
    test "encodes and decodes data" do
      data = "test data to encode"
      
      encoded = Crypto.url_encode(data)
      {:ok, decoded} = Crypto.url_decode(encoded)
      
      assert decoded == data
    end

    test "encoded data is URL-safe" do
      data = <<0, 1, 2, 255, 254, 253>>  # Binary data
      
      encoded = Crypto.url_encode(data)
      
      assert is_binary(encoded)
    end
  end

  # ============================================================================
  # Envelope Encryption
  # ============================================================================

  describe "envelope_encrypt/2 and envelope_decrypt/2" do
    test "encrypts and decrypts with envelope encryption" do
      kek = Crypto.generate_key()
      plaintext = "sensitive data"
      
      {:ok, envelope} = Crypto.envelope_encrypt(plaintext, kek)
      {:ok, decrypted} = Crypto.envelope_decrypt(envelope, kek)
      
      assert decrypted == plaintext
    end

    test "envelope contains encrypted data" do
      kek = Crypto.generate_key()
      plaintext = "sensitive data"
      
      {:ok, envelope} = Crypto.envelope_encrypt(plaintext, kek)
      
      assert is_map(envelope)
    end
  end
end
