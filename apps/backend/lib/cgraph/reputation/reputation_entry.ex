defmodule Cgraph.Reputation.ReputationEntry do
  @moduledoc """
  Schema for reputation entries (given/received).
  Maps to existing reputation_entries table with columns:
  from_user_id, to_user_id, value, post_id, forum_id, comment
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias Cgraph.Accounts.User
  alias Cgraph.Forums.Post
  alias Cgraph.Forums.Forum

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "reputation_entries" do
    # Maps to existing column names in database
    field :value, :integer, default: 1
    field :comment, :string

    belongs_to :from_user, User, foreign_key: :from_user_id
    belongs_to :to_user, User, foreign_key: :to_user_id
    belongs_to :post, Post
    belongs_to :forum, Forum

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(from_user_id to_user_id value)a
  @optional_fields ~w(comment post_id forum_id)a

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:comment, max: 500)
    |> validate_number(:value, greater_than_or_equal_to: -10, less_than_or_equal_to: 10)
    |> foreign_key_constraint(:from_user_id)
    |> foreign_key_constraint(:to_user_id)
    |> foreign_key_constraint(:post_id)
    |> foreign_key_constraint(:forum_id)
  end
end
