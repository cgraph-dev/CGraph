defmodule CGraph.Messaging.LinkPreviewCache do
  @moduledoc """
  Ecto schema for caching link preview (Open Graph) metadata.

  Stores fetched OG metadata with a 7-day TTL to avoid
  redundant fetches for the same URL.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @timestamps_opts [type: :utc_datetime]

  @default_ttl_days 7

  schema "link_preview_cache" do
    field :url_hash, :string
    field :url, :string
    field :title, :string
    field :description, :string
    field :image_url, :string
    field :favicon_url, :string
    field :site_name, :string
    field :og_type, :string
    field :fetched_at, :utc_datetime
    field :expires_at, :utc_datetime

    timestamps()
  end

  @doc "Changeset for creating/updating a link preview cache entry."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(cache_entry, attrs) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    expires = DateTime.add(now, @default_ttl_days * 86_400, :second)

    cache_entry
    |> cast(attrs, [:url_hash, :url, :title, :description, :image_url, :favicon_url, :site_name, :og_type])
    |> validate_required([:url_hash, :url])
    |> validate_url_format()
    |> put_change(:fetched_at, now)
    |> put_change(:expires_at, expires)
    |> unique_constraint(:url_hash)
  end

  @doc "Returns true if the cache entry has expired."
  @spec expired?(%__MODULE__{}) :: boolean()
  def expired?(%__MODULE__{expires_at: expires_at}) do
    DateTime.compare(DateTime.utc_now(), expires_at) == :gt
  end

  @doc "Default TTL in days."
  def default_ttl_days, do: @default_ttl_days

  defp validate_url_format(changeset) do
    validate_change(changeset, :url, fn :url, url ->
      case URI.parse(url) do
        %URI{scheme: scheme} when scheme in ["http", "https"] -> []
        _ -> [url: "must be a valid HTTP or HTTPS URL"]
      end
    end)
  end
end
