defmodule CGraphWeb.API.V1.E2EEController do
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

  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Accounts.Friends
  alias CGraph.Crypto.E2EE
  alias CGraph.Crypto.E2EE.CrossSigning
  alias CGraph.Crypto.E2EE.KeySync
  alias CGraphWeb.ErrorHelpers

  action_fallback CGraphWeb.FallbackController

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
  @doc "Registers E2EE keys for the current device."
  @spec register_keys(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def register_keys(conn, params) do
    user = conn.assigns.current_user

    with :ok <- validate_base64_key(params["identity_key"], "identity_key", 32),
         :ok <- validate_base64_key(params["signed_prekey"], "signed_prekey", 32),
         :ok <- validate_base64_key(params["prekey_signature"], "prekey_signature", 64),
         :ok <- validate_device_id(params["device_id"]) do
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
          render_data(conn, result)

        {:error, :invalid_key_format} ->
          {:error, :unprocessable_entity, "Invalid key format"}

        {:error, reason} ->
          {:error, :internal_server_error, ErrorHelpers.safe_error_message(reason, context: "e2ee_register_keys")}
      end
    else
      {:error, field, message} ->
        {:error, :unprocessable_entity, "Invalid #{field}: #{message}"}
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
  @doc "Retrieves the prekey bundle for a user."
  @spec get_prekey_bundle(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_prekey_bundle(conn, %{"user_id" => user_id}) do
    case E2EE.get_prekey_bundle(user_id) do
      {:ok, bundle} ->
        render_data(conn, bundle)

      {:error, :no_identity_key} ->
        {:error, :not_found, "User has not registered E2EE keys"}

      {:error, :no_signed_prekey} ->
        {:error, :not_found, "User has not registered a signed prekey"}

      {:error, reason} ->
        {:error, :internal_server_error, ErrorHelpers.safe_error_message(reason, context: "e2ee_prekey_bundle")}
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
  @spec prekey_count(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def prekey_count(conn, _params) do
    user = conn.assigns.current_user
    count = E2EE.one_time_prekey_count(user.id)

    render_data(conn, %{
      count: count,
      should_upload: count < 25
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
  @doc "Uploads new one-time prekeys."
  @spec upload_prekeys(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def upload_prekeys(conn, %{"prekeys" => prekeys}) do
    user = conn.assigns.current_user
    parsed_prekeys = parse_prekey_list(prekeys)

    case E2EE.upload_one_time_prekeys(user.id, parsed_prekeys) do
      {:ok, count} ->
        total = E2EE.one_time_prekey_count(user.id)
        render_data(conn, %{uploaded: count, total: total})

      {:error, reason} ->
        {:error, :internal_server_error, ErrorHelpers.safe_error_message(reason, context: "e2ee_upload_prekeys")}
    end
  end

  @doc """
  Replenish one-time prekeys.

  Alias for upload_prekeys to match router.
  """
  @spec replenish_prekeys(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def replenish_prekeys(conn, params), do: upload_prekeys(conn, params)

  @doc """
  List all registered devices for the current user.

  ## Response

      {
        "data": [
          {
            "device_id": "device-001",
            "key_id": "fingerprint",
            "created_at": "2024-01-01T00:00:00Z"
          }
        ]
      }
  """
  @doc "Lists registered E2EE devices."
  @spec list_devices(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_devices(conn, _params) do
    user = conn.assigns.current_user

    case E2EE.list_user_devices(user.id) do
      {:ok, devices} ->
        render_data(conn, devices)

        # unreachable normally, but good for defensive coding?
        # warning said: "typing violation" because success is guaranteed by type
    end
  end

  @doc """
  Remove a device and its associated keys.

  Called when a user logs out from a device or wants to revoke its keys.
  """
  @spec remove_device(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def remove_device(conn, %{"device_id" => device_id}) do
    user = conn.assigns.current_user

    case E2EE.remove_device(user.id, device_id) do
      {:ok, _} ->
        render_data(conn, %{removed: true, device_id: device_id})

      {:error, :not_found} ->
        {:error, :not_found, "Device not found"}

      {:error, reason} ->
        {:error, :internal_server_error, ErrorHelpers.safe_error_message(reason, context: "e2ee_remove_device")}
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
  @doc "Generates a safety number for key verification."
  @spec safety_number(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def safety_number(conn, %{"user_id" => other_user_id}) do
    user = conn.assigns.current_user

    case E2EE.safety_number(user.id, other_user_id) do
      {:ok, number} ->
        render_data(conn, %{safety_number: number})

      {:error, :no_identity_key} ->
        {:error, :not_found, "One or both users have not registered E2EE keys"}

      {:error, reason} ->
        {:error, :internal_server_error, ErrorHelpers.safe_error_message(reason, context: "e2ee_safety_number")}
    end
  end

  @doc """
  Mark an identity key as verified.

  Called after users have verified each other's safety numbers.
  """
  @spec verify_key(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def verify_key(conn, %{"key_id" => key_id}) do
    user = conn.assigns.current_user

    case E2EE.verify_identity_key(user.id, key_id) do
      {:ok, key} ->
        render_data(conn, %{key_id: key.key_id, verified: true, verified_at: key.verified_at})

      {:error, :not_found} ->
        {:error, :not_found, "Key not found"}

      {:error, reason} ->
        {:error, :internal_server_error, ErrorHelpers.safe_error_message(reason, context: "e2ee_verify_key")}
    end
  end

  @doc """
  Revoke an identity key.

  Called when a device is lost or compromised.
  All contacts will be notified that the key changed.

  ## Security Architecture

  When a key is revoked, we MUST notify all contacts immediately so they:
  1. Stop encrypting messages for the compromised key
  2. Request fresh key bundles before sending new messages
  3. Update their local key stores

  This implements Forward Secrecy - a fundamental property used in modern
  guarantee. Without this notification, contacts would continue encrypting
  messages for an attacker's stolen device.
  """
  @doc "Revokes an E2EE key."
  @spec revoke_key(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def revoke_key(conn, %{"key_id" => key_id}) do
    user = conn.assigns.current_user

    case E2EE.revoke_identity_key(user.id, key_id) do
      {:ok, key} ->
        # CRITICAL: Notify ALL contacts, not just the user themselves
        # This is the key fix for the Forward Secrecy vulnerability
        notify_key_revocation(user.id, key.key_id, key.revoked_at)

        render_data(conn, %{key_id: key.key_id, revoked: true, revoked_at: key.revoked_at})

      {:error, :not_found} ->
        {:error, :not_found, "Key not found"}

      {:error, reason} ->
        {:error, :internal_server_error, ErrorHelpers.safe_error_message(reason, context: "e2ee_revoke_key")}
    end
  end

  # Notify all contacts that a user's key has been revoked
  # This ensures Forward Secrecy by preventing encryption to compromised keys
  defp notify_key_revocation(user_id, key_id, revoked_at) do
    # Get all friend IDs for the user
    friend_ids = Friends.get_accepted_friend_ids(user_id)

    payload = %{
      user_id: user_id,
      key_id: key_id,
      revoked_at: revoked_at
    }

    # Broadcast to each friend's personal UserChannel
    # They will receive "e2ee:key_revoked" event and drop the compromised key
    Enum.each(friend_ids, fn friend_id ->
      CGraphWeb.Endpoint.broadcast("user:#{friend_id}", "e2ee:key_revoked", payload)
    end)

    # Also notify the user's own devices (for multi-device sync)
    CGraphWeb.Endpoint.broadcast("user:#{user_id}", "e2ee:key_revoked", payload)

    # For users with many contacts, consider dispatching to Oban background job
    # to avoid blocking the HTTP response. For now, inline is fine for <1000 friends.
    :ok
  end

  # ============================================================================
  # Cross-Signing & Key Sync Endpoints
  # ============================================================================

  @doc """
  Cross-sign another device's identity key.

  Creates a cross-signature from the caller's device to the target device,
  establishing trust in the multi-device trust chain.

  ## Request Body

      {
        "signer_device_id": "uuid-of-signing-identity-key",
        "signature": "base64_encoded_signature",
        "algorithm": "ed25519"
      }

  ## Response

      {
        "data": {
          "status": "verified",
          "trust_chain": [...]
        }
      }
  """
  @spec cross_sign_device(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def cross_sign_device(conn, %{"device_id" => signed_device_id} = params) do
    user = conn.assigns.current_user
    signer_device_id = params["signer_device_id"]
    signature_b64 = params["signature"]
    algorithm = params["algorithm"] || "ed25519"

    with {:ok, signature} <- decode_base64(signature_b64, "signature") do
      case CrossSigning.create_cross_signature(signer_device_id, signed_device_id, user.id, signature, algorithm) do
        {:ok, _cross_sig} ->
          {:ok, trust_chain} = CrossSigning.get_device_trust_chain(user.id)

          render_data(conn, %{
            status: "verified",
            trust_chain: Enum.map(trust_chain, &format_cross_signature/1)
          })

        {:error, :device_not_found} ->
          {:error, :not_found, "One or both devices not found or not owned by current user"}

        {:error, :devices_not_same_user} ->
          {:error, :forbidden, "Both devices must belong to the same user"}

        {:error, changeset} ->
          {:error, :unprocessable_entity, format_changeset_errors(changeset)}
      end
    end
  end

  @doc """
  Get the device trust chain for the current user.

  Returns all cross-signatures showing which devices trust which,
  along with trust status for each device.

  ## Response

      {
        "data": {
          "devices": [
            {
              "device_id": "...",
              "identity_key_id": "...",
              "cross_signatures": [...],
              "is_trusted": true
            }
          ]
        }
      }
  """
  @spec device_trust_chain(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def device_trust_chain(conn, _params) do
    user = conn.assigns.current_user

    with {:ok, devices} <- E2EE.list_user_devices(user.id),
         {:ok, signatures} <- CrossSigning.get_device_trust_chain(user.id) do

      # Build trust info per device
      device_info = Enum.map(devices, fn device ->
        device_sigs = Enum.filter(signatures, fn sig ->
          sig.signed_device_id == device.identity_key_id || sig.signer_device_id == device.identity_key_id
        end)

        # A device is trusted if it has at least one verified cross-signature as signed_device
        is_trusted = Enum.any?(signatures, fn sig ->
          sig.signed_device_id == device.identity_key_id && sig.status == "verified"
        end)

        %{
          device_id: device.device_id,
          identity_key_id: device.identity_key_id,
          cross_signatures: Enum.map(device_sigs, &format_cross_signature/1),
          is_trusted: is_trusted
        }
      end)

      render_data(conn, %{devices: device_info})
    end
  end

  @doc """
  Send encrypted key material to another device for key sync.

  The server acts as a blind relay — it stores the encrypted package
  without inspecting or decrypting the contents.

  ## Request Body

      {
        "encrypted_key_material": "base64_encoded_ciphertext",
        "target_device_id": "uuid-of-target-identity-key"
      }

  ## Response

      {
        "data": {
          "package_id": "uuid",
          "status": "pending"
        }
      }
  """
  @spec sync_keys(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def sync_keys(conn, %{"device_id" => from_device_id} = params) do
    user = conn.assigns.current_user
    target_device_id = params["target_device_id"]
    material_b64 = params["encrypted_key_material"]

    with {:ok, encrypted_material} <- decode_base64(material_b64, "encrypted_key_material") do
      case KeySync.create_sync_package(from_device_id, target_device_id, user.id, encrypted_material) do
        {:ok, package} ->
          render_data(conn, %{
            package_id: package.id,
            status: package.status
          })

        {:error, :device_not_found} ->
          {:error, :not_found, "One or both devices not found or not owned by current user"}

        {:error, changeset} ->
          {:error, :unprocessable_entity, format_changeset_errors(changeset)}
      end
    end
  end

  @doc """
  Get pending sync packages for the current user's device.

  Returns encrypted key packages awaiting pickup. After retrieving,
  the client should decrypt locally and call mark_sync_complete.

  ## Query Parameters

    - `device_id` - The identity key UUID of the device requesting packages

  ## Response

      {
        "data": {
          "packages": [
            {
              "id": "uuid",
              "from_device_id": "uuid",
              "encrypted_key_material": "base64",
              "created_at": "2026-01-01T00:00:00Z"
            }
          ]
        }
      }
  """
  @spec get_sync_packages(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_sync_packages(conn, params) do
    user = conn.assigns.current_user
    device_id = params["device_id"]

    # Verify the device belongs to the current user
    case verify_device_ownership(device_id, user.id) do
      :ok ->
        {:ok, packages} = KeySync.get_pending_sync_packages(device_id)

        render_data(conn, %{
          packages: Enum.map(packages, fn pkg ->
            %{
              id: pkg.id,
              from_device_id: pkg.from_device_id,
              encrypted_key_material: Base.encode64(pkg.encrypted_key_material),
              created_at: pkg.inserted_at
            }
          end)
        })

      {:error, reason} ->
        {:error, :not_found, reason}
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

  # Key validation helpers — enforce base64 format and expected byte lengths
  defp validate_base64_key(nil, field, _expected_bytes),
    do: {:error, field, "is required"}

  defp validate_base64_key(value, field, expected_bytes) when is_binary(value) do
    case Base.decode64(value) do
      {:ok, decoded} when byte_size(decoded) == expected_bytes -> :ok
      {:ok, decoded} ->
        {:error, field,
         "decoded to #{byte_size(decoded)} bytes, expected #{expected_bytes}"}
      :error ->
        {:error, field, "is not valid base64"}
    end
  end

  defp validate_base64_key(_, field, _expected_bytes),
    do: {:error, field, "must be a string"}

  defp validate_device_id(nil), do: {:error, "device_id", "is required"}

  defp validate_device_id(device_id) when is_binary(device_id) do
    if String.length(device_id) in 1..255,
      do: :ok,
      else: {:error, "device_id", "must be 1-255 characters"}
  end

  defp validate_device_id(_), do: {:error, "device_id", "must be a string"}

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

  # Decode a base64 string, returning a friendly error on failure
  defp decode_base64(nil, field), do: {:error, :unprocessable_entity, "#{field} is required"}
  defp decode_base64(value, field) when is_binary(value) do
    case Base.decode64(value) do
      {:ok, decoded} -> {:ok, decoded}
      :error -> {:error, :unprocessable_entity, "#{field} is not valid base64"}
    end
  end
  defp decode_base64(_, field), do: {:error, :unprocessable_entity, "#{field} must be a string"}

  # Format a cross-signature for JSON response
  defp format_cross_signature(sig) do
    %{
      id: sig.id,
      signer_device_id: sig.signer_device_id,
      signed_device_id: sig.signed_device_id,
      algorithm: sig.algorithm,
      status: sig.status,
      created_at: sig.inserted_at
    }
  end

  # Format changeset errors into a readable string
  defp format_changeset_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
    |> Enum.map_join(", ", fn {k, v} -> "#{k}: #{Enum.join(v, ", ")}" end)
  end
  defp format_changeset_errors(error), do: ErrorHelpers.safe_error_message(error, context: "e2ee_changeset")

  # Verify that a device identity key belongs to the given user
  defp verify_device_ownership(nil, _user_id), do: {:error, "device_id is required"}
  defp verify_device_ownership(device_id, user_id) do
    import Ecto.Query
    alias CGraph.Crypto.E2EE.IdentityKey

    exists =
      from(k in IdentityKey,
        where: k.id == ^device_id,
        where: k.user_id == ^user_id,
        where: is_nil(k.revoked_at),
        select: count()
      )
      |> CGraph.Repo.one()

    if exists > 0, do: :ok, else: {:error, "Device not found or not owned by current user"}
  end
end
