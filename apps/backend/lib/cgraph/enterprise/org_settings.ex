defmodule CGraph.Enterprise.OrgSettings do
  @moduledoc """
  Organization settings schema.

  Stores per-organization configuration including SSO settings,
  allowed email domains, feature flags, and branding (white-label).
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder,
           only: [
             :id, :sso_enabled, :allowed_domains, :default_role,
             :max_groups, :features, :branding, :data_region,
             :inserted_at, :updated_at
           ]}

  @type t :: %__MODULE__{}

  schema "enterprise_org_settings" do
    field :sso_enabled, :boolean, default: false
    field :allowed_domains, {:array, :string}, default: []
    field :default_role, :string, default: "member"
    field :max_groups, :integer, default: 10
    field :features, :map, default: %{}
    field :branding, :map, default: %{}
    field :data_region, :string, default: "us"

    belongs_to :organization, CGraph.Enterprise.Organization, foreign_key: :org_id

    timestamps()
  end

  @doc "Create or update org settings."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(settings, attrs) do
    settings
    |> cast(attrs, [
      :org_id, :sso_enabled, :allowed_domains, :default_role,
      :max_groups, :features, :branding, :data_region
    ])
    |> validate_required([:org_id])
    |> validate_inclusion(:default_role, ["owner", "admin", "member"])
    |> validate_number(:max_groups, greater_than: 0, less_than_or_equal_to: 1000)
    |> validate_inclusion(:data_region, ["us", "eu", "apac"])
    |> unique_constraint(:org_id)
    |> foreign_key_constraint(:org_id)
  end
end
