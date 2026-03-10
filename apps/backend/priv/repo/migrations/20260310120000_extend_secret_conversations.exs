defmodule CGraph.Repo.Migrations.ExtendSecretConversations do
  @moduledoc """
  Adds ghost mode, aliases, expiry, theme, and panic wipe fields to
  secret_conversations for Phase 29 (Secret Chat enhancements).
  """
  use Ecto.Migration

  def change do
    alter table(:secret_conversations) do
      add :expires_at, :utc_datetime_usec
      add :ghost_initiator, :boolean, default: false, null: false
      add :ghost_recipient, :boolean, default: false, null: false
      add :alias_initiator, :string, size: 50
      add :alias_recipient, :string, size: 50
      add :secret_theme_id, :string, size: 50
      add :panic_wipe_initiator, :boolean, default: false, null: false
      add :panic_wipe_recipient, :boolean, default: false, null: false
    end

    create index(:secret_conversations, [:expires_at],
      where: "expires_at IS NOT NULL AND status = 'active'",
      name: :secret_conversations_expiry_index
    )
  end
end
