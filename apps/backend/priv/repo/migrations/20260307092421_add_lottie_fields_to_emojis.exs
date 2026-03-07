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

    # Add lottie fields to group_custom_emojis table (Groups.CustomEmoji)
    alter table(:group_custom_emojis) do
      add :lottie_url, :string
      add :animation_format, :string
    end
  end
end
