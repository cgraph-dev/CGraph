defmodule CGraphWeb.API.V1.PollJSON do
  @moduledoc """
  JSON rendering for thread polls.
  """

  @doc "Renders a poll with results and vote status."
  @spec show(map()) :: map()
  def show(%{poll: poll, results: results, has_voted: has_voted}) do
    %{
      data: poll_data(poll, results, has_voted)
    }
  end

  defp poll_data(poll, results, has_voted) do
    option_counts = Map.get(results, :option_counts, %{})

    %{
      id: poll.id,
      thread_id: poll.thread_id,
      question: poll.question,
      options: render_options(poll.options, option_counts),
      is_multiple_choice: poll.is_multiple_choice,
      max_options: poll.max_options,
      is_public: poll.is_public,
      closes_at: poll.closes_at,
      is_open: CGraph.Forums.ThreadPoll.open?(poll),
      total_votes: poll.total_votes,
      has_voted: has_voted,
      inserted_at: poll.inserted_at,
      updated_at: poll.updated_at
    }
  end

  defp render_options(options, option_counts) when is_list(options) do
    Enum.map(options, fn opt ->
      opt_id = opt["id"] || Map.get(opt, :id)

      %{
        id: opt_id,
        text: opt["text"] || Map.get(opt, :text),
        votes: Map.get(option_counts, opt_id, 0)
      }
    end)
  end

  defp render_options(_, _), do: []
end
