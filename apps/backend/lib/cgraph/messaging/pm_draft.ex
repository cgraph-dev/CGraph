defmodule Cgraph.Messaging.PMDraft do
  @moduledoc """
  Schema for Private Message drafts.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias Cgraph.Accounts.User

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "pm_drafts" do
    field :subject, :string
    field :content, :string

    belongs_to :sender, User
    belongs_to :recipient, User

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(sender_id content)a
  @optional_fields ~w(subject recipient_id)a

  def changeset(draft, attrs) do
    draft
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:subject, max: 255)
    |> validate_length(:content, min: 1, max: 50_000)
    |> foreign_key_constraint(:sender_id)
    |> foreign_key_constraint(:recipient_id)
  end
end
