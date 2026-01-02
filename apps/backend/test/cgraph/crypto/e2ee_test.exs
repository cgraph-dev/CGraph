defmodule Cgraph.Crypto.E2EETest do
  use Cgraph.DataCase, async: true
  
  alias Cgraph.Crypto.E2EE
  alias Cgraph.Accounts
  
  describe "generate_key_bundle/1" do
    test "generates complete key bundle with identity, signed prekey, and one-time prekeys" do
      device_id = "device_#{System.unique_integer([:positive])}"
      
      {:ok, bundle} = E2EE.generate_key_bundle(device_id)
      
      # Verify all components exist
      assert bundle.device_id == device_id
      
      # Identity key (Ed25519)
      assert bundle.identity_key.public
      assert bundle.identity_key.private
      assert bundle.identity_key.key_id
      assert byte_size(bundle.identity_key.public) == 32
      
      # Signed prekey (X25519)
      assert bundle.signed_prekey.public
      assert bundle.signed_prekey.private
      assert bundle.signed_prekey.signature
      assert bundle.signed_prekey.key_id
      assert byte_size(bundle.signed_prekey.public) == 32
      assert byte_size(bundle.signed_prekey.signature) == 64
      
      # One-time prekeys
      assert length(bundle.one_time_prekeys) == 100
      Enum.each(bundle.one_time_prekeys, fn prekey ->
        assert prekey.public
        assert prekey.private
        assert prekey.key_id
        assert byte_size(prekey.public) == 32
      end)
    end
    
    test "generates unique key bundles each time" do
      device_id1 = "device_#{System.unique_integer([:positive])}"
      device_id2 = "device_#{System.unique_integer([:positive])}"
      
      {:ok, bundle1} = E2EE.generate_key_bundle(device_id1)
      {:ok, bundle2} = E2EE.generate_key_bundle(device_id2)
      
      refute bundle1.identity_key.public == bundle2.identity_key.public
      refute bundle1.signed_prekey.public == bundle2.signed_prekey.public
    end
  end
  
  describe "fingerprint/1" do
    test "generates consistent fingerprint for same key" do
      {:ok, bundle} = E2EE.generate_key_bundle("test_device")
      
      fp1 = E2EE.fingerprint(bundle.identity_key.public)
      fp2 = E2EE.fingerprint(bundle.identity_key.public)
      
      assert fp1 == fp2
      assert String.length(fp1) == 64  # SHA256 hex
    end
    
    test "generates different fingerprints for different keys" do
      {:ok, bundle1} = E2EE.generate_key_bundle("device1")
      {:ok, bundle2} = E2EE.generate_key_bundle("device2")
      
      fp1 = E2EE.fingerprint(bundle1.identity_key.public)
      fp2 = E2EE.fingerprint(bundle2.identity_key.public)
      
      refute fp1 == fp2
    end
  end
  
  describe "register_keys/2 and get_prekey_bundle/1" do
    test "registers and retrieves key bundle for user" do
      user = create_user()
      {:ok, bundle} = E2EE.generate_key_bundle("test_device")
      
      keys = %{
        "identity_key" => Base.encode64(bundle.identity_key.public),
        "key_id" => bundle.identity_key.key_id,
        "device_id" => bundle.device_id,
        "signed_prekey" => %{
          "public_key" => Base.encode64(bundle.signed_prekey.public),
          "signature" => Base.encode64(bundle.signed_prekey.signature),
          "key_id" => bundle.signed_prekey.key_id
        },
        "one_time_prekeys" => Enum.take(bundle.one_time_prekeys, 5) |> Enum.map(fn pk ->
          %{"public_key" => Base.encode64(pk.public), "key_id" => pk.key_id}
        end)
      }
      
      {:ok, result} = E2EE.register_keys(user.id, keys)
      
      assert result.identity_key_id
    end
    
    test "returns error for non-existent user prekeys" do
      result = E2EE.get_prekey_bundle(Ecto.UUID.generate())
      assert {:error, _reason} = result
    end
  end
  
  describe "one_time_prekey_count/1" do
    test "returns zero for user with no prekeys" do
      user = create_user()
      assert E2EE.one_time_prekey_count(user.id) == 0
    end
    
    test "returns correct count after registration" do
      user = create_user()
      {:ok, bundle} = E2EE.generate_key_bundle("test_device")
      
      keys = %{
        "identity_key" => Base.encode64(bundle.identity_key.public),
        "key_id" => bundle.identity_key.key_id,
        "device_id" => bundle.device_id,
        "one_time_prekeys" => Enum.take(bundle.one_time_prekeys, 5) |> Enum.map(fn pk ->
          %{"public_key" => Base.encode64(pk.public), "key_id" => pk.key_id}
        end)
      }
      
      {:ok, _} = E2EE.register_keys(user.id, keys)
      
      assert E2EE.one_time_prekey_count(user.id) == 5
    end
  end
  
  describe "upload_one_time_prekeys/2" do
    test "handles empty prekey list" do
      user = create_user()
      {:ok, count} = E2EE.upload_one_time_prekeys(user.id, [])
      assert count == 0
    end
    
    test "uploads valid prekeys" do
      user = create_user()
      {:ok, bundle} = E2EE.generate_key_bundle("test_device")
      
      # First register identity key
      keys = %{
        "identity_key" => Base.encode64(bundle.identity_key.public),
        "key_id" => bundle.identity_key.key_id,
        "device_id" => bundle.device_id
      }
      {:ok, _} = E2EE.register_keys(user.id, keys)
      
      # Now upload one-time prekeys
      prekeys = Enum.take(bundle.one_time_prekeys, 10) |> Enum.map(fn pk ->
        {pk.key_id, Base.encode64(pk.public)}
      end)
      
      {:ok, count} = E2EE.upload_one_time_prekeys(user.id, prekeys)
      assert count == 10
    end
    
    test "rejects invalid prekeys" do
      user = create_user()
      invalid_prekeys = [{1, "not_valid_base64!!!"}]
      
      assert {:error, :invalid_prekeys} = E2EE.upload_one_time_prekeys(user.id, invalid_prekeys)
    end
  end
  
  describe "encrypt_for_user/3" do
    test "encrypts message for user with registered keys" do
      _alice = create_user()
      bob = create_user()
      
      # Register Bob's keys
      {:ok, bob_bundle} = E2EE.generate_key_bundle("bob_phone")
      bob_keys = %{
        "identity_key" => Base.encode64(bob_bundle.identity_key.public),
        "key_id" => bob_bundle.identity_key.key_id,
        "device_id" => bob_bundle.device_id,
        "signed_prekey" => %{
          "public_key" => Base.encode64(bob_bundle.signed_prekey.public),
          "signature" => Base.encode64(bob_bundle.signed_prekey.signature),
          "key_id" => bob_bundle.signed_prekey.key_id
        },
        "one_time_prekeys" => Enum.take(bob_bundle.one_time_prekeys, 5) |> Enum.map(fn pk ->
          %{"public_key" => Base.encode64(pk.public), "key_id" => pk.key_id}
        end)
      }
      {:ok, _} = E2EE.register_keys(bob.id, bob_keys)
      
      # Alice encrypts for Bob
      plaintext = "Hello, Bob! This is a secret message."
      {:ok, encrypted} = E2EE.encrypt_for_user(bob.id, plaintext, [])
      
      assert encrypted.ciphertext
      assert encrypted.ephemeral_public_key
      assert encrypted.recipient_identity_key_id
      
      # Ciphertext should not contain plaintext
      refute String.contains?(encrypted.ciphertext, plaintext)
    end
    
    test "fails for user without registered keys" do
      non_existent_user_id = Ecto.UUID.generate()
      
      result = E2EE.encrypt_for_user(
        non_existent_user_id, 
        "secret message",
        []
      )
      
      assert {:error, _reason} = result
    end
  end
  
  describe "safety_number/2" do
    test "generates safety number for two users with keys" do
      alice = create_user()
      bob = create_user()
      
      # Register keys for both users
      {:ok, alice_bundle} = E2EE.generate_key_bundle("alice_phone")
      {:ok, bob_bundle} = E2EE.generate_key_bundle("bob_phone")
      
      alice_keys = %{
        "identity_key" => Base.encode64(alice_bundle.identity_key.public),
        "key_id" => alice_bundle.identity_key.key_id,
        "device_id" => alice_bundle.device_id
      }
      
      bob_keys = %{
        "identity_key" => Base.encode64(bob_bundle.identity_key.public),
        "key_id" => bob_bundle.identity_key.key_id,
        "device_id" => bob_bundle.device_id
      }
      
      {:ok, _} = E2EE.register_keys(alice.id, alice_keys)
      {:ok, _} = E2EE.register_keys(bob.id, bob_keys)
      
      {:ok, safety_number} = E2EE.safety_number(alice.id, bob.id)
      
      assert is_binary(safety_number)
      assert String.length(safety_number) > 0
    end
    
    test "returns error when user has no keys" do
      alice = create_user()
      bob = create_user()
      
      # Only register Alice's keys
      {:ok, alice_bundle} = E2EE.generate_key_bundle("alice_phone")
      alice_keys = %{
        "identity_key" => Base.encode64(alice_bundle.identity_key.public),
        "key_id" => alice_bundle.identity_key.key_id,
        "device_id" => alice_bundle.device_id
      }
      {:ok, _} = E2EE.register_keys(alice.id, alice_keys)
      
      # Should fail since Bob has no keys
      assert {:error, _} = E2EE.safety_number(alice.id, bob.id)
    end
  end
  
  # Helper functions
  
  defp create_user do
    unique = System.unique_integer([:positive])
    {:ok, user} = Accounts.register_user(%{
      email: "e2ee_test_#{unique}@example.com",
      password: "TestPassword123!",
      username: "e2ee_user_#{unique}"
    })
    user
  end
end
