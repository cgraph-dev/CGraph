defmodule CGraph.Notifications.PushService.FcmClient.Http do
  @moduledoc """
  HTTP transport layer for FCM API communication.

  Handles request construction, response parsing, and error mapping
  for the FCM HTTP v1 API. Uses Finch for HTTP requests.
  """

  require Logger

  @fcm_base_url "https://fcm.googleapis.com/v1/projects"
  @fcm_send_endpoint "messages:send"
  @default_timeout 30_000

  @doc """
  Sends a single FCM message via HTTP, building the request and parsing the response.

  ## Parameters

  - `message` - The built FCM message map
  - `state` - GenServer state containing config and access_token
  - `dry_run` - If true, FCM validates but does not deliver the message
  """
  @spec send_request(map(), map(), boolean()) :: {:ok, String.t()} | {:error, atom()}
  def send_request(message, state, dry_run) do
    {url, headers, body} = build_fcm_request(message, state, dry_run)
    handle_fcm_response(http_post(url, headers, body))
  end

  @doc """
  Performs an HTTP POST request via Finch.
  """
  @spec http_post(String.t(), list(), String.t()) ::
          {:ok, integer(), list(), String.t()} | {:error, term()}
  def http_post(url, headers, body) do
    request = Finch.build(:post, url, headers, body)

    case Finch.request(request, CGraph.Finch, receive_timeout: @default_timeout) do
      {:ok, %Finch.Response{status: status, headers: headers, body: body}} ->
        {:ok, status, headers, body}

      {:error, reason} ->
        {:error, reason}
    end
  rescue
    e ->
      Logger.error("fcm_http_request_failed", error: inspect(e))
      {:error, :request_failed}
  end

  @doc """
  Parses an FCM error response body into an error atom.
  """
  @spec parse_error(binary() | term()) :: atom()
  def parse_error(body) when is_binary(body) do
    case Jason.decode(body) do
      {:ok, %{"error" => %{"code" => code}}} ->
        error_code_to_atom(code)

      {:ok, %{"error" => %{"message" => message}}} ->
        Logger.warning("fcm_error", message: message)
        :unknown_error

      _ ->
        :unknown_error
    end
  end

  def parse_error(_), do: :unknown_error

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp build_fcm_request(message, state, dry_run) do
    project_id = state.config[:project_id]
    url = "#{@fcm_base_url}/#{project_id}/#{@fcm_send_endpoint}"
    body = %{"message" => message, "validate_only" => dry_run}

    headers = [
      {"authorization", "Bearer #{state.access_token}"},
      {"content-type", "application/json"}
    ]

    {url, headers, Jason.encode!(body)}
  end

  defp handle_fcm_response({:ok, 200, _headers, response_body}) do
    parse_success_response(response_body)
  end

  defp handle_fcm_response({:ok, 400, _headers, body}) do
    error = parse_error(body)
    Logger.warning("fcm_bad_request", error: inspect(error))
    {:error, error}
  end

  defp handle_fcm_response({:ok, 401, _headers, _body}), do: {:error, :unauthorized}
  defp handle_fcm_response({:ok, 403, _headers, _body}), do: {:error, :forbidden}
  defp handle_fcm_response({:ok, 404, _headers, _body}), do: {:error, :not_found}
  defp handle_fcm_response({:ok, 429, _headers, _body}), do: {:error, :quota_exceeded}

  defp handle_fcm_response({:ok, status, _headers, body}) when status >= 500 do
    Logger.error("fcm_server_error", status: status, body: body)
    {:error, :unavailable}
  end

  defp handle_fcm_response({:error, reason}) do
    Logger.error("fcm_connection_error", reason: inspect(reason))
    {:error, :connection_failed}
  end

  defp parse_success_response(response_body) do
    case Jason.decode(response_body) do
      {:ok, %{"name" => name}} -> {:ok, name |> String.split("/") |> List.last()}
      _ -> {:ok, "sent"}
    end
  end

  defp error_code_to_atom(404), do: :not_found
  defp error_code_to_atom(400), do: :invalid_argument
  defp error_code_to_atom(401), do: :unauthorized
  defp error_code_to_atom(403), do: :forbidden
  defp error_code_to_atom(429), do: :quota_exceeded
  defp error_code_to_atom(_), do: :unknown_error
end
