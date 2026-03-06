defmodule CGraph.Messaging.ChatPollVote do
  @moduledoc """
  Schema for individual poll votes in chat polls.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "chat_poll_votes" do
    field :option_id, :string

    belongs_to :poll, CGraph.Messaging.ChatPoll
    belongs_to :user, CGraph.Accounts.User

    timestamps(updated_at: false)
  end

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:poll_id, :user_id, :option_id])
    |> validate_required([:poll_id, :user_id, :option_id])
    |> unique_constraint([:poll_id, :user_id, :option_id])
    |> foreign_key_constraint(:poll_id)
    |> foreign_key_constraint(:user_id)
  end
end
