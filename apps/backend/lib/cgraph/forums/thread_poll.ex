defmodule Cgraph.Forums.ThreadPoll do
  @moduledoc """
  Poll schema for thread polls (MyBB-style).
  
  Polls can be attached to threads and support:
  - Multiple choice (select multiple options)
  - Public/private voting
  - Optional closing date
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :question, :options, :is_multiple_choice, :max_options,
    :is_public, :closes_at, :total_votes, :inserted_at
  ]}

  schema "thread_polls" do
    field :question, :string
    field :options, {:array, :map}, default: []  # [{id, text, votes}]
    field :is_multiple_choice, :boolean, default: false
    field :max_options, :integer, default: 1
    field :is_public, :boolean, default: true
    field :closes_at, :utc_datetime
    field :total_votes, :integer, default: 0

    belongs_to :thread, Cgraph.Forums.Thread
    has_many :votes, Cgraph.Forums.PollVote, foreign_key: :poll_id

    timestamps()
  end

  def changeset(poll, attrs) do
    poll
    |> cast(attrs, [
      :question, :options, :is_multiple_choice, :max_options,
      :is_public, :closes_at, :thread_id
    ])
    |> validate_required([:question, :options, :thread_id])
    |> validate_length(:question, min: 3, max: 500)
    |> validate_options()
    |> validate_number(:max_options, greater_than: 0)
    |> unique_constraint(:thread_id)
    |> foreign_key_constraint(:thread_id)
  end

  defp validate_options(changeset) do
    case get_field(changeset, :options) do
      nil -> changeset
      options when is_list(options) ->
        if length(options) >= 2 do
          changeset
        else
          add_error(changeset, :options, "must have at least 2 options")
        end
      _ -> add_error(changeset, :options, "must be a list")
    end
  end

  @doc """
  Check if poll is still open for voting.
  """
  def open?(poll) do
    case poll.closes_at do
      nil -> true
      closes_at -> DateTime.compare(closes_at, DateTime.utc_now()) == :gt
    end
  end
end
