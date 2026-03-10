defmodule CGraph.Repo.Migrations.AddLottieFieldsToEmojis do
  use Ecto.Migration

  def change do
    # Add lottie fields to custom_emojis table (Forums.CustomEmoji)
    alter table(:custom_emojis) do
      add :lottie_url, :string
      add :animation_format, :string
    end

    # Add lottie fields to group_emojis table (Groups.GroupEmoji)
    alter table(:group_emojis) do
      add :lottie_url, :string
      add :animation_format, :string
    end

    # group_custom_emojis was never created — skip if absent
    execute(
      "ALTER TABLE IF EXISTS group_custom_emojis ADD COLUMN IF NOT EXISTS lottie_url VARCHAR",
      "SELECT 1"
    )

    execute(
      "ALTER TABLE IF EXISTS group_custom_emojis ADD COLUMN IF NOT EXISTS animation_format VARCHAR",
      "SELECT 1"
    )
  end
end
