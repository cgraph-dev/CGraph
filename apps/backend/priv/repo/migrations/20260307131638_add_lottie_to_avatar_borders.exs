defmodule CGraph.Repo.Migrations.AddLottieToAvatarBorders do
  use Ecto.Migration

  def change do
    alter table(:avatar_borders) do
      add :lottie_asset_id, references(:lottie_assets, type: :binary_id, on_delete: :nilify_all)
      add :lottie_url, :string
      add :lottie_config, :map, default: %{}
    end

    create index(:avatar_borders, [:lottie_asset_id])
    create index(:avatar_borders, [:animation_type], where: "animation_type = 'lottie'", name: :avatar_borders_lottie_type_idx)
  end
end
