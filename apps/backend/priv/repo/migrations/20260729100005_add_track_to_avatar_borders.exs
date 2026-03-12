defmodule CGraph.Repo.Migrations.AddTrackToAvatarBorders do
  use Ecto.Migration

  def change do
    alter table(:avatar_borders) do
      add :track, :string
    end

    create index(:avatar_borders, [:track])

    execute("""
    UPDATE avatar_borders SET track = CASE theme
      WHEN '8bit' THEN 'shop'
      WHEN 'kawaii' THEN 'social'
      WHEN 'celestial' THEN 'forum'
      WHEN 'nature' THEN 'group'
      WHEN 'cyberpunk' THEN 'messaging'
      WHEN 'gothic' THEN 'security'
      WHEN 'minimal' THEN 'shop'
      WHEN 'holographic' THEN 'creator'
    END
    """)
  end
end
