defmodule CGraph.Forums.Polls do
  @moduledoc """
  Poll management for forum threads.

  Supports single and multiple choice polls with
  vote tracking and expiration.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{PollVote, ThreadPoll}
  alias CGraph.Repo

  @doc """
  Create a poll for a thread.
  """
  @spec create_thread_poll(String.t(), map()) :: {:ok, ThreadPoll.t()} | {:error, Ecto.Changeset.t()}
  def create_thread_poll(thread_id, attrs) do
    %ThreadPoll{}
    |> ThreadPoll.changeset(Map.put(attrs, :thread_id, thread_id))
    |> Repo.insert()
  end

  @doc """
  Get poll for a thread.
  """
  @spec get_thread_poll(String.t()) :: ThreadPoll.t() | nil
  def get_thread_poll(thread_id) do
    Repo.get_by(ThreadPoll, thread_id: thread_id)
  end

  @doc """
  Vote on a poll.

  ## Parameters
  - `poll_id` - The poll to vote on
  - `user_id` - The voting user
  - `option_ids` - List of selected option IDs (one row per option)
  """
  @spec vote_poll(String.t(), String.t(), [String.t()]) :: {:ok, PollVote.t()} | {:error, atom()}
  def vote_poll(poll_id, user_id, option_ids) when is_list(option_ids) do
    # get! safe: poll_id validated by caller via get_thread_poll
    poll = Repo.get!(ThreadPoll, poll_id)

    with :ok <- validate_poll_open(poll),
         :ok <- validate_not_already_voted(poll_id, user_id),
         :ok <- validate_option_count(poll, option_ids) do
      insert_poll_vote(poll_id, user_id)
    end
  end

  @doc """
  Check if a user has voted on a poll.
  """
  @spec has_voted?(String.t(), String.t()) :: boolean()
  def has_voted?(poll_id, user_id) do
    Repo.exists?(
      from v in PollVote,
        where: v.poll_id == ^poll_id and v.user_id == ^user_id
    )
  end

  @doc """
  Get poll results with vote counts.
  """
  @spec get_poll_results(String.t()) :: map()
  def get_poll_results(poll_id) do
    # get! safe: poll_id validated by caller via get_thread_poll
    poll = Repo.get!(ThreadPoll, poll_id)

    vote_count = from(v in PollVote,
      where: v.poll_id == ^poll_id,
      select: count(v.id)
    )
    |> Repo.one()

    %{
      poll: poll,
      total_votes: poll.total_votes,
      vote_count: vote_count
    }
  end

  # Private functions

  defp validate_poll_open(poll) do
    if poll.closes_at && DateTime.compare(DateTime.utc_now(), poll.closes_at) == :gt do
      {:error, :poll_closed}
    else
      :ok
    end
  end

  defp validate_not_already_voted(poll_id, user_id) do
    case Repo.get_by(PollVote, poll_id: poll_id, user_id: user_id) do
      nil -> :ok
      _existing -> {:error, :already_voted}
    end
  end

  defp validate_option_count(poll, option_ids) do
    if !poll.is_multiple_choice && length(option_ids) > 1 do
      {:error, :single_choice_only}
    else
      :ok
    end
  end

  defp insert_poll_vote(poll_id, user_id) do
    result = %PollVote{}
      |> PollVote.changeset(%{poll_id: poll_id, user_id: user_id})
      |> Repo.insert()

    case result do
      {:ok, vote} ->
        from(p in ThreadPoll, where: p.id == ^poll_id)
        |> Repo.update_all(inc: [total_votes: 1])

        # Broadcast updated poll results to thread channel
        # get! safe: poll_id just used for successful vote insert above
        poll = Repo.get!(ThreadPoll, poll_id)
        results = get_poll_results(poll_id)
        CGraphWeb.Endpoint.broadcast("thread:#{poll.thread_id}", "poll_vote_update", %{
          poll_id: poll_id,
          total_votes: results.total_votes,
          vote_count: results.vote_count
        })

        {:ok, vote}
      error ->
        error
    end
  end
end
