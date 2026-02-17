defmodule CGraph.Forums.ContentReport do
  @moduledoc """
  Schema for content reports in forums (moderation queue items).

  Users can report posts, comments, or other users for violations.
  Reports appear in the forum's moderation queue for review.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @reasons ~w(spam harassment hate_speech misinformation nsfw other)
  @statuses ~w(pending reviewed resolved dismissed)
  @target_types ~w(post comment user)

  schema "content_reports" do
    belongs_to :reporter, CGraph.Accounts.User
    belongs_to :forum, CGraph.Forums.Forum
    belongs_to :reviewed_by, CGraph.Accounts.User

    field :target_type, :string
    field :target_id, :binary_id
    field :reason, :string
    field :description, :string
    field :status, :string, default: "pending"
    field :reviewed_at, :utc_datetime
    field :resolution_note, :string

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(report, attrs) do
    report
    |> cast(attrs, [:reporter_id, :forum_id, :target_type, :target_id, :reason, :description])
    |> validate_required([:forum_id, :target_type, :target_id, :reason])
    |> validate_inclusion(:reason, @reasons)
    |> validate_inclusion(:target_type, @target_types)
    |> foreign_key_constraint(:reporter_id)
    |> foreign_key_constraint(:forum_id)
  end

  @doc "Changeset for reviewing/resolving a report."
  def review_changeset(report, attrs) do
    report
    |> cast(attrs, [:status, :reviewed_by_id, :reviewed_at, :resolution_note])
    |> validate_required([:status, :reviewed_by_id, :reviewed_at])
    |> validate_inclusion(:status, @statuses)
  end

  def reasons, do: @reasons
  def statuses, do: @statuses
  def target_types, do: @target_types
end
