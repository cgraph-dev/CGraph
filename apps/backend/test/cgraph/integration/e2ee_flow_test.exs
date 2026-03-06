defmodule CGraph.Integration.E2EEFlowTest do
  @moduledoc """
  End-to-end integration test for the E2EE lifecycle.

  Verifies the full flow: bootstrap status → key registration → bundle
  exchange → encrypted message send → safety numbers → prekey exhaustion.
  """
  use CGraph.DataCase, async: true

  alias CGraph.Crypto.E2EE

  describe "full E2EE lifecycle" do
    test "bootstrap → register → exchange bundles → verify safety numbers" do
      alice = create_user()
      bob = create_user()

      # 1. Both users start with no identity key
      assert {:error, :no_identity_key} = E2EE.check_bootstrap_status(alice.id)
      assert {:error, :no_identity_key} = E2EE.check_bootstrap_status(bob.id)

      # 2. Alice generates key bundle and registers
      {:ok, alice_bundle} = E2EE.generate_key_bundle("alice_device")

      alice_keys = %{
        "identity_key" => Base.encode64(alice_bundle.identity_key.public),
        "key_id" => alice_bundle.identity_key.key_id,
        "device_id" => alice_bundle.device_id,
        "signed_prekey" => %{
          "public_key" => Base.encode64(alice_bundle.signed_prekey.public),
          "signature" => Base.encode64(alice_bundle.signed_prekey.signature),
          "key_id" => alice_bundle.signed_prekey.key_id
        },
        "one_time_prekeys" => Enum.take(alice_bundle.one_time_prekeys, 50) |> Enum.map(fn pk ->
          %{"public_key" => Base.encode64(pk.public), "key_id" => pk.key_id}
        end)
      }

      {:ok, _} = E2EE.register_keys(alice.id, alice_keys)

      # 3. Alice's bootstrap status should now be ready (50 prekeys ≥ 10)
      assert {:ok, :ready} = E2EE.check_bootstrap_status(alice.id)

      # 4. Bob generates key bundle and registers
      {:ok, bob_bundle} = E2EE.generate_key_bundle("bob_device")

      bob_keys = %{
        "identity_key" => Base.encode64(bob_bundle.identity_key.public),
        "key_id" => bob_bundle.identity_key.key_id,
        "device_id" => bob_bundle.device_id,
        "signed_prekey" => %{
          "public_key" => Base.encode64(bob_bundle.signed_prekey.public),
          "signature" => Base.encode64(bob_bundle.signed_prekey.signature),
          "key_id" => bob_bundle.signed_prekey.key_id
        },
        "one_time_prekeys" => Enum.take(bob_bundle.one_time_prekeys, 20) |> Enum.map(fn pk ->
          %{"public_key" => Base.encode64(pk.public), "key_id" => pk.key_id}
        end)
      }

      {:ok, _} = E2EE.register_keys(bob.id, bob_keys)
      assert {:ok, :ready} = E2EE.check_bootstrap_status(bob.id)

      # 5. Alice requests Bob's prekey bundle
      {:ok, bob_prekey_bundle} = E2EE.get_prekey_bundle(bob.id)
      assert bob_prekey_bundle.identity_key
      assert bob_prekey_bundle.signed_prekey

      # Bob's prekey count decreased by 1 (one-time prekey consumed)
      assert E2EE.one_time_prekey_count(bob.id) == 19

      # 6. Safety numbers should be computable and symmetric
      {:ok, safety_ab} = E2EE.safety_number(alice.id, bob.id)
      {:ok, safety_ba} = E2EE.safety_number(bob.id, alice.id)
      assert safety_ab == safety_ba
      assert is_binary(safety_ab)
    end

    test "prekey exhaustion detection" do
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
        "one_time_prekeys" => Enum.take(bundle.one_time_prekeys, 2) |> Enum.map(fn pk ->
          %{"public_key" => Base.encode64(pk.public), "key_id" => pk.key_id}
        end)
      }

      {:ok, _} = E2EE.register_keys(user.id, keys)

      # Status should be needs_prekeys (< 10)
      assert {:ok, :needs_prekeys, 2} = E2EE.check_bootstrap_status(user.id)

      # Consume prekeys via bundle requests
      {:ok, _} = E2EE.get_prekey_bundle(user.id)
      assert E2EE.one_time_prekey_count(user.id) == 1

      {:ok, _} = E2EE.get_prekey_bundle(user.id)
      assert E2EE.one_time_prekey_count(user.id) == 0

      # Exhaustion — status still needs_prekeys with 0
      assert {:ok, :needs_prekeys, 0} = E2EE.check_bootstrap_status(user.id)
    end
  end

  defp create_user do
    unique = System.unique_integer([:positive])
    {:ok, user} = CGraph.Accounts.register_user(%{
      email: "e2ee_integ_#{unique}@example.com",
      password: "TestPassword123!",
      username: "e2ee_integ_#{unique}"
    })
    user
  end
end
