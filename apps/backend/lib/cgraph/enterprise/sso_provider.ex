defmodule CGraph.Enterprise.SSOProvider do
  @moduledoc """
  SSO provider schema for enterprise organizations.

  Stores IdP configuration for SAML 2.0 and OIDC providers.
  Each provider belongs to an Organization (not a tenant).
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder,
           only: [:id, :name, :type, :enabled, :org_id, :inserted_at, :updated_at]}

  schema "enterprise_sso_providers" do
    field :name, :string
    field :type, Ecto.Enum, values: [:saml, :oidc]
    field :config, :map, default: %{}, redact: true
    field :enabled, :boolean, default: false

    belongs_to :organization, CGraph.Enterprise.Organization, foreign_key: :org_id

    timestamps()
  end

  @doc "Create or update an SSO provider."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(provider, attrs) do
    provider
    |> cast(attrs, [:name, :type, :config, :enabled, :org_id])
    |> validate_required([:name, :type, :org_id])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_config()
    |> foreign_key_constraint(:org_id)
  end

  defp validate_config(changeset) do
    case get_field(changeset, :type) do
      :saml ->
        validate_change(changeset, :config, fn :config, config ->
          if is_map(config) and Map.has_key?(config, "metadata_url") do
            []
          else
            [config: "SAML config requires metadata_url"]
          end
        end)

      :oidc ->
        validate_change(changeset, :config, fn :config, config ->
          required = ["client_id", "client_secret", "discovery_url"]
          missing = Enum.reject(required, &Map.has_key?(config, &1))

          if missing == [] do
            []
          else
            [config: "OIDC config requires: #{Enum.join(missing, ", ")}"]
          end
        end)

      _ ->
        changeset
    end
  end
end
