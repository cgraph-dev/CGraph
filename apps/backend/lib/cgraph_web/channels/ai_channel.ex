defmodule CGraphWeb.Channels.AIChannel do
  @moduledoc """
  Phoenix Channel for streaming AI responses.

  Supports real-time AI features:
  - `ai:summarize_stream` — streamed summarization
  - `ai:smart_replies` — instant reply suggestions
  - `ai:moderate` — real-time content moderation

  ## Topic

      "ai:{user_id}"

  ## Authentication

  Requires a valid token. The user_id in the topic must match the
  authenticated user.
  """

  use CGraphWeb, :channel

  require Logger

  alias CGraph.AI
  alias CGraph.AI.LLMClient

  @impl true
  def join("ai:" <> user_id, _params, socket) do
    current_user = socket.assigns[:current_user]

    if current_user && to_string(current_user.id) == user_id do
      socket =
        socket
        |> assign(:user_id, current_user.id)
        |> assign(:tier, user_tier(current_user))

      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_in("summarize_stream", %{"messages" => messages}, socket) do
    user_id = socket.assigns.user_id
    tier = socket.assigns[:tier] || :free

    # Send message to self instead of spawning — push/3 must run in channel process
    send(self(), {:do_summarize_stream, messages, user_id, tier})

    {:noreply, socket}
  end

  @impl true
  def handle_in("smart_replies", %{"message" => message} = params, socket) do
    user_id = socket.assigns.user_id
    tier = socket.assigns[:tier] || :free
    context = Map.get(params, "context", "")

    case AI.smart_replies(message, user_id: user_id, tier: tier, context: context) do
      {:ok, replies} ->
        push(socket, "ai:replies", %{data: replies})

      {:error, :rate_limited} ->
        push(socket, "ai:error", %{error: "rate_limited"})

      {:error, reason} ->
        push(socket, "ai:error", %{error: to_string(reason)})
    end

    {:noreply, socket}
  end

  @impl true
  def handle_in("moderate", %{"content" => content}, socket) do
    user_id = socket.assigns.user_id
    tier = socket.assigns[:tier] || :free

    case AI.moderate(content, user_id: user_id, tier: tier) do
      {:ok, result} ->
        push(socket, "ai:moderation_result", %{data: result})

      {:error, reason} ->
        push(socket, "ai:error", %{error: to_string(reason)})
    end

    {:noreply, socket}
  end

  # ---------------------------------------------------------------------------
  # Async streaming via handle_info (push must run in channel process)
  # ---------------------------------------------------------------------------

  @impl true
  def handle_info({:do_summarize_stream, messages, user_id, tier}, socket) do
    case AI.llm_available?() do
      true ->
        stream_summarize(socket, messages, user_id, tier)

      false ->
        case AI.summarize(messages, user_id: user_id, tier: tier) do
          {:ok, summary} ->
            push(socket, "ai:summary_complete", %{data: summary})

          {:error, reason} ->
            push(socket, "ai:error", %{error: to_string(reason)})
        end
    end

    {:noreply, socket}
  end

  # ---------------------------------------------------------------------------
  # Streaming helpers
  # ---------------------------------------------------------------------------

  defp stream_summarize(socket, messages, user_id, tier) do
    system_prompt = """
    Summarize the conversation. Stream your response naturally.
    Start with a brief one-line summary, then provide key points.
    """

    formatted =
      messages
      |> Enum.map(fn msg ->
        "#{msg["sender"] || "Unknown"}: #{msg["content"] || ""}"
      end)
      |> Enum.join("\n")

    llm_messages = [
      %{role: "system", content: system_prompt},
      %{role: "user", content: "Summarize:\n#{formatted}"}
    ]

    case LLMClient.stream(llm_messages, user_id: user_id, tier: tier) do
      {:ok, stream} ->
        Enum.each(stream, fn chunk ->
          push(socket, "ai:summary_chunk", %{chunk: chunk})
        end)
        push(socket, "ai:summary_complete", %{})

      {:error, _reason} ->
        # Fallback to non-streaming
        case AI.summarize(messages, user_id: user_id, tier: tier) do
          {:ok, summary} ->
            push(socket, "ai:summary_complete", %{data: summary})

          {:error, reason} ->
            push(socket, "ai:error", %{error: to_string(reason)})
        end
    end
  rescue
    error ->
      Logger.error("AI stream error: #{inspect(error)}")
      push(socket, "ai:error", %{error: "streaming_failed"})
  end

  defp user_tier(user) do
    case user do
      %{subscription_tier: "enterprise"} -> :enterprise
      %{subscription_tier: "premium"} -> :premium
      _ -> :free
    end
  end
end
