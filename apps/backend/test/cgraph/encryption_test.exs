defmodule CGraph.EncryptionTest do
  @moduledoc "Tests for AES-256-GCM encryption, hashing, and key management."
  use ExUnit.Case, async: true

  alias CGraph.Encryption

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Encryption)
    end

    test "exports encryption functions" do
      assert function_exported?(Encryption, :encrypt, 2)
      assert function_exported?(Encryption, :decrypt, 2)
      assert function_exported?(Encryption, :generate_key, 0)
      assert function_exported?(Encryption, :hash, 1)
      assert function_exported?(Encryption, :hmac, 2)
    end
  end

  describe "encrypt/2 and decrypt/2" do
    test "roundtrips plaintext" do
      key = Encryption.generate_key()
      plaintext = "sensitive data for CGraph"

      {:ok, ciphertext} = Encryption.encrypt(plaintext, key)
      assert ciphertext != plaintext
      {:ok, decrypted} = Encryption.decrypt(ciphertext, key)
      assert decrypted == plaintext
    end

    test "different keys produce different ciphertext" do
      key1 = Encryption.generate_key()
      key2 = Encryption.generate_key()
      plaintext = "test data"

      {:ok, ct1} = Encryption.encrypt(plaintext, key1)
      {:ok, ct2} = Encryption.encrypt(plaintext, key2)
      assert ct1 != ct2
    end
  end

  describe "generate_key/0" do
    test "generates a key" do
      key = Encryption.generate_key()
      assert is_binary(key)
      assert byte_size(key) >= 16
    end

    test "generates unique keys" do
      key1 = Encryption.generate_key()
      key2 = Encryption.generate_key()
      assert key1 != key2
    end
  end

  describe "hash/1" do
    test "produces consistent hash for same input" do
      input = "hello"
      h1 = Encryption.hash(input)
      h2 = Encryption.hash(input)
      assert h1 == h2
    end

    test "produces different hashes for different inputs" do
      h1 = Encryption.hash("hello")
      h2 = Encryption.hash("world")
      assert h1 != h2
    end
  end

  describe "hmac/2" do
    test "produces HMAC for given key and data" do
      result = Encryption.hmac("key", "data")
      assert is_binary(result)
    end
  end

  describe "secure_compare/2" do
    test "returns true for equal strings" do
      assert Encryption.secure_compare("abc", "abc")
    end

    test "returns false for different strings" do
      refute Encryption.secure_compare("abc", "xyz")
    end
  end
end
