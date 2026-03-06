defmodule CGraph.Messaging.MessageTranslation do
  @moduledoc """
  Pluggable message translation with adapter pattern.

  Defaults to a NoOp adapter that passes text through unchanged.
  Configure a real adapter (e.g., LibreTranslate) via:

      config :cgraph, :translation, adapter: CGraph.Messaging.Translation.LibreTranslate
  """

  @adapter Application.compile_env(:cgraph, [:translation, :adapter],
             CGraph.Messaging.Translation.NoOp)

  @supported_languages ~w(en es fr de it pt ru zh ja ko ar hi tr pl nl sv da no fi uk)

  @doc "Translate text to the given target language."
  @spec translate(String.t(), String.t()) :: {:ok, String.t()} | {:error, atom()}
  def translate(text, target_language) do
    if target_language in @supported_languages do
      @adapter.translate(text, target_language)
    else
      {:error, :unsupported_language}
    end
  end

  @doc "List supported target languages."
  @spec supported_languages() :: [String.t()]
  def supported_languages, do: @supported_languages
end

defmodule CGraph.Messaging.Translation.NoOp do
  @moduledoc "No-op translation adapter — returns text unchanged."

  @spec translate(String.t(), String.t()) :: {:ok, String.t()}
  def translate(text, _target_language), do: {:ok, text}
end

defmodule CGraph.Messaging.Translation.LibreTranslate do
  @moduledoc """
  LibreTranslate adapter stub.

  Configure the endpoint:

      config :cgraph, :translation,
        adapter: CGraph.Messaging.Translation.LibreTranslate,
        endpoint: "https://libretranslate.example.com"
  """

  @spec translate(String.t(), String.t()) :: {:ok, String.t()} | {:error, atom()}
  def translate(text, target_language) do
    endpoint = Application.get_env(:cgraph, :translation)[:endpoint] || "http://localhost:5000"

    body = Jason.encode!(%{q: text, target: target_language, source: "auto"})

    case HTTPoison.post("#{endpoint}/translate", body, [{"Content-Type", "application/json"}]) do
      {:ok, %{status_code: 200, body: resp_body}} ->
        case Jason.decode(resp_body) do
          {:ok, %{"translatedText" => translated}} -> {:ok, translated}
          _ -> {:error, :parse_error}
        end

      _ ->
        {:error, :translation_service_unavailable}
    end
  end
end
