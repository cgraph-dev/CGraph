defmodule Cgraph.Moderation.Report do
  @moduledoc """
  Schema for user-submitted content reports.

  Reports track violations of community guidelines and Terms of Service.
  They flow through a moderation pipeline for review and action.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @report_categories ~w(
    csam
    terrorism
    violence_threat
    harassment
    hate_speech
    doxxing
    spam
    scam
    impersonation
    copyright
    nsfw_unlabeled
    self_harm
    other
  )a

  @target_types ~w(user message group forum post comment)a
  @statuses ~w(pending reviewing resolved dismissed)a
  @priorities ~w(critical high normal low)a

  schema "reports" do
    field :target_type, Ecto.Enum, values: @target_types
    field :target_id, :binary_id
    field :category, Ecto.Enum, values: @report_categories
    field :description, :string
    field :evidence_urls, {:array, :string}, default: []
    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :priority, Ecto.Enum, values: @priorities, default: :normal
    field :reviewed_at, :utc_datetime

    belongs_to :reporter, Cgraph.Accounts.User
    has_many :review_actions, Cgraph.Moderation.ReviewAction

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(target_type target_id category reporter_id)a
  @optional_fields ~w(description evidence_urls status priority reviewed_at)a

  @doc false
  def changeset(report, attrs) do
    report
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:category, @report_categories)
    |> validate_inclusion(:target_type, @target_types)
    |> validate_length(:description, max: 2000)
    |> validate_evidence_urls()
    |> foreign_key_constraint(:reporter_id)
  end

  defp validate_evidence_urls(changeset) do
    case get_change(changeset, :evidence_urls) do
      nil -> changeset
      urls when is_list(urls) ->
        if length(urls) > 10 do
          add_error(changeset, :evidence_urls, "cannot have more than 10 evidence URLs")
        else
          changeset
        end
      _ -> changeset
    end
  end
end
