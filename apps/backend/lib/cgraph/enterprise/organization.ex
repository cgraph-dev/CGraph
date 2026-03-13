defmodule CGraph.Enterprise.Organization do
  @moduledoc """
  Enterprise organization schema.

  Organizations group users under a shared subscription and settings.
  Enterprise users login through the same web/mobile app — no separate portal.
  Groups can optionally belong to an organization via optional org_id FK.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder,
           only: [
             :id, :name, :slug, :subscription_tier, :logo_url,
             :max_members, :inserted_at, :updated_at
           ]}

  @type t :: %__MODULE__{}

  schema "enterprise_organizations" do
    field :name, :string
    field :slug, :string
    field :subscription_tier, Ecto.Enum, values: [:free, :premium, :enterprise], default: :free
    field :logo_url, :string
    field :max_members, :integer, default: 50
    field :deleted_at, :utc_datetime

    belongs_to :owner, CGraph.Accounts.User
    has_one :settings, CGraph.Enterprise.OrgSettings, foreign_key: :org_id
    has_many :memberships, CGraph.Enterprise.OrgMembership, foreign_key: :org_id
    has_many :sso_providers, CGraph.Enterprise.SSOProvider, foreign_key: :org_id
    has_many :groups, CGraph.Groups.Group, foreign_key: :org_id

    timestamps()
  end

  @doc "Create a new organization."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(org, attrs) do
    org
    |> cast(attrs, [:name, :owner_id, :subscription_tier, :logo_url, :max_members])
    |> validate_required([:name, :owner_id])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_number(:max_members, greater_than: 0, less_than_or_equal_to: 100_000)
    |> generate_slug()
    |> unique_constraint(:slug)
    |> foreign_key_constraint(:owner_id)
  end

  @doc "Update organization settings."
  @spec update_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def update_changeset(org, attrs) do
    org
    |> cast(attrs, [:name, :subscription_tier, :logo_url, :max_members])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_number(:max_members, greater_than: 0, less_than_or_equal_to: 100_000)
  end

  @doc "Transfer ownership to a new user."
  @spec transfer_ownership_changeset(%__MODULE__{}, String.t()) :: Ecto.Changeset.t()
  def transfer_ownership_changeset(org, new_owner_id) do
    change(org, owner_id: new_owner_id)
  end

  defp generate_slug(changeset) do
    case get_change(changeset, :name) do
      nil ->
        changeset

      name ->
        base_slug = Slug.slugify(name, lowercase: true)
        unique_suffix = :crypto.strong_rand_bytes(4) |> Base.encode16(case: :lower)
        put_change(changeset, :slug, "#{base_slug}-#{unique_suffix}")
    end
  end
end
