defmodule Cgraph.Repo.Migrations.CreateE2eeAndVoiceMessages do
  @moduledoc """
  Create tables for End-to-End Encryption key management and voice messages.
  
  ## E2EE Tables
  
  - `e2ee_identity_keys` - Long-term Ed25519 identity keys
  - `e2ee_signed_prekeys` - Medium-term X25519 prekeys
  - `e2ee_one_time_prekeys` - One-time use prekeys for forward secrecy
  
  ## Voice Messages Table
  
  - `voice_messages` - Audio message metadata and waveform data
  """
  use Ecto.Migration

  def change do
    # =========================================================================
    # E2EE Identity Keys
    # =========================================================================
    
    create_if_not_exists table(:e2ee_identity_keys, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      
      add :public_key, :binary, null: false  # 32 bytes Ed25519 public key
      add :key_id, :string, null: false  # Fingerprint
      add :device_id, :string, null: false
      
      add :is_verified, :boolean, default: false
      add :verified_at, :utc_datetime_usec
      add :revoked_at, :utc_datetime_usec
      
      timestamps(type: :utc_datetime_usec)
    end
    
    create_if_not_exists unique_index(:e2ee_identity_keys, [:user_id, :device_id])
    create_if_not_exists index(:e2ee_identity_keys, [:user_id])
    create_if_not_exists index(:e2ee_identity_keys, [:key_id])
    
    # =========================================================================
    # E2EE Signed Prekeys
    # =========================================================================
    
    create_if_not_exists table(:e2ee_signed_prekeys, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :identity_key_id, references(:e2ee_identity_keys, type: :binary_id, on_delete: :delete_all), null: false
      
      add :public_key, :binary, null: false  # 32 bytes X25519 public key
      add :signature, :binary, null: false  # 64 bytes Ed25519 signature
      add :key_id, :integer, null: false
      
      add :is_current, :boolean, default: true
      add :expires_at, :utc_datetime_usec
      
      timestamps(type: :utc_datetime_usec)
    end
    
    create_if_not_exists index(:e2ee_signed_prekeys, [:user_id, :is_current])
    create_if_not_exists index(:e2ee_signed_prekeys, [:identity_key_id])
    
    # =========================================================================
    # E2EE One-Time Prekeys
    # =========================================================================
    
    create_if_not_exists table(:e2ee_one_time_prekeys, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      
      add :public_key, :binary, null: false  # 32 bytes X25519 public key
      add :key_id, :integer, null: false

      add :used_at, :utc_datetime_usec
      add :used_by_id, :binary_id  # User who consumed this prekey
      
      timestamps(type: :utc_datetime_usec)
    end
    
    create_if_not_exists unique_index(:e2ee_one_time_prekeys, [:user_id, :key_id])
    create_if_not_exists index(:e2ee_one_time_prekeys, [:user_id, :used_at])
    
    # =========================================================================
    # Voice Messages
    # =========================================================================
    
    create_if_not_exists table(:voice_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :message_id, references(:messages, type: :binary_id, on_delete: :nilify_all)
      
      # File information
      add :filename, :string, null: false
      add :original_filename, :string
      add :content_type, :string, null: false
      add :size, :integer, null: false
      add :url, :string
      
      # Audio metadata
      add :duration, :float
      add :sample_rate, :integer
      add :channels, :integer
      add :bitrate, :integer
      add :codec, :string
      
      # Visualization
      add :waveform, {:array, :float}, default: []
      
      # Optional transcription
      add :transcription, :text
      
      # Processing status
      add :is_processed, :boolean, default: false
      add :processing_error, :string
      
      timestamps(type: :utc_datetime_usec)
    end
    
    create_if_not_exists index(:voice_messages, [:user_id])
    create_if_not_exists index(:voice_messages, [:message_id])
    create_if_not_exists index(:voice_messages, [:is_processed])
  end
end
