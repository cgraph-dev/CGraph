defmodule CGraph.Forums.ScheduledPost do
  @moduledoc """
  Schema for scheduled forum posts.

  Posts can be scheduled for future publication. A cron worker checks
  for pending posts whose `scheduled_for` time has passed and publishes
  them atomically.

  ## Statuses
  - `"pending"` — waiting to be published
  - `"published"` — successfully published
  - `"cancelled"` — cancelled before publication
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @statuses ~w(pending published cancelled)

  @derive {Jason.Encoder,
           only: [:id, :content, :scheduled_for, :status, :inserted_at, :updated_at]}

  schema "forum_scheduled_posts" do
    field :content, :string
    field :scheduled_for, :utc_datetime
    field :status, :string, default: "pending"
    field :published_at, :utc_datetime

    belongs_to :author, CGraph.Accounts.User
    belongs_to :forum, CGraph.Forums.Forum

    timestamps()
  end

  @required_fields ~w(author_id forum_id content scheduled_for)a
  @optional_fields ~w(status published_at)a

  @doc "Changeset for creating or updating a scheduled post."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(scheduled_post, attrs) do
    scheduled_post
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, @statuses)
    |> validate_future_schedule()
    |> foreign_key_constraint(:author_id)
    |> foreign_key_constraint(:forum_id)
  end

  defp validate_future_schedule(changeset) do
    scheduled_for = get_field(changeset, :scheduled_for)

    cond do
      is_nil(scheduled_for) ->
        changeset

      get_field(changeset, :status) != "pending" ->
        changeset

      DateTime.compare(scheduled_for, DateTime.utc_now()) == :lt ->
        add_error(changeset, :scheduled_for, "must be in the future")

      true ->
        changeset
    end
  end
end
