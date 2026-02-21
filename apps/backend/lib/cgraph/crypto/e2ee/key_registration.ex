defmodule CGraph.Crypto.E2EE.KeyRegistration do
  @moduledoc false

  import Ecto.Query

  require Logger

  alias CGraph.Crypto.E2EE.{IdentityKey, SignedPrekey, OneTimePrekey, KyberPrekey}
  alias CGraph.Repo

  @doc """
  Register or update a user's E2EE keys.

  Called when a user:
  - Installs the app for the first time
  - Adds a new device
  - Rotates their signed prekey
  - Uploads new one-time prekeys

  ## Parameters

  - `user_id` - User's ID
  - `keys` - Map containing:
    - `identity_key` - Base64 encoded Ed25519 public key
    - `device_id` - Unique device identifier
    - `signed_prekey` - Base64 encoded X25519 public key
    - `prekey_signature` - Base64 encoded signature
    - `prekey_id` - Integer ID for the signed prekey
    - `one_time_prekeys` - List of {key_id, base64_public_key} tuples
  """
  @spec register_keys(String.t(), map()) :: {:ok, map()} | {:error, term()}
  def register_keys(user_id, keys) do
    Repo.transaction(fn ->
      one_time_prekeys = keys["one_time_prekeys"] || keys[:one_time_prekeys] || []

      # Convert list of maps to list of tuples if needed
      prekeys_tuples = Enum.map(one_time_prekeys, fn
        {key_id, pk_b64} -> {key_id, pk_b64}
        %{"key_id" => key_id, "public_key" => pk_b64} -> {key_id, pk_b64}
        %{key_id: key_id, public_key: pk_b64} -> {key_id, pk_b64}
        other -> other
      end)

      with {:ok, identity_key} <- upsert_identity_key(user_id, keys),
           {:ok, signed_prekey} <- upsert_signed_prekey(user_id, identity_key, keys),
           {:ok, count} <- upload_one_time_prekeys(user_id, prekeys_tuples, identity_key.id),
           {:ok, kyber_result} <- upsert_kyber_prekey(user_id, keys, identity_key.id) do
        %{
          identity_key_id: identity_key.key_id,
          signed_prekey_id: if(signed_prekey, do: signed_prekey.key_id, else: nil),
          one_time_prekey_count: count,
          kyber_prekey_id: kyber_result
        }
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  @doc """
  Upload additional one-time prekeys.

  Called when the client's prekey count is low.
  """
  @spec upload_one_time_prekeys(String.t(), list(), String.t() | nil) :: {:ok, integer()} | {:error, term()}
  def upload_one_time_prekeys(user_id, prekeys, identity_key_id \\ nil)
  def upload_one_time_prekeys(_user_id, [], _identity_key_id), do: {:ok, 0}
  def upload_one_time_prekeys(user_id, prekeys, identity_key_id) when is_list(prekeys) do
    entries = Enum.map(prekeys, fn {key_id, public_key_b64} ->
      with {:ok, public_key} <- Base.decode64(public_key_b64) do
        %{
          id: Ecto.UUID.generate(),
          user_id: user_id,
          identity_key_id: identity_key_id,
          key_id: key_id,
          public_key: public_key,
          inserted_at: DateTime.utc_now(),
          updated_at: DateTime.utc_now()
        }
      end
    end)

    # Filter out any decode errors
    valid_entries = Enum.filter(entries, &is_map/1)

    if valid_entries == [] do
      {:error, :invalid_prekeys}
    else
      case Repo.insert_all(OneTimePrekey, valid_entries, on_conflict: :nothing) do
        {count, _} -> {:ok, count}
      end
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp upsert_identity_key(user_id, keys) do
    identity_key_b64 = keys["identity_key"] || keys[:identity_key]
    device_id = keys["device_id"] || keys[:device_id] || "default"

    case Base.decode64(identity_key_b64 || "") do
      {:ok, public_key} ->
        key_id = compute_key_fingerprint(public_key)
        attrs = %{user_id: user_id, public_key: public_key, key_id: key_id, device_id: device_id}
        upsert_identity_key_record(user_id, device_id, public_key, attrs)

      :error ->
        {:error, :invalid_key_format}
    end
  end

  defp upsert_identity_key_record(user_id, device_id, public_key, attrs) do
    case get_identity_key_by_device(user_id, device_id) do
      nil -> create_identity_key(attrs)
      existing -> update_identity_key_if_changed(existing, public_key, attrs)
    end
  end

  defp create_identity_key(attrs) do
    %IdentityKey{}
    |> IdentityKey.changeset(attrs)
    |> Repo.insert()
  end

  defp update_identity_key_if_changed(existing, public_key, _attrs) when existing.public_key == public_key do
    {:ok, existing}
  end
  defp update_identity_key_if_changed(existing, _public_key, attrs) do
    Logger.warning("identity_key_changed_for_user_device", attrs_user_id: attrs.user_id, attrs_device_id: attrs.device_id)

    existing
    |> IdentityKey.changeset(Map.put(attrs, :is_verified, false))
    |> Repo.update()
  end

  defp upsert_signed_prekey(user_id, identity_key, keys) do
    {public_key_b64, signature_b64, prekey_id} = extract_signed_prekey_fields(keys)
    insert_signed_prekey_if_valid(user_id, identity_key, public_key_b64, signature_b64, prekey_id)
  end

  defp extract_signed_prekey_fields(keys) do
    signed_prekey = get_signed_prekey_map(keys)

    public_key_b64 = get_field(signed_prekey, keys, ["public_key"], :signed_prekey)
    signature_b64 = get_field(signed_prekey, keys, ["signature"], :prekey_signature)
    prekey_id = get_prekey_id(signed_prekey, keys)

    {public_key_b64, signature_b64, prekey_id}
  end

  # If signed_prekey is a string (base64), return empty map (use fallback to flat keys)
  defp get_signed_prekey_map(keys) do
    value = keys["signed_prekey"] || keys[:signed_prekey]

    cond do
      is_map(value) -> value
      is_binary(value) -> %{}
      true -> %{}
    end
  end

  defp get_field(signed_prekey, keys, str_keys, fallback_atom) when is_map(signed_prekey) do
    Enum.find_value(str_keys, fn k -> Map.get(signed_prekey, k) end) ||
    Map.get(signed_prekey, hd(str_keys) |> String.to_existing_atom()) ||
    keys[fallback_atom]
  end
  defp get_field(_signed_prekey, keys, _str_keys, fallback_atom) do
    keys[fallback_atom]
  end

  defp get_prekey_id(signed_prekey, keys) do
    signed_prekey["key_id"] || signed_prekey[:key_id] || keys[:prekey_id] || :erlang.unique_integer([:positive])
  end

  defp insert_signed_prekey_if_valid(_user_id, _identity_key, nil, _sig, _prekey_id), do: {:ok, nil}
  defp insert_signed_prekey_if_valid(_user_id, _identity_key, _pk, nil, _prekey_id), do: {:ok, nil}
  defp insert_signed_prekey_if_valid(user_id, identity_key, pk_b64, sig_b64, prekey_id) do
    case {Base.decode64(pk_b64), Base.decode64(sig_b64)} do
      {{:ok, public_key}, {:ok, signature}} ->
        expire_current_prekeys(user_id)
        create_signed_prekey(user_id, identity_key, public_key, signature, prekey_id)

      _ ->
        {:error, :invalid_key_format}
    end
  end

  defp expire_current_prekeys(user_id) do
    from(k in SignedPrekey, where: k.user_id == ^user_id, where: k.is_current == true)
    |> Repo.update_all(set: [is_current: false])
  end

  defp create_signed_prekey(user_id, identity_key, public_key, signature, prekey_id) do
    attrs = %{
      user_id: user_id,
      identity_key_id: identity_key.id,
      public_key: public_key,
      signature: signature,
      key_id: prekey_id,
      is_current: true,
      expires_at: DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), 30, :day)
    }

    %SignedPrekey{}
    |> SignedPrekey.changeset(attrs)
    |> Repo.insert()
  end

  defp get_identity_key_by_device(user_id, device_id) do
    from(k in IdentityKey,
      where: k.user_id == ^user_id,
      where: k.device_id == ^device_id,
      where: is_nil(k.revoked_at)
    )
    |> Repo.one()
  end

  defp compute_key_fingerprint(public_key) do
    :crypto.hash(:sha256, public_key)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end

  # ============================================================================
  # Kyber (ML-KEM-768) Prekey Management
  # ============================================================================

  defp upsert_kyber_prekey(user_id, keys, identity_key_id) do
    kyber_prekey_b64 = keys["kyber_prekey"] || keys[:kyber_prekey]
    kyber_sig_b64 = keys["kyber_prekey_signature"] || keys[:kyber_prekey_signature]
    kyber_key_id = keys["kyber_prekey_id"] || keys[:kyber_prekey_id]

    # Optional — not all clients support PQ yet
    if kyber_prekey_b64 && kyber_sig_b64 && kyber_key_id do
      case {Base.decode64(kyber_prekey_b64), Base.decode64(kyber_sig_b64)} do
        {{:ok, public_key}, {:ok, signature}} ->
          # Expire current kyber prekeys for this user
          from(k in KyberPrekey,
            where: k.user_id == ^user_id,
            where: k.is_current == true
          )
          |> Repo.update_all(set: [is_current: false])

          attrs = %{
            user_id: user_id,
            identity_key_id: identity_key_id,
            public_key: public_key,
            signature: signature,
            key_id: kyber_key_id,
            is_current: true
          }

          case %KyberPrekey{} |> KyberPrekey.changeset(attrs) |> Repo.insert() do
            {:ok, kyber} -> {:ok, kyber.key_id}
            {:error, changeset} ->
              Logger.warning("failed_to_insert_kyber_prekey", changeset_errors: inspect(changeset.errors))
              {:ok, nil}
          end

        _ ->
          Logger.warning("Invalid Kyber prekey base64 format")
          {:ok, nil}
      end
    else
      # No Kyber prekey provided — normal for clients not yet supporting PQ
      {:ok, nil}
    end
  end
end
