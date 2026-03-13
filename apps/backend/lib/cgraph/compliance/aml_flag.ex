defmodule CGraph.Compliance.AMLFlag do
  @moduledoc """
  Schema for AML (Anti-Money Laundering) suspicious activity flags.

  Records detected patterns of suspicious financial activity such as
  circular tipping, rapid volume transactions, and structuring attempts.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @type t :: %__MODULE__{}

  @severity_values ~w(low medium high)
  @status_values ~w(open reviewed dismissed escalated)

  schema "aml_flags" do
    belongs_to :user, CGraph.Accounts.User
    field :pattern_type, :string
    field :details, :map
    field :severity, :string
    field :status, :string, default: "open"
    field :reviewed_by, :binary_id
    field :reviewed_at, :utc_datetime

    timestamps()
  end

  @required ~w(user_id pattern_type severity)a
  @optional ~w(details status reviewed_by reviewed_at)a

  @doc false
  def changeset(flag, attrs) do
    flag
    |> cast(attrs, @required ++ @optional)
    |> validate_required(@required)
    |> validate_inclusion(:severity, @severity_values)
    |> validate_inclusion(:status, @status_values)
    |> foreign_key_constraint(:user_id)
  end
end
