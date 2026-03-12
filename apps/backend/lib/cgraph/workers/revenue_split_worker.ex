defmodule CGraph.Workers.RevenueSplitWorker do
  @moduledoc """
  Oban worker for processing revenue splits on premium thread purchases.

  Runs on the :payments queue with up to 3 attempts.
  Calculates the revenue distribution and records earnings for each party.
  """

  use Oban.Worker, queue: :payments, max_attempts: 3

  alias CGraph.Creators.PremiumContent
  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{
          "user_id" => _user_id,
          "thread_id" => thread_id,
          "premium_thread_id" => _premium_thread_id,
          "creator_id" => creator_id,
          "price_nodes" => price_nodes
        } = args
      }) do
    referral_id = Map.get(args, "referral_id")

    case PremiumContent.calculate_revenue_split(thread_id, price_nodes) do
      {:ok, split_result} ->
        Logger.info(
          "Revenue split processed for thread #{thread_id}: " <>
            "creator=#{split_result.creator_amount}, " <>
            "platform=#{split_result.platform_amount}, " <>
            "referral=#{split_result.referral_amount}"
        )

        # Record creator earnings
        CGraph.Creators.record_earning(creator_id, %{
          amount_cents: Decimal.to_integer(Decimal.round(split_result.creator_amount)),
          source: "premium_thread",
          source_id: thread_id,
          currency: "nodes"
        })

        # Record referral earnings if applicable
        if referral_id && Decimal.gt?(split_result.referral_amount, Decimal.new(0)) do
          CGraph.Creators.record_earning(referral_id, %{
            amount_cents: Decimal.to_integer(Decimal.round(split_result.referral_amount)),
            source: "referral",
            source_id: thread_id,
            currency: "nodes"
          })
        end

        :ok

      {:error, reason} ->
        Logger.error("Revenue split failed for thread #{thread_id}: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
