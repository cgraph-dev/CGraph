defmodule CgraphWeb.API.V1.E2EEController do
  @moduledoc """
  API controller for End-to-End Encryption key management.
  
  ## Endpoints
  
  - `POST /api/v1/e2ee/keys` - Register/update E2EE keys
  - `GET /api/v1/e2ee/keys/:user_id/bundle` - Get prekey bundle for user
  - `GET /api/v1/e2ee/keys/count` - Get remaining one-time prekey count
  - `POST /api/v1/e2ee/keys/prekeys` - Upload additional one-time prekeys
  - `GET /api/v1/e2ee/safety-number/:user_id` - Get safety number with user
  - `POST /api/v1/e2ee/keys/:key_id/verify` - Mark key as verified
  - `POST /api/v1/e2ee/keys/:key_id/revoke` - Revoke a compromised key
  
  ## Security Notes
  
  - Private keys NEVER leave the client device
  - Server only stores and distributes public keys
  - All message content is encrypted client-side before transmission
  """
  
  use CgraphWeb, :controller
  
  alias Cgraph.Crypto.E2EE
  
  action_fallback CgraphWeb.FallbackController
  
  plug :ensure_authenticated
  
  @doc """
  Register or update E2EE keys.
  
  Called when:
  - User installs the app for the first time
  - User adds a new device
  - User rotates their signed prekey
  - User uploads new one-time prekeys
  
  ## Request Body
  
      {
        "identity_key": "base64_encoded_ed25519_public_key",
        "device_id": "unique_device_identifier",
        "signed_prekey": "base64_encoded_x25519_public_key",
        "prekey_signature": "base64_encoded_signature",
        "prekey_id": 1,
        "one_time_prekeys": [
          [1, "base64_key1"],
          [2, "base64_key2"],
          ...
        ]
      }
  
  ## Response
  
      {
        "data": {
          "identity_key_id": "fingerprint",
          "signed_prekey_id": 1,
          "one_time_prekeys_uploaded": 100
        }
      }
  """
  def register_keys(conn, params) do
    user = conn.assigns.current_user
    
    keys = %{
      identity_key: params["identity_key"],
      device_id: params["device_id"],
      signed_prekey: params["signed_prekey"],
      prekey_signature: params["prekey_signature"],
      prekey_id: params["prekey_id"],
      one_time_prekeys: parse_prekey_list(params["one_time_prekeys"])
    }
    
    case E2EE.register_keys(user.id, keys) do
      {:ok, result} ->
        json(conn, %{data: result})
      
      {:error, :invalid_key_format} ->
        {:error, :unprocessable_entity, "Invalid key format"}
      
      {:error, reason} ->
        {:error, :internal_server_error, "Failed to register keys: #{inspect(reason)}"}
    end
  end
  
  @doc """
  Get prekey bundle for establishing an E2EE session.
  
  Called when Alice wants to send a message to Bob for the first time.
  Returns Bob's public keys needed for X3DH key exchange.
  
  ## Response
  
      {
        "data": {
          "identity_key": "base64_key",
          "identity_key_id": "fingerprint",
          "device_id": "device_id",
          "signed_prekey": "base64_key",
          "signed_prekey_id": 1,
          "signed_prekey_signature": "base64_signature",
          "one_time_prekey": "base64_key",  // Optional
          "one_time_prekey_id": 42          // Optional
        }
      }
  """
  def get_prekey_bundle(conn, %{"user_id" => user_id}) do
    case E2EE.get_prekey_bundle(user_id) do
      {:ok, bundle} ->
        json(conn, %{data: bundle})
      
      {:error, :no_identity_key} ->
        {:error, :not_found, "User has not registered E2EE keys"}
      
      {:error, :no_signed_prekey} ->
        {:error, :not_found, "User has not registered a signed prekey"}
      
      {:error, reason} ->
        {:error, :internal_server_error, inspect(reason)}
    end
  end
  
  @doc """
  Get count of remaining one-time prekeys.
  
  Clients should upload more prekeys when this falls below 25.
  
  ## Response
  
      {
        "data": {
          "count": 87,
          "should_upload": false
        }
      }
  """
  def prekey_count(conn, _params) do
    user = conn.assigns.current_user
    count = E2EE.one_time_prekey_count(user.id)
    
    json(conn, %{
      data: %{
        count: count,
        should_upload: count < 25
      }
    })
  end
  
  @doc """
  Upload additional one-time prekeys.
  
  Called when the client's prekey count is low.
  
  ## Request Body
  
      {
        "prekeys": [
          [101, "base64_key1"],
          [102, "base64_key2"],
          ...
        ]
      }
  """
  def upload_prekeys(conn, %{"prekeys" => prekeys}) do
    user = conn.assigns.current_user
    parsed_prekeys = parse_prekey_list(prekeys)
    
    case E2EE.upload_one_time_prekeys(user.id, parsed_prekeys) do
      {:ok, count} ->
        total = E2EE.one_time_prekey_count(user.id)
        json(conn, %{data: %{uploaded: count, total: total}})
      
      {:error, reason} ->
        {:error, :internal_server_error, inspect(reason)}
    end
  end
  
  @doc """
  Get safety number for key verification.
  
  The safety number is derived from both users' identity keys.
  Users compare this number (via call, in person, etc.) to verify
  they're communicating with the intended person.
  
  ## Response
  
      {
        "data": {
          "safety_number": "12345 67890 12345 67890 12345 67890"
        }
      }
  """
  def safety_number(conn, %{"user_id" => other_user_id}) do
    user = conn.assigns.current_user
    
    case E2EE.safety_number(user.id, other_user_id) do
      {:ok, number} ->
        json(conn, %{data: %{safety_number: number}})
      
      {:error, :no_identity_key} ->
        {:error, :not_found, "One or both users have not registered E2EE keys"}
      
      {:error, reason} ->
        {:error, :internal_server_error, inspect(reason)}
    end
  end
  
  @doc """
  Mark an identity key as verified.
  
  Called after users have verified each other's safety numbers.
  """
  def verify_key(conn, %{"key_id" => key_id}) do
    user = conn.assigns.current_user
    
    case E2EE.verify_identity_key(user.id, key_id) do
      {:ok, key} ->
        json(conn, %{data: %{key_id: key.key_id, verified: true, verified_at: key.verified_at}})
      
      {:error, :not_found} ->
        {:error, :not_found, "Key not found"}
      
      {:error, reason} ->
        {:error, :internal_server_error, inspect(reason)}
    end
  end
  
  @doc """
  Revoke an identity key.
  
  Called when a device is lost or compromised.
  All contacts will be notified that the key changed.
  """
  def revoke_key(conn, %{"key_id" => key_id}) do
    user = conn.assigns.current_user
    
    case E2EE.revoke_identity_key(user.id, key_id) do
      {:ok, key} ->
        # TODO: Notify contacts about key revocation
        json(conn, %{data: %{key_id: key.key_id, revoked: true, revoked_at: key.revoked_at}})
      
      {:error, :not_found} ->
        {:error, :not_found, "Key not found"}
      
      {:error, reason} ->
        {:error, :internal_server_error, inspect(reason)}
    end
  end
  
  # ============================================================================
  # Private Functions
  # ============================================================================
  
  defp ensure_authenticated(conn, _opts) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Authentication required"})
        |> halt()
      
      _user ->
        conn
    end
  end
  
  defp parse_prekey_list(nil), do: []
  defp parse_prekey_list(prekeys) when is_list(prekeys) do
    Enum.map(prekeys, fn
      [key_id, public_key] when is_integer(key_id) and is_binary(public_key) ->
        {key_id, public_key}
      
      %{"key_id" => key_id, "public_key" => public_key} ->
        {key_id, public_key}
      
      _ ->
        nil
    end)
    |> Enum.reject(&is_nil/1)
  end
  defp parse_prekey_list(_), do: []
end
