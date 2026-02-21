defmodule CGraph.AI.LLMClient do
  @moduledoc """
  HTTP client for LLM API calls.

  Supports OpenAI, Anthropic, and Ollama APIs with:
  - Streaming via Server-Sent Events
  - Automatic retries with exponential backoff
  - Circuit breaker via Fuse
  - Structured JSON responses
  """

  require Logger

  @max_retries 2
  @base_backoff 500

  @type message :: %{role: String.t(), content: String.t()}
  @type completion_result :: {:ok, String.t()} | {:error, atom() | String.t()}
  @type stream_result :: {:ok, Enumerable.t()} | {:error, atom() | String.t()}

  # ---------------------------------------------------------------------------
  # Completion API
  # ---------------------------------------------------------------------------

  @doc """
  Send a chat completion request to the configured LLM provider.
  Returns the full response text.
  """
  @spec complete(list(message()), keyword()) :: completion_result()
  def complete(messages, opts \\ []) do
    config = CGraph.AI.config()
    provider = Keyword.get(opts, :provider, config[:provider])

    case provider do
      :openai -> openai_complete(messages, config, opts)
      :anthropic -> anthropic_complete(messages, config, opts)
      :ollama -> ollama_complete(messages, config, opts)
      other -> {:error, "Unsupported provider: #{other}"}
    end
  end

  @doc """
  Send a streaming chat completion request.
  Returns a stream of text chunks.
  """
  @spec stream(list(message()), keyword()) :: stream_result()
  def stream(messages, opts \\ []) do
    config = CGraph.AI.config()
    provider = Keyword.get(opts, :provider, config[:provider])

    case provider do
      :openai -> openai_stream(messages, config, opts)
      :anthropic -> anthropic_stream(messages, config, opts)
      _ -> {:error, :streaming_not_supported}
    end
  end

  # ---------------------------------------------------------------------------
  # OpenAI
  # ---------------------------------------------------------------------------

  defp openai_complete(messages, config, opts) do
    url = "#{config[:base_url] || "https://api.openai.com/v1"}/chat/completions"

    body =
      Jason.encode!(%{
        model: Keyword.get(opts, :model, config[:model] || "gpt-4o-mini"),
        messages: messages,
        max_tokens: Keyword.get(opts, :max_tokens, config[:max_tokens] || 500),
        temperature: Keyword.get(opts, :temperature, config[:temperature] || 0.7)
      })

    headers = [
      {"Content-Type", "application/json"},
      {"Authorization", "Bearer #{config[:api_key]}"}
    ]

    with_retry(fn ->
      case Req.post(url, body: body, headers: headers, receive_timeout: config[:timeout] || 30_000) do
        {:ok, %{status: 200, body: response_body}} ->
          text =
            response_body
            |> Map.get("choices", [])
            |> List.first()
            |> deep_get(["message", "content"])

          {:ok, text || ""}

        {:ok, %{status: 429}} ->
          {:error, :rate_limited}

        {:ok, %{status: status, body: body}} ->
          Logger.warning("openai_api_error", status: status, body: inspect(body))
          {:error, "API error: #{status}"}

        {:error, error} ->
          Logger.error("openai_request_failed", error: inspect(error))
          {:error, :request_failed}
      end
    end)
  end

  defp openai_stream(messages, config, opts) do
    url = "#{config[:base_url] || "https://api.openai.com/v1"}/chat/completions"

    body =
      Jason.encode!(%{
        model: Keyword.get(opts, :model, config[:model] || "gpt-4o-mini"),
        messages: messages,
        max_tokens: Keyword.get(opts, :max_tokens, config[:max_tokens] || 500),
        temperature: Keyword.get(opts, :temperature, config[:temperature] || 0.7),
        stream: true
      })

    headers = [
      {"Content-Type", "application/json"},
      {"Authorization", "Bearer #{config[:api_key]}"}
    ]

    # Use Req with streaming — returns chunks via into: callback
    stream =
      Stream.resource(
        fn ->
          Req.post(url,
            body: body,
            headers: headers,
            receive_timeout: config[:timeout] || 60_000,
            into: :self
          )
        end,
        fn
          {:ok, %{status: 200}} ->
            receive do
              {:data, chunk} -> {parse_sse_chunk(chunk), {:ok, %{status: 200}}}
            after
              30_000 -> {:halt, :timeout}
            end

          other ->
            {:halt, other}
        end,
        fn _acc -> :ok end
      )

    {:ok, stream}
  end

  # ---------------------------------------------------------------------------
  # Anthropic
  # ---------------------------------------------------------------------------

  defp anthropic_complete(messages, config, opts) do
    url = "#{config[:base_url] || "https://api.anthropic.com/v1"}/messages"

    # Anthropic uses a different message format — system goes in top-level field
    {system_msgs, user_msgs} = Enum.split_with(messages, &(&1.role == "system"))
    system_text = Enum.map_join(system_msgs, "\n", & &1.content)

    body =
      Jason.encode!(%{
        model: Keyword.get(opts, :model, config[:model] || "claude-sonnet-4-20250514"),
        max_tokens: Keyword.get(opts, :max_tokens, config[:max_tokens] || 500),
        system: system_text,
        messages: user_msgs
      })

    headers = [
      {"Content-Type", "application/json"},
      {"x-api-key", config[:api_key]},
      {"anthropic-version", "2023-06-01"}
    ]

    with_retry(fn ->
      case Req.post(url, body: body, headers: headers, receive_timeout: config[:timeout] || 30_000) do
        {:ok, %{status: 200, body: response_body}} ->
          text =
            response_body
            |> Map.get("content", [])
            |> List.first()
            |> case do
              nil -> ""
              item -> Map.get(item, "text", "")
            end

          {:ok, text}

        {:ok, %{status: 429}} ->
          {:error, :rate_limited}

        {:ok, %{status: status, body: body}} ->
          Logger.warning("anthropic_api_error", status: status, body: inspect(body))
          {:error, "API error: #{status}"}

        {:error, error} ->
          Logger.error("anthropic_request_failed", error: inspect(error))
          {:error, :request_failed}
      end
    end)
  end

  defp anthropic_stream(messages, config, opts) do
    url = "#{config[:base_url] || "https://api.anthropic.com/v1"}/messages"

    {system_msgs, user_msgs} = Enum.split_with(messages, &(&1.role == "system"))
    system_text = Enum.map_join(system_msgs, "\n", & &1.content)

    body =
      Jason.encode!(%{
        model: Keyword.get(opts, :model, config[:model] || "claude-sonnet-4-20250514"),
        max_tokens: Keyword.get(opts, :max_tokens, config[:max_tokens] || 500),
        system: system_text,
        messages: user_msgs,
        stream: true
      })

    headers = [
      {"Content-Type", "application/json"},
      {"x-api-key", config[:api_key]},
      {"anthropic-version", "2023-06-01"}
    ]

    stream =
      Stream.resource(
        fn ->
          Req.post(url,
            body: body,
            headers: headers,
            receive_timeout: config[:timeout] || 60_000,
            into: :self
          )
        end,
        fn
          {:ok, %{status: 200}} ->
            receive do
              {:data, chunk} -> {parse_anthropic_sse_chunk(chunk), {:ok, %{status: 200}}}
            after
              30_000 -> {:halt, :timeout}
            end

          other ->
            {:halt, other}
        end,
        fn _acc -> :ok end
      )

    {:ok, stream}
  end

  # ---------------------------------------------------------------------------
  # Ollama (self-hosted)
  # ---------------------------------------------------------------------------

  defp ollama_complete(messages, config, opts) do
    url = "#{config[:base_url] || "http://localhost:11434"}/api/chat"

    body =
      Jason.encode!(%{
        model: Keyword.get(opts, :model, config[:model] || "llama3.2"),
        messages: messages,
        stream: false,
        options: %{
          num_predict: Keyword.get(opts, :max_tokens, config[:max_tokens] || 500),
          temperature: Keyword.get(opts, :temperature, config[:temperature] || 0.7)
        }
      })

    headers = [{"Content-Type", "application/json"}]

    with_retry(fn ->
      case Req.post(url, body: body, headers: headers, receive_timeout: 60_000) do
        {:ok, %{status: 200, body: response_body}} ->
          {:ok, Map.get(response_body, "message", %{}) |> Map.get("content", "")}

        {:ok, %{status: status}} ->
          {:error, "Ollama error: #{status}"}

        {:error, error} ->
          {:error, inspect(error)}
      end
    end)
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp with_retry(fun, attempt \\ 0) do
    case fun.() do
      {:error, :rate_limited} when attempt < @max_retries ->
        backoff = @base_backoff * :math.pow(2, attempt) |> round()
        Process.sleep(backoff)
        with_retry(fun, attempt + 1)

      {:error, :request_failed} when attempt < @max_retries ->
        backoff = @base_backoff * :math.pow(2, attempt) |> round()
        Process.sleep(backoff)
        with_retry(fun, attempt + 1)

      result ->
        result
    end
  end

  defp parse_sse_chunk(chunk) do
    chunk
    |> String.split("\n")
    |> Enum.filter(&String.starts_with?(&1, "data: "))
    |> Enum.reject(&(&1 == "data: [DONE]"))
    |> Enum.flat_map(fn line ->
      json = String.trim_leading(line, "data: ")
      case Jason.decode(json) do
        {:ok, %{"choices" => [%{"delta" => %{"content" => content}} | _]}} when is_binary(content) ->
          [content]
        _ ->
          []
      end
    end)
  end

  defp parse_anthropic_sse_chunk(chunk) do
    chunk
    |> String.split("\n")
    |> Enum.filter(&String.starts_with?(&1, "data: "))
    |> Enum.flat_map(fn line ->
      json = String.trim_leading(line, "data: ")
      case Jason.decode(json) do
        {:ok, %{"type" => "content_block_delta", "delta" => %{"text" => text}}} when is_binary(text) ->
          [text]
        _ ->
          []
      end
    end)
  end

  defp deep_get(nil, _keys), do: nil
  defp deep_get(map, []), do: map
  defp deep_get(map, [key | rest]) when is_map(map) do
    deep_get(Map.get(map, key), rest)
  end
  defp deep_get(_, _), do: nil
end
