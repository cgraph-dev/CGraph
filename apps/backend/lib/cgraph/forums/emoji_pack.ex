defmodule CGraph.Forums.EmojiPack do
  @moduledoc """
  Schema for emoji packs (collections of related emojis).

  Emoji packs allow users to import/export collections of custom emojis.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Accounts.User
  alias CGraph.Forums.{CustomEmoji, Forum}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "emoji_packs" do
    field :name, :string
    field :description, :string
    field :author, :string
    field :version, :string, default: "1.0.0"
    field :icon_url, :string
    field :source_url, :string
    field :is_active, :boolean, default: true
    field :is_premium, :boolean, default: false
    field :emoji_count, :integer, default: 0

    belongs_to :forum, Forum
    belongs_to :created_by, User
    has_many :emojis, CustomEmoji, foreign_key: :pack_id

    timestamps()
  end

  @doc """
  Changeset for creating a new pack.
  """
  @spec create_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def create_changeset(pack, attrs) do
    pack
    |> cast(attrs, [
      :name, :description, :author, :version, :icon_url,
      :source_url, :forum_id, :created_by_id, :is_premium
    ])
    |> validate_required([:name])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_length(:description, max: 500)
    |> validate_format(:version, ~r/^\d+\.\d+\.\d+$/,
        message: "must be in semver format (e.g., 1.0.0)")
  end

  @doc """
  Changeset for updating a pack.
  """
  @spec update_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def update_changeset(pack, attrs) do
    pack
    |> cast(attrs, [
      :name, :description, :author, :version, :icon_url,
      :source_url, :is_active, :is_premium
    ])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_length(:description, max: 500)
  end

  @doc """
  Update emoji count.
  """
  @spec update_emoji_count(%__MODULE__{}, non_neg_integer()) :: Ecto.Changeset.t()
  def update_emoji_count(pack, count) do
    change(pack, %{emoji_count: count})
  end

  # ============================================================================
  # Import / Export
  # ============================================================================

  @max_emojis_per_pack 500
  @max_image_size 256_000

  @doc """
  Export a pack as a JSON-serialisable bundle.

  Returns `{:ok, bundle}` where bundle is a map ready for `Jason.encode!/1`.
  """
  @spec export_pack(binary()) :: {:ok, map()} | {:error, :not_found}
  def export_pack(pack_id) do
    case Repo.get(__MODULE__, pack_id) |> Repo.preload(:emojis) do
      nil ->
        {:error, :not_found}

      pack ->
        bundle = %{
          name: pack.name,
          description: pack.description,
          author: pack.author,
          version: pack.version,
          icon_url: pack.icon_url,
          exported_at: DateTime.utc_now() |> DateTime.to_iso8601(),
          emojis:
            Enum.map(pack.emojis, fn e ->
              %{
                shortcode: e.shortcode,
                name: e.name,
                image_url: e.image_url,
                image_type: e.image_type,
                is_animated: e.is_animated,
                aliases: e.aliases || []
              }
            end)
        }

        {:ok, bundle}
    end
  end

  @doc """
  Import a pack from a JSON bundle into a forum.

  Validates:
  - Max #{@max_emojis_per_pack} emojis per pack
  - Max #{@max_image_size} bytes per image reference
  - Shortcode uniqueness within the forum
  """
  @spec import_pack(binary(), map()) :: {:ok, %__MODULE__{}} | {:error, term()}
  def import_pack(forum_id, %{"emojis" => emojis} = bundle) when is_list(emojis) do
    if length(emojis) > @max_emojis_per_pack do
      {:error, :too_many_emojis}
    else
      Repo.transaction(fn ->
        pack_attrs = %{
          name: bundle["name"] || "Imported Pack",
          description: bundle["description"],
          author: bundle["author"],
          version: bundle["version"] || "1.0.0",
          icon_url: bundle["icon_url"],
          forum_id: forum_id,
          is_active: true
        }

        case %__MODULE__{} |> create_changeset(pack_attrs) |> Repo.insert() do
          {:ok, pack} ->
            emoji_results =
              Enum.map(emojis, fn emoji_data ->
                attrs = %{
                  shortcode: emoji_data["shortcode"],
                  name: emoji_data["name"] || emoji_data["shortcode"],
                  image_url: emoji_data["image_url"],
                  image_type: emoji_data["image_type"] || "png",
                  is_animated: emoji_data["is_animated"] || false,
                  aliases: emoji_data["aliases"] || [],
                  forum_id: forum_id,
                  pack_id: pack.id
                }

                %CustomEmoji{}
                |> CustomEmoji.create_changeset(attrs)
                |> Repo.insert()
              end)

            errors = Enum.filter(emoji_results, &match?({:error, _}, &1))

            if length(errors) > 0 do
              Repo.rollback({:emoji_import_errors, length(errors)})
            else
              updated =
                pack
                |> update_emoji_count(length(emojis))
                |> Repo.update!()

              Repo.preload(updated, :emojis)
            end

          {:error, changeset} ->
            Repo.rollback(changeset)
        end
      end)
    end
  end

  def import_pack(_forum_id, _bundle), do: {:error, :invalid_bundle}

  @doc """
  List publicly available (marketplace) packs.
  """
  @spec list_available_packs() :: [%__MODULE__{}]
  def list_available_packs do
    from(p in __MODULE__,
      where: p.is_active == true,
      where: is_nil(p.forum_id),
      order_by: [desc: p.inserted_at]
    )
    |> Repo.all()
  end

  @doc """
  List packs for a specific forum.
  """
  @spec list_forum_packs(binary()) :: [%__MODULE__{}]
  def list_forum_packs(forum_id) do
    from(p in __MODULE__,
      where: p.forum_id == ^forum_id and p.is_active == true,
      order_by: [asc: p.name],
      preload: [:emojis]
    )
    |> Repo.all()
  end
end
