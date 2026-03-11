defmodule CGraph.Cosmetics.NameplateSetting do
  @moduledoc """
  Schema for per-user nameplate customization settings.

  Stores user overrides for nameplate display — custom text color,
  border color, and layout preference. Each record links a user
  to a specific nameplate cosmetic item.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @valid_layouts ~w(default compact expanded minimal)

  schema "nameplate_settings" do
    field :custom_text_color, :string
    field :custom_border_color, :string
    field :layout, :string, default: "default"

    belongs_to :user, CGraph.Accounts.User
    belongs_to :nameplate, CGraph.Cosmetics.Inventory, foreign_key: :nameplate_id

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(setting, attrs) do
    setting
    |> cast(attrs, [:user_id, :nameplate_id, :custom_text_color, :custom_border_color, :layout])
    |> validate_required([:user_id, :nameplate_id])
    |> validate_inclusion(:layout, @valid_layouts)
    |> validate_format(:custom_text_color, ~r/^#[0-9a-fA-F]{6}$/, message: "must be a valid hex color")
    |> validate_format(:custom_border_color, ~r/^#[0-9a-fA-F]{6}$/, message: "must be a valid hex color")
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:nameplate_id)
    |> unique_constraint([:user_id, :nameplate_id])
  end
end
