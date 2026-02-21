defmodule CGraph.AI.SmartReplies do
  @moduledoc """
  Smart reply suggestion generation — LLM with heuristic fallback.
  """

  alias CGraph.AI.LLMClient

  @type reply :: %{text: String.t(), confidence: float(), category: String.t()}

  @doc """
  Generate 3 smart reply suggestions for a message.
  """
  @spec generate(String.t(), keyword()) :: {:ok, list(reply())} | {:error, term()}
  def generate(message, opts \\ []) do
    if CGraph.AI.llm_available?() do
      llm_generate(message, opts)
    else
      heuristic_generate(message)
    end
  end

  defp llm_generate(message, opts) do
    context = Keyword.get(opts, :context, "")

    system_prompt = """
    Generate 3 smart reply suggestions for the given message.
    Return a JSON array of objects with "text", "confidence" (0-1), and "category".
    Categories: greeting, question, thanks, agreement, info, farewell.
    Keep replies short (under 50 characters). Respond ONLY with valid JSON array.
    """

    user_content =
      if context != "" do
        "Context: #{context}\n\nMessage: #{message}"
      else
        "Message: #{message}"
      end

    case LLMClient.complete([
      %{role: "system", content: system_prompt},
      %{role: "user", content: user_content}
    ], opts) do
      {:ok, response} ->
        case Jason.decode(response) do
          {:ok, replies} when is_list(replies) ->
            formatted =
              replies
              |> Enum.take(3)
              |> Enum.map(fn r ->
                %{
                  text: r["text"] || "",
                  confidence: r["confidence"] || 0.7,
                  category: r["category"] || "info"
                }
              end)
            {:ok, formatted}

          _ ->
            heuristic_generate(message)
        end

      {:error, _} ->
        heuristic_generate(message)
    end
  end

  defp heuristic_generate(message) do
    msg = String.downcase(message)

    replies =
      cond do
        String.contains?(msg, "?") ->
          [
            %{text: "Yes, that works!", confidence: 0.8, category: "agreement"},
            %{text: "Let me check and get back to you", confidence: 0.7, category: "info"},
            %{text: "No, I don't think so", confidence: 0.6, category: "disagreement"}
          ]

        Regex.match?(~r/\b(hi|hello|hey|morning|afternoon|evening)\b/, msg) ->
          [
            %{text: "Hey! How's it going?", confidence: 0.9, category: "greeting"},
            %{text: "Hi there! 👋", confidence: 0.85, category: "greeting"},
            %{text: "Hello! What's up?", confidence: 0.8, category: "greeting"}
          ]

        Regex.match?(~r/\b(thanks|thank you|thx)\b/, msg) ->
          [
            %{text: "You're welcome!", confidence: 0.9, category: "thanks"},
            %{text: "No problem at all!", confidence: 0.85, category: "thanks"},
            %{text: "Happy to help! 😊", confidence: 0.8, category: "thanks"}
          ]

        Regex.match?(~r/\b(bye|goodbye|see you|later|gotta go)\b/, msg) ->
          [
            %{text: "See you later! 👋", confidence: 0.9, category: "farewell"},
            %{text: "Bye! Take care!", confidence: 0.85, category: "farewell"},
            %{text: "Talk to you soon!", confidence: 0.8, category: "farewell"}
          ]

        true ->
          [
            %{text: "Got it, thanks!", confidence: 0.7, category: "agreement"},
            %{text: "Makes sense 👍", confidence: 0.65, category: "agreement"},
            %{text: "Interesting, tell me more", confidence: 0.6, category: "info"}
          ]
      end

    {:ok, replies}
  end
end
