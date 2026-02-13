defmodule CGraph.Subscriptions.TierFeature do
  @moduledoc """
  Schema for granular feature flags per tier.

  This allows for fine-grained feature control beyond the boolean fields
  in TierLimit. Each feature can have its own configuration.

  ## Feature Keys

  Feature keys follow a dot-notation namespace:

  - `forums.*` - Forum-related features
  - `ai.*` - AI-related features
  - `messaging.*` - Messaging features
  - `gamification.*` - Game-related features

  ## Example

      %TierFeature{
        feature_key: "ai.moderation.toxicity",
        enabled: true,
        config: %{
          "threshold" => 0.85,
          "auto_action" => "hide"
        }
      }
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "tier_features" do
    field :feature_key, :string
    field :enabled, :boolean, default: true
    field :config, :map, default: %{}
    field :description, :string

    belongs_to :tier, CGraph.Subscriptions.TierLimit, foreign_key: :tier_id

    timestamps(type: :utc_datetime_usec)
  end

  @doc """
  Creates a changeset for a tier feature.
  """
  def changeset(feature, attrs) do
    feature
    |> cast(attrs, [:tier_id, :feature_key, :enabled, :config, :description])
    |> validate_required([:tier_id, :feature_key])
    |> validate_feature_key()
    |> unique_constraint([:tier_id, :feature_key])
  end

  defp validate_feature_key(changeset) do
    validate_change(changeset, :feature_key, fn :feature_key, key ->
      if String.contains?(key, ".") and String.length(key) <= 100 do
        []
      else
        [feature_key: "must be in dot notation (e.g., 'ai.moderation')"]
      end
    end)
  end
end
