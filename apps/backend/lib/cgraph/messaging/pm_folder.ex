defmodule CGraph.Messaging.PMFolder do
  @moduledoc """
  Schema for Private Message folders.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Accounts.User
  alias CGraph.Messaging.PrivateMessage

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "pm_folders" do
    field :name, :string
    field :color, :string, default: "#6366f1"
    field :icon, :string
    field :is_system, :boolean, default: false
    field :order, :integer, default: 0

    belongs_to :user, User

    has_many :messages, PrivateMessage, foreign_key: :folder_id

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(name user_id)a
  @optional_fields ~w(color icon is_system order)a

  def changeset(folder, attrs) do
    folder
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:name, min: 1, max: 50)
    |> foreign_key_constraint(:user_id)
  end
end
