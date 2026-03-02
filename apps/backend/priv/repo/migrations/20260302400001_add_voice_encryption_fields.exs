defmodule CGraph.Repo.Migrations.AddVoiceEncryptionFields do
  @moduledoc """
  Add E2EE metadata fields to voice_messages for encrypted waveform and duration.
  """
  use Ecto.Migration

  def change do
    alter table(:voice_messages) do
      add :encrypted_waveform, :text
      add :encrypted_duration, :text
      add :waveform_iv, :text
      add :duration_iv, :text
      add :metadata_encrypted_key, :text
      add :is_metadata_encrypted, :boolean, default: false
    end

    create index(:voice_messages, [:is_metadata_encrypted])
  end
end
