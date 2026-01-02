defmodule CgraphWeb.API.V1.E2EEJSON do
  @moduledoc """
  JSON rendering for E2EE key management responses.
  
  Provides serialization for E2EE public keys, prekey bundles,
  and key verification data. Private keys are never rendered
  as they should never leave the client device.
  """

  @doc """
  Render key registration result.
  """
  def keys(%{result: result}) do
    %{
      data: %{
        identity_key_id: result.identity_key_id,
        signed_prekey_id: result.signed_prekey_id,
        one_time_prekeys_uploaded: result[:one_time_prekeys_uploaded] || 0
      }
    }
  end

  @doc """
  Render a prekey bundle for session establishment.
  
  This contains the public keys needed for X3DH key exchange.
  """
  def bundle(%{bundle: bundle}) do
    %{
      data: %{
        identity_key: bundle.identity_key,
        identity_key_id: bundle.identity_key_id,
        device_id: bundle.device_id,
        signed_prekey: bundle.signed_prekey,
        signed_prekey_id: bundle.signed_prekey_id,
        signed_prekey_signature: bundle.signed_prekey_signature,
        one_time_prekey: Map.get(bundle, :one_time_prekey),
        one_time_prekey_id: Map.get(bundle, :one_time_prekey_id)
      }
    }
  end

  @doc """
  Render prekey count status.
  """
  def prekey_count(%{count: count}) do
    %{
      data: %{
        count: count,
        should_upload: count < 25,
        recommended_upload: max(0, 100 - count)
      }
    }
  end

  @doc """
  Render prekey upload result.
  """
  def upload_result(%{uploaded: uploaded, total: total}) do
    %{
      data: %{
        uploaded: uploaded,
        total: total,
        should_upload: total < 25
      }
    }
  end

  @doc """
  Render safety number for key verification.
  
  The safety number is derived from both users' identity keys
  and should be compared out-of-band (phone call, in person)
  to verify key authenticity.
  """
  def safety_number(%{number: number, verified: verified}) do
    %{
      data: %{
        safety_number: format_safety_number(number),
        verified: verified,
        numeric: number
      }
    }
  end

  @doc """
  Render key verification status.
  """
  def verification(%{key_id: key_id, verified: verified, verified_at: verified_at}) do
    %{
      data: %{
        key_id: key_id,
        verified: verified,
        verified_at: verified_at
      }
    }
  end

  @doc """
  Render identity key details.
  """
  def identity_key(%{identity_key: key}) do
    %{
      data: %{
        key_id: key.key_id,
        device_id: key.device_id,
        public_key: Base.encode64(key.public_key),
        created_at: key.inserted_at,
        is_current: key.is_current
      }
    }
  end

  @doc """
  Render all devices with E2EE keys.
  """
  def devices(%{devices: devices}) do
    %{
      data: Enum.map(devices, fn device ->
        %{
          device_id: device.device_id,
          key_id: device.key_id,
          created_at: device.inserted_at,
          last_prekey_upload: device.last_prekey_upload
        }
      end)
    }
  end

  # Format safety number into readable blocks
  defp format_safety_number(number) when is_binary(number) do
    number
    |> String.graphemes()
    |> Enum.chunk_every(5)
    |> Enum.map(&Enum.join/1)
    |> Enum.join(" ")
  end
  defp format_safety_number(number) when is_integer(number) do
    number
    |> Integer.to_string()
    |> String.pad_leading(30, "0")
    |> format_safety_number()
  end
  defp format_safety_number(_), do: nil
end
