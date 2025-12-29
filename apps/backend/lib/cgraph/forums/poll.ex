defmodule Cgraph.Forums.Poll do
  @moduledoc """
  Schema for post polls.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_polls" do
    belongs_to :post, Cgraph.Forums.Post

    field :question, :string
    field :options, {:array, :map}, default: []
    field :votes, :map, default: %{}
    field :is_multiple_choice, :boolean, default: false
    field :ends_at, :utc_datetime
    field :is_closed, :boolean, default: false
    
    timestamps()
  end

  def changeset(poll, attrs) do
    poll
    |> cast(attrs, [:post_id, :question, :options, :is_multiple_choice, :ends_at])
    |> validate_required([:post_id, :question, :options])
    |> validate_length(:question, max: 500)
    |> validate_options()
    |> foreign_key_constraint(:post_id)
  end

  defp validate_options(changeset) do
    case get_change(changeset, :options) do
      nil -> changeset
      options when length(options) < 2 ->
        add_error(changeset, :options, "must have at least 2 options")
      options when length(options) > 10 ->
        add_error(changeset, :options, "cannot have more than 10 options")
      _ -> changeset
    end
  end

  def vote_changeset(poll, user_id, option_indices) do
    current_votes = poll.votes || %{}
    new_votes = Map.put(current_votes, to_string(user_id), option_indices)
    change(poll, votes: new_votes)
  end

  def close_changeset(poll) do
    change(poll, is_closed: true)
  end
end
