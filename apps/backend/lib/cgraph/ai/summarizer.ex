defmodule CGraph.AI.Summarizer do
  @moduledoc """
  Conversation summarization — LLM-powered with heuristic fallback.
  """

  alias CGraph.AI.LLMClient

  @doc """
  Summarize a conversation into structured output.

  Returns:
    %{
      brief: "One-line summary",
      detailed: "Multi-paragraph summary",
      key_points: ["point 1", ...],
      action_items: ["action 1", ...],
      decisions: ["decision 1", ...]
    }
  """
  def summarize(messages, opts \\ []) when is_list(messages) do
    if CGraph.AI.llm_available?() do
      llm_summarize(messages, opts)
    else
      heuristic_summarize(messages)
    end
  end

  # ---------------------------------------------------------------------------
  # LLM Implementation
  # ---------------------------------------------------------------------------

  defp llm_summarize(messages, opts) do
    system_prompt = """
    You are a conversation summarizer. Given a conversation, produce a JSON response with:
    - "brief": A one-sentence summary
    - "detailed": A 2-3 paragraph detailed summary
    - "key_points": Array of 3-5 key points
    - "action_items": Array of action items mentioned
    - "decisions": Array of decisions made

    Respond ONLY with valid JSON.
    """

    formatted =
      messages
      |> Enum.map(fn msg ->
        sender = msg["sender"] || msg[:sender] || "Unknown"
        content = msg["content"] || msg[:content] || ""
        "#{sender}: #{content}"
      end)
      |> Enum.join("\n")

    llm_messages = [
      %{role: "system", content: system_prompt},
      %{role: "user", content: "Summarize this conversation:\n\n#{formatted}"}
    ]

    case LLMClient.complete(llm_messages, opts) do
      {:ok, response} ->
        case Jason.decode(response) do
          {:ok, parsed} ->
            {:ok, %{
              brief: parsed["brief"] || "",
              detailed: parsed["detailed"] || "",
              key_points: parsed["key_points"] || [],
              action_items: parsed["action_items"] || [],
              decisions: parsed["decisions"] || []
            }}

          {:error, _} ->
            # If JSON parsing fails, wrap raw response
            {:ok, %{
              brief: String.slice(response, 0, 200),
              detailed: response,
              key_points: [],
              action_items: [],
              decisions: []
            }}
        end

      {:error, _reason} ->
        # Fallback to heuristic
        heuristic_summarize(messages)
    end
  end

  # ---------------------------------------------------------------------------
  # Heuristic Fallback
  # ---------------------------------------------------------------------------

  defp heuristic_summarize(messages) do
    participants =
      messages
      |> Enum.map(&(Map.get(&1, "sender") || Map.get(&1, :sender, "Unknown")))
      |> Enum.uniq()

    all_text =
      messages
      |> Enum.map(&(Map.get(&1, "content") || Map.get(&1, :content, "")))
      |> Enum.join(" ")

    sentences =
      all_text
      |> String.split(~r/[.!?]+/)
      |> Enum.map(&String.trim/1)
      |> Enum.reject(&(&1 == ""))

    action_items =
      sentences
      |> Enum.filter(&Regex.match?(~r/\b(need to|should|must|will|going to|have to|let's)\b/i, &1))
      |> Enum.take(5)

    decisions =
      sentences
      |> Enum.filter(&Regex.match?(~r/\b(decided|agreed|confirmed|approved|will do|let's go with)\b/i, &1))
      |> Enum.take(5)

    key_points = Enum.take(sentences, 5)

    brief = "Conversation between #{Enum.join(participants, " and ")} with #{length(messages)} messages."

    detailed =
      "This conversation involves #{Enum.join(participants, ", ")}. " <>
      if(length(key_points) > 0,
        do: "Key topics: #{Enum.take(key_points, 3) |> Enum.join("; ")}. ",
        else: "") <>
      "Total of #{length(messages)} messages exchanged."

    {:ok, %{
      brief: brief,
      detailed: detailed,
      key_points: key_points,
      action_items: action_items,
      decisions: decisions
    }}
  end
end
