defmodule CGraph.Crypto.E2EE.KeyOperations do
  @moduledoc false

  import Ecto.Query

  alias CGraph.Crypto.E2EE.{IdentityKey, SignedPrekey, OneTimePrekey, KyberPrekey}
  alias CGraph.Repo

  @doc """
  Get a prekey bundle for establishing an E2EE session with a user.

  Returns the recipient's keys needed for X3DH key exchange:
  - Identity key
  - Signed prekey with signature
  - One one-time prekey (consumed and removed)

  If no one-time prekeys are available, the bundle is still valid
  but provides slightly weaker forward secrecy guarantees.
  """
  @spec get_prekey_bundle(String.t()) :: {:ok, map()} | {:error, term()}
  def get_prekey_bundle(user_id) do
    Repo.transaction(fn ->
      with {:ok, identity_key} <- get_current_identity_key(user_id),
           {:ok, signed_prekey} <- get_current_signed_prekey(user_id),
           one_time_prekey <- consume_one_time_prekey(user_id) do

        bundle = %{
          identity_key: Base.encode64(identity_key.public_key),
          identity_key_id: identity_key.key_id,
          device_id: identity_key.device_id,
          signed_prekey: Base.encode64(signed_prekey.public_key),
          signed_prekey_id: signed_prekey.key_id,
          signed_prekey_signature: Base.encode64(signed_prekey.signature)
        }

        # Add one-time prekey if available
        bundle = case one_time_prekey do
          nil -> bundle
          otpk -> Map.merge(bundle, %{
            one_time_prekey: Base.encode64(otpk.public_key),
            one_time_prekey_id: otpk.key_id
          })
        end

        # Add Kyber (ML-KEM-768) prekey if available (enables PQXDH)
        case get_current_kyber_prekey(user_id) do
          nil -> bundle
          kyber -> Map.merge(bundle, %{
            kyber_prekey: Base.encode64(kyber.public_key),
            kyber_prekey_id: kyber.key_id,
            kyber_prekey_signature: Base.encode64(kyber.signature)
          })
        end
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  @doc """
  Get the current (non-revoked) identity key for a user.

  Returns the identity key needed for E2EE message attribution.
  Used by the message controller to include sender's identity key
  in encrypted message metadata.
  """
  @spec get_user_identity_key(String.t()) :: {:ok, IdentityKey.t()} | {:error, term()}
  def get_user_identity_key(user_id) do
    get_current_identity_key(user_id)
  end

  @doc """
  Get the count of remaining one-time prekeys for a user.

  Clients should upload more prekeys when this count falls below 25.
  """
  @spec one_time_prekey_count(String.t()) :: integer()
  def one_time_prekey_count(user_id) do
    from(k in OneTimePrekey,
      where: k.user_id == ^user_id,
      where: is_nil(k.used_at),
      select: count()
    )
    |> Repo.one()
  end

  @doc """
  Verify a user's identity key.

  Called after users have verified each other's safety numbers.
  """
  @spec verify_identity_key(String.t(), String.t()) :: {:ok, IdentityKey.t()} | {:error, term()}
  def verify_identity_key(user_id, key_id) do
    from(k in IdentityKey,
      where: k.user_id == ^user_id,
      where: k.key_id == ^key_id
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      key ->
        key
        |> IdentityKey.changeset(%{is_verified: true, verified_at: DateTime.truncate(DateTime.utc_now(), :second)})
        |> Repo.update()
    end
  end

  @doc """
  Revoke an identity key.

  Called when a device is lost or compromised.
  """
  @spec revoke_identity_key(String.t(), String.t()) :: {:ok, IdentityKey.t()} | {:error, term()}
  def revoke_identity_key(user_id, key_id) do
    from(k in IdentityKey,
      where: k.user_id == ^user_id,
      where: k.key_id == ^key_id
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      key ->
        key
        |> IdentityKey.changeset(%{revoked_at: DateTime.truncate(DateTime.utc_now(), :second)})
        |> Repo.update()
    end
  end

  @doc """
  Generate a safety number for key verification.

  The safety number is derived from both users' identity keys.
  Users compare this number out-of-band to verify they're communicating securely.
  """
  @spec safety_number(String.t(), String.t()) :: {:ok, String.t()} | {:error, term()}
  def safety_number(user1_id, user2_id) do
    with {:ok, key1} <- get_current_identity_key(user1_id),
         {:ok, key2} <- get_current_identity_key(user2_id) do

      # Sort keys to ensure consistent ordering
      [k1, k2] = Enum.sort([key1.public_key, key2.public_key])

      # Hash the concatenated keys
      hash = :crypto.hash(:sha256, k1 <> k2)

      # Convert to displayable format (groups of 5 digits)
      number = hash
      |> :binary.bin_to_list()
      |> Enum.chunk_every(2)
      |> Enum.take(6)
      |> Enum.map_join(" ", fn [a, b] ->
        # Combine bytes and take last 5 digits
        n = a * 256 + b
        String.pad_leading(Integer.to_string(rem(n, 100_000)), 5, "0")
      end)

      {:ok, number}
    end
  end

  @doc """
  List all registered devices for a user.

  Returns a list of devices with their identity key information.
  """
  @spec list_user_devices(String.t()) :: {:ok, list(map())} | {:error, term()}
  def list_user_devices(user_id) do
    devices =
      from(k in IdentityKey,
        where: k.user_id == ^user_id,
        where: is_nil(k.revoked_at),
        select: %{
          device_id: k.device_id,
          key_id: k.key_id,
          identity_key_id: k.key_id,
          is_verified: k.is_verified,
          created_at: k.inserted_at
        },
        order_by: [desc: k.inserted_at]
      )
      |> Repo.all()

    {:ok, devices}
  end

  @doc """
  Remove a device and all its associated keys.

  This revokes the identity key and deletes associated prekeys.
  """
  @spec remove_device(String.t(), String.t()) :: {:ok, map()} | {:error, term()}
  def remove_device(user_id, device_id) do
    identity_key =
      from(k in IdentityKey,
        where: k.user_id == ^user_id,
        where: k.device_id == ^device_id
      )
      |> Repo.one()

    case identity_key do
      nil ->
        {:error, :not_found}

      key ->
        # Delete associated one-time prekeys for this device's identity key
        from(p in OneTimePrekey,
          where: p.identity_key_id == ^key.id or
                 (p.user_id == ^user_id and is_nil(p.identity_key_id))
        )
        |> Repo.delete_all()

        # Delete signed prekeys for this identity key
        from(p in SignedPrekey,
          where: p.identity_key_id == ^key.id
        )
        |> Repo.delete_all()

        # Delete Kyber prekeys for this device's identity key
        from(p in KyberPrekey,
          where: p.identity_key_id == ^key.id or
                 (p.user_id == ^user_id and is_nil(p.identity_key_id))
        )
        |> Repo.delete_all()

        # Delete the identity key
        Repo.delete(key)

        {:ok, %{device_id: device_id, removed: true}}
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp get_current_identity_key(user_id) do
    from(k in IdentityKey,
      where: k.user_id == ^user_id,
      where: is_nil(k.revoked_at),
      order_by: [desc: k.inserted_at],
      limit: 1
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :no_identity_key}
      key -> {:ok, key}
    end
  end

  defp get_current_signed_prekey(user_id) do
    from(k in SignedPrekey,
      where: k.user_id == ^user_id,
      where: k.is_current == true,
      order_by: [desc: k.inserted_at],
      limit: 1
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :no_signed_prekey}
      key -> {:ok, key}
    end
  end

  defp consume_one_time_prekey(user_id) do
    # Get and mark as used atomically
    from(k in OneTimePrekey,
      where: k.user_id == ^user_id,
      where: is_nil(k.used_at),
      order_by: [asc: k.key_id],
      limit: 1,
      lock: "FOR UPDATE SKIP LOCKED"
    )
    |> Repo.one()
    |> case do
      nil -> nil
      key ->
        key
        |> OneTimePrekey.changeset(%{used_at: DateTime.truncate(DateTime.utc_now(), :second)})
        |> Repo.update!()
    end
  end

  defp get_current_kyber_prekey(user_id) do
    from(k in KyberPrekey,
      where: k.user_id == ^user_id,
      where: k.is_current == true,
      where: is_nil(k.used_at),
      order_by: [desc: k.inserted_at],
      limit: 1
    )
    |> Repo.one()
  end
end
