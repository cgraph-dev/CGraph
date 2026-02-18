defmodule CGraph.SubscriptionsTest do
  @moduledoc """
  Tests for the Subscriptions context.

  Tests the subscription lifecycle: activation, updates, cancellation,
  payment recording, and status queries (active?, get_tier, expiring_soon?).

  NOTE: Functions that call the Stripe API (create_checkout_session,
  create_portal_session) are NOT tested here since the project has no
  mocking framework installed.
  """
  use Cgraph.DataCase, async: true

  import CGraph.Factory

  alias CGraph.Subscriptions
  alias CGraph.Accounts.User

  # -------------------------------------------------------------------------
  # Helpers
  # -------------------------------------------------------------------------

  defp future_expiry(days \\ 30) do
    DateTime.utc_now() |> DateTime.add(days * 86_400, :second) |> DateTime.truncate(:second)
  end

  defp past_expiry(days \\ 1) do
    DateTime.utc_now() |> DateTime.add(-days * 86_400, :second) |> DateTime.truncate(:second)
  end

  # =========================================================================
  # active?/1
  # =========================================================================

  describe "active?/1" do
    test "returns false for free tier user" do
      user = insert(:user, subscription_tier: "free")
      refute Subscriptions.active?(user)
    end

    test "returns false for nil tier" do
      user = insert(:user)
      user = %{user | subscription_tier: nil}
      refute Subscriptions.active?(user)
    end

    test "returns true for premium user with future expiry" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(30)
      )
      assert Subscriptions.active?(user)
    end

    test "returns true for enterprise user with future expiry" do
      user = insert(:user,
        subscription_tier: "enterprise",
        subscription_expires_at: future_expiry(60)
      )
      assert Subscriptions.active?(user)
    end

    test "returns false for premium user with expired subscription" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: past_expiry(1)
      )
      refute Subscriptions.active?(user)
    end

    test "returns true for premium user with nil expiry (never-expiring)" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: nil
      )
      assert Subscriptions.active?(user)
    end

    test "returns false for non-User input" do
      refute Subscriptions.active?(nil)
      refute Subscriptions.active?("premium")
      refute Subscriptions.active?(%{})
    end
  end

  # =========================================================================
  # get_tier/1
  # =========================================================================

  describe "get_tier/1" do
    test "returns free when subscription_tier is nil" do
      user = insert(:user)
      user = %{user | subscription_tier: nil}
      assert Subscriptions.get_tier(user) == "free"
    end

    test "returns free for free tier user" do
      user = insert(:user, subscription_tier: "free")
      assert Subscriptions.get_tier(user) == "free"
    end

    test "returns premium for premium user" do
      user = insert(:user, subscription_tier: "premium")
      assert Subscriptions.get_tier(user) == "premium"
    end

    test "returns enterprise for enterprise user" do
      user = insert(:user, subscription_tier: "enterprise")
      assert Subscriptions.get_tier(user) == "enterprise"
    end
  end

  # =========================================================================
  # expiring_soon?/1
  # =========================================================================

  describe "expiring_soon?/1" do
    test "returns false when subscription_expires_at is nil" do
      user = insert(:user, subscription_tier: "premium", subscription_expires_at: nil)
      refute Subscriptions.expiring_soon?(user)
    end

    test "returns true when subscription expires in 3 days" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(3)
      )
      assert Subscriptions.expiring_soon?(user)
    end

    test "returns true when subscription expires in 6 days" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(6)
      )
      assert Subscriptions.expiring_soon?(user)
    end

    test "returns true when subscription expires in 2 days" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(2)
      )
      assert Subscriptions.expiring_soon?(user)
    end

    test "returns false when subscription expires in 14 days" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(14)
      )
      refute Subscriptions.expiring_soon?(user)
    end

    test "returns false when subscription already expired" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: past_expiry(1)
      )
      refute Subscriptions.expiring_soon?(user)
    end
  end

  # =========================================================================
  # activate_subscription/2
  # =========================================================================

  describe "activate_subscription/2" do
    test "activates a free user to premium" do
      user = insert(:user, subscription_tier: "free")
      expires = future_expiry(30)

      params = %{
        tier: "premium",
        current_period_end: DateTime.to_unix(expires),
        stripe_subscription_id: "sub_test123",
        stripe_customer_id: "cus_test456"
      }

      assert {:ok, updated} = Subscriptions.activate_subscription(user, params)
      assert updated.subscription_tier == "premium"
      assert updated.stripe_customer_id == "cus_test456"
      assert updated.subscription_expires_at != nil
    end

    test "activates to enterprise tier" do
      user = insert(:user, subscription_tier: "free")
      expires = future_expiry(30)

      params = %{
        tier: "enterprise",
        current_period_end: DateTime.to_unix(expires),
        stripe_subscription_id: "sub_ent001",
        stripe_customer_id: "cus_ent001"
      }

      assert {:ok, updated} = Subscriptions.activate_subscription(user, params)
      assert updated.subscription_tier == "enterprise"
      assert updated.stripe_customer_id == "cus_ent001"
    end

    test "persists activation to database" do
      user = insert(:user, subscription_tier: "free")

      params = %{
        tier: "premium",
        current_period_end: DateTime.to_unix(future_expiry(30)),
        stripe_subscription_id: "sub_persist",
        stripe_customer_id: "cus_persist"
      }

      assert {:ok, _updated} = Subscriptions.activate_subscription(user, params)

      reloaded = Repo.get!(User, user.id)
      assert reloaded.subscription_tier == "premium"
      assert reloaded.stripe_customer_id == "cus_persist"
    end
  end

  # =========================================================================
  # update_subscription/2
  # =========================================================================

  describe "update_subscription/2" do
    test "updates tier from premium to enterprise" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(15)
      )

      params = %{
        tier: "enterprise",
        current_period_end: DateTime.to_unix(future_expiry(30))
      }

      assert {:ok, updated} = Subscriptions.update_subscription(user, params)
      assert updated.subscription_tier == "enterprise"
    end

    test "updates period end without changing tier" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(5)
      )

      new_expiry = future_expiry(30)

      params = %{current_period_end: DateTime.to_unix(new_expiry)}

      assert {:ok, updated} = Subscriptions.update_subscription(user, params)
      assert updated.subscription_tier == "premium"
      assert updated.subscription_expires_at != nil
    end

    test "persists changes to database" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(5)
      )

      params = %{
        tier: "enterprise",
        current_period_end: DateTime.to_unix(future_expiry(30))
      }

      assert {:ok, _updated} = Subscriptions.update_subscription(user, params)

      reloaded = Repo.get!(User, user.id)
      assert reloaded.subscription_tier == "enterprise"
    end
  end

  # =========================================================================
  # cancel_subscription/1
  # =========================================================================

  describe "cancel_subscription/1" do
    test "reverts premium user to free tier" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(30),
        stripe_customer_id: "cus_cancel1"
      )

      assert {:ok, updated} = Subscriptions.cancel_subscription(user)
      assert updated.subscription_tier == "free"
      assert updated.subscription_expires_at == nil
      # stripe_customer_id should be preserved
      assert updated.stripe_customer_id == "cus_cancel1"
    end

    test "reverts enterprise user to free tier" do
      user = insert(:user,
        subscription_tier: "enterprise",
        subscription_expires_at: future_expiry(60),
        stripe_customer_id: "cus_cancel2"
      )

      assert {:ok, updated} = Subscriptions.cancel_subscription(user)
      assert updated.subscription_tier == "free"
      assert updated.subscription_expires_at == nil
    end

    test "cancelling a free user is a no-op (stays free)" do
      user = insert(:user, subscription_tier: "free")

      assert {:ok, updated} = Subscriptions.cancel_subscription(user)
      assert updated.subscription_tier == "free"
    end

    test "persists cancellation to database" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(30)
      )

      assert {:ok, _updated} = Subscriptions.cancel_subscription(user)

      reloaded = Repo.get!(User, user.id)
      assert reloaded.subscription_tier == "free"
      assert reloaded.subscription_expires_at == nil
    end
  end

  # =========================================================================
  # link_stripe_customer/2
  # =========================================================================

  describe "link_stripe_customer/2" do
    test "links stripe_customer_id to user" do
      user = insert(:user, subscription_tier: "free")

      params = %{
        stripe_customer_id: "cus_linked1",
        stripe_subscription_id: "sub_linked1"
      }

      assert {:ok, updated} = Subscriptions.link_stripe_customer(user, params)
      assert updated.stripe_customer_id == "cus_linked1"
    end

    test "persists customer link to database" do
      user = insert(:user, subscription_tier: "free")

      params = %{
        stripe_customer_id: "cus_linked2",
        stripe_subscription_id: "sub_linked2"
      }

      assert {:ok, _updated} = Subscriptions.link_stripe_customer(user, params)

      reloaded = Repo.get!(User, user.id)
      assert reloaded.stripe_customer_id == "cus_linked2"
    end
  end

  # =========================================================================
  # record_payment/2
  # =========================================================================

  describe "record_payment/2" do
    test "records payment and updates period when current_period_end provided" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(1)
      )

      new_expiry = future_expiry(30)

      params = %{
        amount: 999,
        currency: "usd",
        current_period_end: DateTime.to_unix(new_expiry)
      }

      assert {:ok, updated} = Subscriptions.record_payment(user, params)
      assert updated.subscription_expires_at != nil
    end

    test "returns user unchanged when no current_period_end" do
      user = insert(:user,
        subscription_tier: "premium",
        subscription_expires_at: future_expiry(15)
      )

      params = %{amount: 999, currency: "usd"}

      assert {:ok, returned} = Subscriptions.record_payment(user, params)
      assert returned.id == user.id
    end
  end

  # =========================================================================
  # record_payment_failure/2
  # =========================================================================

  describe "record_payment_failure/2" do
    test "returns ok tuple without side effects" do
      user = insert(:user, subscription_tier: "premium")

      params = %{attempt_count: 1}

      assert {:ok, returned} = Subscriptions.record_payment_failure(user, params)
      assert returned.id == user.id
    end
  end

  # =========================================================================
  # Full lifecycle integration
  # =========================================================================

  describe "full subscription lifecycle" do
    test "free -> activate -> update -> cancel" do
      user = insert(:user, subscription_tier: "free")
      refute Subscriptions.active?(user)
      assert Subscriptions.get_tier(user) == "free"

      # Activate premium
      {:ok, user} = Subscriptions.activate_subscription(user, %{
        tier: "premium",
        current_period_end: DateTime.to_unix(future_expiry(30)),
        stripe_subscription_id: "sub_lifecycle",
        stripe_customer_id: "cus_lifecycle"
      })

      assert Subscriptions.active?(user)
      assert Subscriptions.get_tier(user) == "premium"
      refute Subscriptions.expiring_soon?(user)

      # Upgrade to enterprise
      {:ok, user} = Subscriptions.update_subscription(user, %{
        tier: "enterprise",
        current_period_end: DateTime.to_unix(future_expiry(60))
      })

      assert Subscriptions.active?(user)
      assert Subscriptions.get_tier(user) == "enterprise"

      # Cancel
      {:ok, user} = Subscriptions.cancel_subscription(user)

      refute Subscriptions.active?(user)
      assert Subscriptions.get_tier(user) == "free"

      # Verify in DB
      reloaded = Repo.get!(User, user.id)
      assert reloaded.subscription_tier == "free"
      assert reloaded.subscription_expires_at == nil
      assert reloaded.stripe_customer_id == "cus_lifecycle"
    end
  end

  # =========================================================================
  # create_portal_session/1 — edge cases
  # =========================================================================

  describe "create_portal_session/1 edge cases" do
    test "returns error when user has no stripe_customer_id" do
      user = insert(:user, stripe_customer_id: nil)
      assert {:error, :no_customer} = Subscriptions.create_portal_session(user)
    end
  end
end
