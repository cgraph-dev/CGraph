defmodule CGraph.Creators.EarningsTest do
  use Cgraph.DataCase, async: false
  import CGraph.Factory

  alias CGraph.Creators.Earnings

  describe "get_balance/1" do
    test "returns zero balance when no earnings exist" do
      user = insert(:creator_user)
      balance = Earnings.get_balance(user.id)

      assert balance.total_earned_cents == 0
      assert balance.total_paid_out_cents == 0
      assert balance.available_balance_cents == 0
    end

    test "returns correct totals with a single earning" do
      creator = insert(:creator_user)
      insert(:creator_earning, creator: creator, gross_amount_cents: 1000, platform_fee_cents: 150, net_amount_cents: 850)

      balance = Earnings.get_balance(creator.id)

      assert balance.total_earned_cents == 850
      assert balance.total_paid_out_cents == 0
      assert balance.available_balance_cents == 850
    end

    test "sums multiple earnings correctly" do
      creator = insert(:creator_user)
      insert(:creator_earning, creator: creator, gross_amount_cents: 1000, platform_fee_cents: 150, net_amount_cents: 850)
      insert(:creator_earning, creator: creator, gross_amount_cents: 2000, platform_fee_cents: 300, net_amount_cents: 1700)

      balance = Earnings.get_balance(creator.id)

      assert balance.total_earned_cents == 2550
      assert balance.available_balance_cents == 2550
    end

    test "subtracts completed payouts from available balance" do
      creator = insert(:creator_user)
      insert(:creator_earning, creator: creator, gross_amount_cents: 5000, platform_fee_cents: 750, net_amount_cents: 4250)
      insert(:creator_payout, creator: creator, amount_cents: 2000, status: "completed")

      balance = Earnings.get_balance(creator.id)

      assert balance.total_earned_cents == 4250
      assert balance.total_paid_out_cents == 2000
      assert balance.available_balance_cents == 2250
    end

    test "ignores pending/failed payouts in paid_out total" do
      creator = insert(:creator_user)
      insert(:creator_earning, creator: creator, gross_amount_cents: 5000, platform_fee_cents: 750, net_amount_cents: 4250)
      insert(:creator_payout, creator: creator, amount_cents: 2000, status: "pending")
      insert(:creator_payout, creator: creator, amount_cents: 1000, status: "failed")

      balance = Earnings.get_balance(creator.id)

      assert balance.total_paid_out_cents == 0
      assert balance.available_balance_cents == 4250
    end

    test "does not mix earnings between creators" do
      creator1 = insert(:creator_user)
      creator2 = insert(:creator_user)
      insert(:creator_earning, creator: creator1, gross_amount_cents: 1000, platform_fee_cents: 150, net_amount_cents: 850)
      insert(:creator_earning, creator: creator2, gross_amount_cents: 3000, platform_fee_cents: 450, net_amount_cents: 2550)

      balance1 = Earnings.get_balance(creator1.id)
      balance2 = Earnings.get_balance(creator2.id)

      assert balance1.total_earned_cents == 850
      assert balance2.total_earned_cents == 2550
    end
  end

  describe "record_earning/2" do
    test "creates an earning with auto-calculated fees (15% platform fee)" do
      creator = insert(:creator_user)

      assert {:ok, earning} =
               Earnings.record_earning(creator.id, %{
                 amount_cents: 1000,
                 forum_id: nil,
                 subscriber_id: nil,
                 currency: "usd"
               })

      assert earning.gross_amount_cents == 1000
      assert earning.platform_fee_cents == 150
      assert earning.net_amount_cents == 850
      assert earning.creator_id == creator.id
    end

    test "handles different amounts correctly" do
      creator = insert(:creator_user)

      assert {:ok, earning} =
               Earnings.record_earning(creator.id, %{amount_cents: 2999})

      # 2999 * 15 / 100 = 449 (integer division)
      assert earning.platform_fee_cents == 449
      assert earning.net_amount_cents == 2999 - 449
    end

    test "records associated forum and subscriber" do
      creator = insert(:creator_user)
      subscriber = insert(:user)
      forum = insert(:forum, owner: creator)

      assert {:ok, earning} =
               Earnings.record_earning(creator.id, %{
                 amount_cents: 999,
                 forum_id: forum.id,
                 subscriber_id: subscriber.id,
                 payment_intent_id: "pi_test_123"
               })

      assert earning.forum_id == forum.id
      assert earning.subscriber_id == subscriber.id
      assert earning.stripe_payment_intent_id == "pi_test_123"
    end
  end

  describe "list_earnings/1" do
    test "returns earnings for a creator" do
      creator = insert(:creator_user)
      insert(:creator_earning, creator: creator)
      insert(:creator_earning, creator: creator)

      earnings = Earnings.list_earnings(creator.id)
      assert length(earnings) == 2
    end

    test "does not return other creators' earnings" do
      creator1 = insert(:creator_user)
      creator2 = insert(:creator_user)
      insert(:creator_earning, creator: creator1)
      insert(:creator_earning, creator: creator2)

      earnings = Earnings.list_earnings(creator1.id)
      assert length(earnings) == 1
    end

    test "returns empty list when no earnings" do
      creator = insert(:creator_user)
      assert Earnings.list_earnings(creator.id) == []
    end

    test "respects limit and offset" do
      creator = insert(:creator_user)
      for _ <- 1..5, do: insert(:creator_earning, creator: creator)

      earnings = Earnings.list_earnings(creator.id, limit: 2, offset: 0)
      assert length(earnings) == 2

      earnings = Earnings.list_earnings(creator.id, limit: 10, offset: 3)
      assert length(earnings) == 2
    end
  end

  describe "get_stats/2" do
    test "returns stats map with required keys" do
      creator = insert(:creator_user)

      stats = Earnings.get_stats(creator.id)

      assert Map.has_key?(stats, :subscriber_count)
      assert Map.has_key?(stats, :mrr_cents)
      assert Map.has_key?(stats, :churn_rate)
      assert Map.has_key?(stats, :earnings_over_time)
      assert Map.has_key?(stats, :top_forums)
    end

    test "returns zero stats for creator with no subscriptions" do
      creator = insert(:creator_user)

      stats = Earnings.get_stats(creator.id)

      assert stats.subscriber_count == 0
      assert stats.mrr_cents == 0
      assert stats.churn_rate == 0.0
    end

    test "counts active subscribers" do
      creator = insert(:creator_user)
      forum = insert(:monetized_forum, owner: creator)

      insert(:paid_forum_subscription,
        creator: creator,
        forum: forum,
        status: "active",
        current_period_end: DateTime.add(DateTime.utc_now(), 30, :day)
      )

      insert(:paid_forum_subscription,
        creator: creator,
        forum: forum,
        subscriber: insert(:user),
        status: "active",
        current_period_end: DateTime.add(DateTime.utc_now(), 30, :day)
      )

      stats = Earnings.get_stats(creator.id)
      assert stats.subscriber_count == 2
    end
  end
end
