defmodule CGraph.Announcements.AnnouncementDismissal do
  @moduledoc """
  Schema for tracking dismissed announcements per user.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Accounts.User
  alias CGraph.Forums.ForumAnnouncement

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "announcement_dismissals" do
    belongs_to :user, User
    belongs_to :announcement, ForumAnnouncement

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(user_id announcement_id)a

  def changeset(dismissal, attrs) do
    dismissal
    |> cast(attrs, @required_fields)
    |> validate_required(@required_fields)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:announcement_id)
    |> unique_constraint([:user_id, :announcement_id])
  end
end
