defmodule CGraph.Workers.EventRewardDistributor do
  @moduledoc """
  Oban worker for distributing event rewards to participants.
  
  Runs when an event ends to:
  - Calculate final standings
  - Distribute rewards based on battle pass progress
  - Send notifications to winners
  """

  use Oban.Worker, queue: :events, max_attempts: 3

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"event_id" => event_id}}) do
    Logger.info("[EventRewardDistributor] Processing rewards for event #{event_id}")
    
    # TODO: Implement reward distribution
    # 1. Get all participants
    # 2. Calculate final standings
    # 3. Distribute rewards based on tier progress
    # 4. Send notifications
    
    :ok
  end

  @doc """
  Enqueue a reward distribution job.
  """
  def enqueue(%{event_id: event_id}) do
    %{event_id: event_id}
    |> __MODULE__.new()
    |> Oban.insert()
  end
end
