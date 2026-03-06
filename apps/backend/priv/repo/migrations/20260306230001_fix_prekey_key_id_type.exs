defmodule CGraph.Repo.Migrations.FixPrekeyKeyIdType do
  use Ecto.Migration

  @moduledoc """
  Change key_id columns from integer to text on E2EE prekey tables.

  Clients send key_id as hex strings (e.g., "0cf621a494f94ba7") which are
  64-bit values that overflow PostgreSQL's 32-bit integer type. Using text
  is the most robust solution — it handles any client-generated identifier
  format without overflow or parsing issues.
  """

  def up do
    # OneTimePrekey — this is the one currently crashing in production
    alter table(:e2ee_one_time_prekeys) do
      modify :key_id, :text, from: :integer
    end

    # SignedPrekey — proactive fix for same issue
    alter table(:e2ee_signed_prekeys) do
      modify :key_id, :text, from: :integer
    end

    # KyberPrekey — proactive fix for same issue
    alter table(:e2ee_kyber_prekeys) do
      modify :key_id, :text, from: :integer
    end
  end

  def down do
    alter table(:e2ee_one_time_prekeys) do
      modify :key_id, :integer, from: :text
    end

    alter table(:e2ee_signed_prekeys) do
      modify :key_id, :integer, from: :text
    end

    alter table(:e2ee_kyber_prekeys) do
      modify :key_id, :integer, from: :text
    end
  end
end
