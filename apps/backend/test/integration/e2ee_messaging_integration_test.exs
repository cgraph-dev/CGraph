defmodule Cgraph.Integration.E2EEMessagingIntegrationTest do
  @moduledoc """
  Integration tests for E2EE messaging flow.
  
  Tests the complete message lifecycle from key exchange through encrypted
  message delivery, ensuring all components work together correctly.
  """
  use Cgraph.DataCase, async: false
  
  alias Cgraph.Crypto.E2EE
  alias Cgraph.Messaging
  alias Cgraph.Messaging.VoiceMessage
  alias Cgraph.Accounts
  alias Cgraph.Storage
  
  @moduletag :integration

  # Helper functions
  defp create_user(attrs \\ %{}) do
    base = %{
      email: "user_#{System.unique_integer([:positive])}@example.com",
      username: "user_#{System.unique_integer([:positive])}",
      password: "SecureP@ssword123!"
    }
    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  defp create_conversation(user1, user2) do
    {:ok, conv, _} = Messaging.create_or_get_conversation(user1, [user2.id])
    conv
  end

  defp send_message(conv, user, attrs) do
    {:ok, msg} = Messaging.send_message(conv, user, attrs)
    msg
  end

  describe "full E2EE messaging flow" do
    setup do
      # Create two users with complete key bundles
      alice = create_user(%{email: "alice@example.com", username: "alice"})
      bob = create_user(%{email: "bob@example.com", username: "bob"})
      
      # Generate and register keys for both users
      {:ok, alice_bundle} = E2EE.generate_key_bundle("alice_phone")
      {:ok, bob_bundle} = E2EE.generate_key_bundle("bob_phone")
      
      alice_keys = format_keys_for_registration(alice_bundle)
      bob_keys = format_keys_for_registration(bob_bundle)
      
      {:ok, _} = E2EE.register_keys(alice.id, alice_keys)
      {:ok, _} = E2EE.register_keys(bob.id, bob_keys)
      
      {:ok, 
        alice: alice, 
        bob: bob, 
        alice_bundle: alice_bundle, 
        bob_bundle: bob_bundle
      }
    end
    
    test "complete key exchange and message encryption", %{alice: alice, bob: bob} do
      # Alice gets Bob's prekey bundle
      {:ok, bob_prekeys} = E2EE.get_prekey_bundle(bob.id)
      
      assert bob_prekeys.identity_key
      assert bob_prekeys.signed_prekey
      assert bob_prekeys.signed_prekey_signature
      assert bob_prekeys.one_time_prekey
      
      # Alice encrypts a message for Bob
      plaintext = "Hello Bob! This is a secret message."
      {:ok, encrypted} = E2EE.encrypt_for_user(bob.id, plaintext, [])
      
      assert encrypted.ciphertext
      assert encrypted.ephemeral_public_key
      
      # Verify the ciphertext doesn't contain plaintext
      refute String.contains?(encrypted.ciphertext, plaintext)
      
      # Create a conversation and send the encrypted message
      conversation = create_conversation(alice, bob)
      
      message = send_message(conversation, alice, %{
        "content" => encrypted.ciphertext,
        "encrypted" => true,
        "ephemeral_key" => encrypted.ephemeral_public_key
      })
      
      assert message.content == encrypted.ciphertext
    end
    
    test "one-time prekey consumption", %{alice: _alice, bob: bob, bob_bundle: _bob_bundle} do
      # Get initial prekey count
      initial_count = E2EE.one_time_prekey_count(bob.id)
      assert initial_count == 5  # We registered 5 one-time prekeys
      
      # Get prekey bundle (consumes a one-time prekey)
      {:ok, _bundle} = E2EE.get_prekey_bundle(bob.id)
      
      # Verify count decreased
      new_count = E2EE.one_time_prekey_count(bob.id)
      assert new_count == initial_count - 1
    end
    
    test "safety number generation is consistent", %{alice: alice, bob: bob} do
      # Generate safety number from Alice's perspective
      {:ok, _alice_bundle} = E2EE.get_prekey_bundle(alice.id)
      {:ok, _bob_bundle} = E2EE.get_prekey_bundle(bob.id)
      
      # safety_number/2 takes two user IDs
      safety_number_1 = E2EE.safety_number(alice.id, bob.id)
      
      # Generate safety number from Bob's perspective (should be the same)
      safety_number_2 = E2EE.safety_number(bob.id, alice.id)
      
      assert safety_number_1 == safety_number_2
    end
    
    test "key verification and revocation flow", %{alice: alice, bob: bob} do
      # Alice verifies Bob's key
      {:ok, bob_bundle} = E2EE.get_prekey_bundle(bob.id)
      
      # Mark as verified - using verify_identity_key/2
      {:ok, _} = E2EE.verify_identity_key(bob.id, bob_bundle.identity_key_id)
      
      # Revoke and verify status changes - using revoke_identity_key/2
      {:ok, _} = E2EE.revoke_identity_key(bob.id, bob_bundle.identity_key_id)
      
      # Getting bundle should now return error
      assert {:error, _} = E2EE.get_prekey_bundle(bob.id)
    end
    
    test "multi-device key management", %{alice: alice} do
      # Register keys for a second device
      {:ok, bundle2} = E2EE.generate_key_bundle("alice_tablet")
      keys2 = format_keys_for_registration(bundle2)
      
      {:ok, _} = E2EE.register_keys(alice.id, keys2)
      
      # Verify keys are registered by getting prekey bundle
      {:ok, bundle} = E2EE.get_prekey_bundle(alice.id)
      
      # Should have a valid bundle
      assert bundle.identity_key
      assert bundle.signed_prekey
    end
  end
  
  describe "E2EE with voice messages" do
    setup do
      alice = create_user(%{email: "alice_voice@example.com", username: "alice_voice"})
      bob = create_user(%{email: "bob_voice@example.com", username: "bob_voice"})
      
      # Register E2EE keys
      {:ok, alice_bundle} = E2EE.generate_key_bundle("alice_phone")
      {:ok, bob_bundle} = E2EE.generate_key_bundle("bob_phone")
      
      {:ok, _} = E2EE.register_keys(alice.id, format_keys_for_registration(alice_bundle))
      {:ok, _} = E2EE.register_keys(bob.id, format_keys_for_registration(bob_bundle))
      
      {:ok, alice: alice, bob: bob}
    end
    
    test "encrypted voice message metadata with E2EE", %{alice: alice, bob: bob} do
      # Create conversation
      conversation = create_conversation(alice, bob)
      
      # Create voice message record
      {:ok, voice_message} = VoiceMessage.create(%{
        filename: "voice_#{System.unique_integer([:positive])}.opus",
        content_type: "audio/ogg",
        size: 50_000,
        duration: 15.5,
        url: "https://storage.example.com/voice/abc123.opus",
        waveform: Enum.map(1..100, fn _ -> :rand.uniform() end),
        user_id: alice.id
      })
      
      # Encrypt voice message metadata for Bob
      metadata = Jason.encode!(%{
        voice_message_id: voice_message.id,
        duration: voice_message.duration,
        waveform: voice_message.waveform
      })
      
      {:ok, encrypted} = E2EE.encrypt_for_user(bob.id, metadata, [])
      
      # Send as message with voice attachment reference
      message = send_message(conversation, alice, %{
        "content" => encrypted.ciphertext,
        "encrypted" => true,
        "message_type" => "voice",
        "voice_message_id" => voice_message.id,
        "ephemeral_key" => encrypted.ephemeral_public_key
      })
      
      assert message.id
      assert message.content == encrypted.ciphertext
    end
  end
  
  describe "E2EE with storage integration" do
    setup do
      user = create_user(%{email: "alice@example.com", username: "alice"})
      {:ok, bundle} = E2EE.generate_key_bundle("phone")
      {:ok, _} = E2EE.register_keys(user.id, format_keys_for_registration(bundle))
      
      {:ok, user: user, bundle: bundle}
    end
    
    test "E2EE file attachment metadata flow", %{user: user} do
      # Create a test file
      content = :crypto.strong_rand_bytes(1000)
      path = Path.join(System.tmp_dir!(), "test_attachment_#{System.unique_integer([:positive])}.bin")
      File.write!(path, content)
      
      on_exit(fn -> File.rm(path) end)
      
      # Store the file
      upload = %{path: path, filename: "secret_doc.bin", content_type: "application/octet-stream"}
      {:ok, storage_result} = Storage.store(upload, user.id, "attachments")
      
      # Create encrypted metadata
      file_metadata = %{
        key: storage_result.key,
        size: storage_result.size,
        content_type: "application/octet-stream",
        encryption_key: Base.encode64(:crypto.strong_rand_bytes(32)),  # File encryption key
        iv: Base.encode64(:crypto.strong_rand_bytes(12))  # AES-GCM IV
      }
      
      # In real implementation, this metadata would be encrypted for recipient
      assert file_metadata.key
      assert file_metadata.encryption_key
    end
  end
  
  describe "concurrent E2EE operations" do
    test "handles multiple simultaneous key registrations" do
      users = for i <- 1..10 do
        create_user(%{email: "user#{i}@example.com", username: "user#{i}"})
      end
      
      # Register keys concurrently
      tasks = Enum.map(users, fn user ->
        Task.async(fn ->
          {:ok, bundle} = E2EE.generate_key_bundle("device_#{user.id}")
          E2EE.register_keys(user.id, format_keys_for_registration(bundle))
        end)
      end)
      
      results = Task.await_many(tasks, 30_000)
      
      # All registrations should succeed
      assert Enum.all?(results, fn {:ok, _} -> true; _ -> false end)
    end
    
    test "handles concurrent prekey bundle requests" do
      user = create_user()
      {:ok, bundle} = E2EE.generate_key_bundle("device")
      {:ok, _} = E2EE.register_keys(user.id, format_keys_for_registration(bundle))
      
      # Request prekey bundles concurrently
      tasks = for _ <- 1..5 do
        Task.async(fn ->
          E2EE.get_prekey_bundle(user.id)
        end)
      end
      
      results = Task.await_many(tasks, 10_000)
      
      # All should succeed (though one-time prekeys may run out)
      successful = Enum.count(results, fn {:ok, _} -> true; _ -> false end)
      assert successful >= 1
    end
  end
  
  # Helper functions
  
  defp format_keys_for_registration(bundle) do
    %{
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
  end
end
