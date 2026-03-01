defmodule CGraph.Integration.Phase9VerificationTest do
  @moduledoc """
  Phase 9 (Notifications & Safety) account deletion polish verification tests.

  Verifies:
  1. Notification preferences are deleted on hard delete
  2. Push tokens are cleaned up on hard delete
  3. Hard delete removes all PII after grace period
  4. Cancellation within grace period restores account (hard delete skips)
  5. Data export includes notification preferences section
  """
  use CGraph.DataCase, async: false

  import Ecto.Query

  alias CGraph.Accounts
  alias CGraph.Accounts.{PushToken, User}
  alias CGraph.Notifications.{NotificationPreference, Preferences}
  alias CGraph.Workers.HardDeleteUser

  @moduletag :phase9

  # ── Helpers ──────────────────────────────────────────────

  defp create_test_user(attrs \\ %{}) do
    base = %{
      email: "phase9_#{System.unique_integer([:positive])}@example.com",
      username: "phase9_#{System.unique_integer([:positive])}",
      password: "SecureP@ssword123!"
    }

    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  defp soft_delete_user(user) do
    user
    |> Ecto.Changeset.change(%{
      deleted_at: DateTime.truncate(DateTime.utc_now(), :second),
      is_active: false
    })
    |> Repo.update!()
  end

  defp register_push_token(user) do
    token_attrs = %{
      "token" => "ExponentPushToken[test_#{System.unique_integer([:positive])}]",
      "platform" => "expo",
      "device_id" => "device_#{System.unique_integer([:positive])}"
    }

    {:ok, token} = CGraph.Notifications.PushTokens.register_push_token(user, token_attrs)
    token
  end

  defp run_hard_delete(user_id) do
    HardDeleteUser.perform(%Oban.Job{args: %{"user_id" => user_id}})
  end

  # ── Test 1: Notification preferences cascade on hard delete ──

  describe "HV-1: notification preferences cascade on hard delete" do
    test "hard delete removes all notification preferences for the user" do
      user = create_test_user()

      # Create multiple notification preferences
      {:ok, _} =
        Preferences.set_preference(user.id, "conversation", Ecto.UUID.generate(), %{
          "mode" => "none"
        })

      {:ok, _} =
        Preferences.set_preference(user.id, "channel", Ecto.UUID.generate(), %{
          "mode" => "mentions_only"
        })

      {:ok, _} =
        Preferences.set_preference(user.id, "group", Ecto.UUID.generate(), %{
          "mode" => "none",
          "muted_until" => DateTime.add(DateTime.utc_now(), 3600, :second)
        })

      # Verify preferences exist
      assert length(Preferences.list_all(user.id)) == 3

      # Soft delete → hard delete
      soft_delete_user(user)
      assert :ok = run_hard_delete(user.id)

      # Verify all preferences are gone
      assert Preferences.list_all(user.id) == []

      remaining =
        from(np in NotificationPreference, where: np.user_id == ^user.id) |> Repo.all()

      assert remaining == []
    end
  end

  # ── Test 2: Push token cleanup on hard delete ────────────

  describe "HV-2: push token cleanup on hard delete" do
    test "hard delete removes all push tokens for the user" do
      user = create_test_user()

      # Register push tokens
      _token1 = register_push_token(user)
      _token2 = register_push_token(user)

      # Verify tokens exist
      tokens = from(pt in PushToken, where: pt.user_id == ^user.id) |> Repo.all()
      assert length(tokens) >= 2

      # Soft delete → hard delete
      soft_delete_user(user)
      assert :ok = run_hard_delete(user.id)

      # Verify tokens are gone
      remaining = from(pt in PushToken, where: pt.user_id == ^user.id) |> Repo.all()
      assert remaining == []
    end
  end

  # ── Test 3: Hard delete removes all PII ──────────────────

  describe "HV-3: hard delete removes all PII after grace period" do
    test "all personal data is anonymized after hard delete" do
      user = create_test_user()
      original_email = user.email
      original_username = user.username

      # Create associated data
      {:ok, _} =
        Preferences.set_preference(user.id, "conversation", Ecto.UUID.generate(), %{
          "mode" => "none"
        })

      _token = register_push_token(user)

      # Soft delete → hard delete
      soft_delete_user(user)
      assert :ok = run_hard_delete(user.id)

      # Verify PII is anonymized
      deleted_user = Repo.get(User, user.id)

      assert deleted_user.email != original_email
      assert deleted_user.email =~ "deleted_"
      assert deleted_user.email =~ "@deleted.invalid"
      assert deleted_user.username != original_username
      assert deleted_user.username =~ "deleted_"
      assert deleted_user.display_name == "Deleted User"
      assert is_nil(deleted_user.avatar_url)
      assert is_nil(deleted_user.bio)
      assert is_nil(deleted_user.password_hash)
      assert deleted_user.is_active == false
      assert deleted_user.is_suspended == true
    end
  end

  # ── Test 4: Grace period cancellation ────────────────────

  describe "HV-4: cancellation within grace period restores account" do
    test "reactivated user is not hard-deleted" do
      user = create_test_user()
      original_email = user.email

      # Soft delete
      deleted_user = soft_delete_user(user)
      assert deleted_user.deleted_at != nil
      assert deleted_user.is_active == false

      # User cancels deletion (reactivates within grace period)
      {:ok, reactivated} =
        deleted_user
        |> Ecto.Changeset.change(%{deleted_at: nil, is_active: true})
        |> Repo.update()

      assert is_nil(reactivated.deleted_at)
      assert reactivated.is_active == true

      # Hard delete job fires — should skip (deleted_at is nil)
      assert :ok = run_hard_delete(user.id)

      # User is still fully intact
      intact_user = Repo.get(User, user.id)
      assert intact_user.email == original_email
      assert is_nil(intact_user.deleted_at)
      assert intact_user.is_active == true
    end
  end

  # ── Test 5: Data export includes notification preferences ─

  describe "HV-5: data export includes notification preferences" do
    test "export_for_user returns notification preferences data" do
      user = create_test_user()
      target_id = Ecto.UUID.generate()

      {:ok, _} =
        Preferences.set_preference(user.id, "conversation", target_id, %{
          "mode" => "none"
        })

      assert {:ok, prefs} = Preferences.export_for_user(user.id)
      assert length(prefs) == 1

      pref = hd(prefs)
      assert pref.target_type == "conversation"
      assert pref.target_id == target_id
      assert pref.mode == "none"
    end

    test "export_for_user for push tokens returns device registrations" do
      user = create_test_user()
      _token = register_push_token(user)

      assert {:ok, tokens} = CGraph.Notifications.PushTokens.export_for_user(user.id)
      assert length(tokens) >= 1

      token = hd(tokens)
      assert token.platform == "expo"
      assert Map.has_key?(token, :device_id)
      assert Map.has_key?(token, :registered_at)
      # Token value should NOT be in the export (security)
      refute Map.has_key?(token, :token)
    end

    test "export_user_notifications returns notification history" do
      user = create_test_user()

      # The function should exist and return {:ok, list}
      assert {:ok, notifications} = CGraph.Notifications.export_user_notifications(user.id)
      assert is_list(notifications)
    end
  end
end
