defmodule CGraph.WebRTC.LiveKitToken do
  @moduledoc """
  LiveKit JWT token generation using JOSE.

  Generates access tokens for LiveKit rooms with appropriate grants.
  LiveKit tokens are standard JWTs signed with HMAC-SHA256, containing
  video grant claims that control room access and capabilities.

  ## Token Structure

  - `iss` — API key (identifies the issuer)
  - `sub` — Participant identity
  - `iat` — Issued at timestamp
  - `exp` — Expiration timestamp
  - `nbf` — Not before timestamp
  - `jti` — Unique token ID
  - `video` — LiveKit video grant object

  ## Usage

      {:ok, token} = LiveKitToken.generate_token("my_room", "user_123")
      {:ok, token} = LiveKitToken.generate_token("my_room", "user_123", ttl: 3600)

  """

  require Logger

  @default_ttl 6 * 60 * 60  # 6 hours in seconds

  @doc """
  Generate a LiveKit access token.

  ## Parameters

  - `room_name` — The LiveKit room to grant access to
  - `participant_identity` — Unique identifier for the participant
  - `opts` — Options:
    - `:ttl` — Token time-to-live in seconds (default: 6 hours)
    - `:can_publish` — Allow publishing tracks (default: true)
    - `:can_subscribe` — Allow subscribing to tracks (default: true)
    - `:can_publish_data` — Allow publishing data messages (default: true)
    - `:name` — Display name for the participant
    - `:metadata` — Arbitrary metadata string

  ## Returns

  - `{:ok, token}` — JWT string
  - `{:error, reason}` — If config is missing or signing fails
  """
  @spec generate_token(String.t(), String.t(), keyword()) :: {:ok, String.t()} | {:error, term()}
  def generate_token(room_name, participant_identity, opts \\ []) do
    with {:ok, api_key} <- get_config(:api_key),
         {:ok, api_secret} <- get_config(:api_secret) do
      ttl = Keyword.get(opts, :ttl, @default_ttl)
      now = System.system_time(:second)

      video_grant = %{
        "roomJoin" => true,
        "room" => room_name,
        "canPublish" => Keyword.get(opts, :can_publish, true),
        "canSubscribe" => Keyword.get(opts, :can_subscribe, true),
        "canPublishData" => Keyword.get(opts, :can_publish_data, true)
      }

      claims = %{
        "iss" => api_key,
        "sub" => participant_identity,
        "iat" => now,
        "nbf" => now,
        "exp" => now + ttl,
        "jti" => generate_jti(),
        "video" => video_grant
      }

      # Add optional fields
      claims =
        claims
        |> maybe_put("name", Keyword.get(opts, :name))
        |> maybe_put("metadata", Keyword.get(opts, :metadata))

      # Sign with HMAC-SHA256
      jwk = JOSE.JWK.from_oct(api_secret)
      jws = %{"alg" => "HS256", "typ" => "JWT"}

      {_, token} =
        JOSE.JWT.sign(jwk, jws, claims)
        |> JOSE.JWS.compact()

      {:ok, token}
    end
  end

  @doc """
  Get the configured LiveKit WebSocket URL.
  """
  @spec get_url() :: String.t()
  def get_url do
    config()
    |> Keyword.get(:url, "ws://localhost:7880")
  end

  @doc """
  Check if LiveKit is configured (API key and secret are set).
  """
  @spec configured?() :: boolean()
  def configured? do
    config = config()
    api_key = Keyword.get(config, :api_key)
    api_secret = Keyword.get(config, :api_secret)
    is_binary(api_key) and api_key != "" and is_binary(api_secret) and api_secret != ""
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp get_config(key) do
    case Keyword.get(config(), key) do
      nil -> {:error, {:missing_config, key}}
      "" -> {:error, {:missing_config, key}}
      value -> {:ok, value}
    end
  end

  defp config do
    Application.get_env(:cgraph, CGraph.WebRTC.LiveKit, [])
  end

  defp generate_jti do
    :crypto.strong_rand_bytes(12) |> Base.url_encode64(padding: false)
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
