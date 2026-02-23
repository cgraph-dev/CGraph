defmodule CGraph.AI.Sentiment do
  @moduledoc """
  Sentiment analysis — LLM with heuristic fallback.
  """

  alias CGraph.AI.LLMClient

  @doc """
  Analyze the sentiment of text.

  Returns:
    %{
      sentiment: :positive | :negative | :neutral | :mixed,
      score: float (-1.0 to 1.0),
      emotions: ["joy", "anger", ...],
      confidence: float (0-1)
    }
  """
  @spec analyze(String.t(), keyword()) :: map()
  def analyze(text, opts \\ []) do
    if CGraph.AI.llm_available?() do
      llm_analyze(text, opts)
    else
      heuristic_analyze(text)
    end
  end

  defp llm_analyze(text, opts) do
    system_prompt = """
    Analyze the sentiment. Return JSON:
    {"sentiment": "positive"|"negative"|"neutral"|"mixed",
     "score": -1.0 to 1.0,
     "emotions": ["joy", "anger", ...],
     "confidence": 0-1}
    Respond ONLY with valid JSON.
    """

    case LLMClient.complete([
      %{role: "system", content: system_prompt},
      %{role: "user", content: String.slice(text, 0, 1000)}
    ], opts) do
      {:ok, response} ->
        case Jason.decode(response) do
          {:ok, result} ->
            {:ok, %{
              sentiment: parse_sentiment(result["sentiment"]),
              score: result["score"] || 0.0,
              emotions: result["emotions"] || [],
              confidence: result["confidence"] || 0.5
            }}

          _ ->
            heuristic_analyze(text)
        end

      {:error, _} ->
        heuristic_analyze(text)
    end
  end

  defp heuristic_analyze(text) do
    words = String.downcase(text) |> String.split()

    positive_words = ~w(good great amazing awesome excellent happy love wonderful fantastic perfect nice beautiful cool)
    negative_words = ~w(bad terrible awful horrible hate angry sad disappointing worst ugly stupid broken)

    pos_count = Enum.count(words, &(&1 in positive_words))
    neg_count = Enum.count(words, &(&1 in negative_words))
    total = max(pos_count + neg_count, 1)

    score = (pos_count - neg_count) / total

    {sentiment, emotions} =
      cond do
        score > 0.3 -> {:positive, ["joy"]}
        score < -0.3 -> {:negative, ["frustration"]}
        pos_count > 0 and neg_count > 0 -> {:mixed, ["ambivalence"]}
        true -> {:neutral, []}
      end

    {:ok, %{
      sentiment: sentiment,
      score: Float.round(score, 2),
      emotions: emotions,
      confidence: 0.6
    }}
  end

  defp parse_sentiment(sentiment) when is_binary(sentiment) do
    case sentiment do
      "positive" -> :positive
      "negative" -> :negative
      "neutral" -> :neutral
      "mixed" -> :mixed
      _ -> :neutral
    end
  end
  defp parse_sentiment(_), do: :neutral
end
