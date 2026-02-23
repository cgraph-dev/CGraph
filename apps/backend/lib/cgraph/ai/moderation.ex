defmodule CGraph.AI.Moderation do
  @moduledoc """
  Content moderation — LLM-powered with keyword fallback.
  """

  alias CGraph.AI.LLMClient

  @doc """
  Check content for safety violations.

  Returns:
    %{
      safe: boolean,
      categories: ["spam", "harassment", ...],
      confidence: float,
      action: :allow | :flag | :block
    }
  """
  @spec check(String.t(), keyword()) :: map()
  def check(content, opts \\ []) do
    if CGraph.AI.llm_available?() do
      llm_moderate(content, opts)
    else
      heuristic_moderate(content)
    end
  end

  defp llm_moderate(content, opts) do
    system_prompt = """
    You are a content moderator. Analyze the text for:
    - spam, harassment, hate_speech, violence, sexual, self_harm, scam
    Return JSON: {"safe": bool, "categories": [...], "confidence": 0-1, "action": "allow"|"flag"|"block"}
    Respond ONLY with valid JSON.
    """

    case LLMClient.complete([
      %{role: "system", content: system_prompt},
      %{role: "user", content: "Moderate: #{String.slice(content, 0, 2000)}"}
    ], opts) do
      {:ok, response} ->
        case Jason.decode(response) do
          {:ok, result} ->
            {:ok, %{
              safe: Map.get(result, "safe", false),
              categories: result["categories"] || [],
              confidence: result["confidence"] || 0.5,
              action: parse_action(result["action"])
            }}

          _ ->
            heuristic_moderate(content)
        end

      {:error, _} ->
        heuristic_moderate(content)
    end
  end

  # Basic keyword-based moderation fallback
  defp heuristic_moderate(content) do
    text = String.downcase(content)
    categories = []

    # Check for common spam indicators
    categories =
      if Regex.match?(~r/(buy now|free money|click here|limited offer|act now)/i, text) do
        ["spam" | categories]
      else
        categories
      end

    # Check for URL spam (excessive links)
    url_count = length(Regex.scan(~r/https?:\/\//, text))
    categories =
      if url_count > 3, do: ["spam" | categories], else: categories

    # Check for all-caps shouting
    words = String.split(content)
    caps_ratio = Enum.count(words, &(String.upcase(&1) == &1 and String.length(&1) > 2)) / max(length(words), 1)
    categories =
      if caps_ratio > 0.5 and length(words) > 5, do: ["harassment" | categories], else: categories

    # Check for hate speech indicators
    categories =
      if Regex.match?(~r/\b(slur|racial|supremac|nazi|genocide)\b/i, text) do
        ["hate_speech" | categories]
      else
        categories
      end

    # Check for violence indicators
    categories =
      if Regex.match?(~r/\b(kill\s+you|murder|shoot|bomb\s+threat|attack\s+you)\b/i, text) do
        ["violence" | categories]
      else
        categories
      end

    # Check for sexual content indicators
    categories =
      if Regex.match?(~r/\b(nsfw|porn|explicit|nude|xxx)\b/i, text) do
        ["sexual" | categories]
      else
        categories
      end

    # Check for scam indicators
    categories =
      if Regex.match?(~r/(send\s+bitcoin|wire\s+transfer|social\s+security|bank\s+account|nigerian\s+prince|investment\s+opportunity)/i, text) do
        ["scam" | categories]
      else
        categories
      end

    safe = categories == []
    action = if safe, do: :allow, else: if(length(categories) > 1, do: :block, else: :flag)

    {:ok, %{
      safe: safe,
      categories: Enum.uniq(categories),
      confidence: if(safe, do: 0.8, else: 0.6),
      action: action
    }}
  end

  defp parse_action(action) when is_binary(action) do
    case action do
      "allow" -> :allow
      "flag" -> :flag
      "block" -> :block
      _ -> :flag
    end
  end
  defp parse_action(_), do: :flag
end
