defmodule CGraph.Discovery.PostMetric do
  @moduledoc "Schema for thread-level discovery metrics used in feed ranking."
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "post_metrics" do
    field :weighted_resonates, :decimal, default: 0
    field :reply_depth_avg, :decimal, default: 0
    field :read_time_signal, :decimal, default: 0
    field :cross_community_refs, :integer, default: 0

    belongs_to :thread, CGraph.Forums.Thread

    timestamps(type: :utc_datetime)
  end

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(metric, attrs) do
    metric
    |> cast(attrs, [:thread_id, :weighted_resonates, :reply_depth_avg, :read_time_signal, :cross_community_refs])
    |> validate_required([:thread_id])
    |> unique_constraint(:thread_id)
  end
end
