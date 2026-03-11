defmodule CGraph.Cosmetics do
  @moduledoc """
  The Cosmetics context.

  Provides unified inventory operations for all cosmetic item types:
  badges, nameplates, profile effects, profile frames, name styles,
  borders, titles, and chat effects.

  Delegates rarity logic to `CGraph.Cosmetics.Rarity`.
  """

  import Ecto.Query, warn: false

  alias CGraph.Cosmetics.{Badge, Inventory, Nameplate, NameplateSetting, Rarity}
  alias CGraph.Repo

  # ==================== INVENTORY ====================

  @doc """
  Lists all inventory items for a user.

  ## Options

    * `:item_type` — filter by cosmetic category (e.g. "badge", "nameplate")
    * `:equipped` — when `true`, returns only equipped items
    * `:limit` — max number of items to return (default: 100)
    * `:offset` — pagination offset (default: 0)
  """
  @spec list_user_inventory(String.t(), keyword()) :: [Inventory.t()]
  def list_user_inventory(user_id, opts \\ []) do
    item_type = Keyword.get(opts, :item_type)
    equipped = Keyword.get(opts, :equipped)
    limit = Keyword.get(opts, :limit, 100)
    offset = Keyword.get(opts, :offset, 0)

    query =
      from(i in Inventory,
        where: i.user_id == ^user_id,
        order_by: [desc: i.obtained_at],
        limit: ^limit,
        offset: ^offset
      )

    query = if item_type, do: from(i in query, where: i.item_type == ^item_type), else: query

    query =
      if equipped == true,
        do: from(i in query, where: not is_nil(i.equipped_at)),
        else: query

    Repo.all(query)
  end

  @doc """
  Equips a cosmetic item for a user.

  Validates that the user owns the item before equipping.
  Unequips any previously equipped item of the same type.
  Broadcasts a PubSub event on success.
  """
  @spec equip_item(String.t(), String.t(), String.t()) ::
          {:ok, Inventory.t()} | {:error, atom() | String.t()}
  def equip_item(user_id, item_type, item_id) do
    case get_inventory_entry(user_id, item_type, item_id) do
      nil ->
        {:error, :not_owned}

      %Inventory{equipped_at: equipped_at} when not is_nil(equipped_at) ->
        {:error, :already_equipped}

      entry ->
        Repo.transaction(fn ->
          # Unequip any currently equipped item of the same type
          from(i in Inventory,
            where:
              i.user_id == ^user_id and
                i.item_type == ^item_type and
                not is_nil(i.equipped_at)
          )
          |> Repo.update_all(set: [equipped_at: nil])

          # Equip the requested item
          {:ok, updated} =
            entry
            |> Inventory.equip_changeset(%{equipped_at: DateTime.utc_now()})
            |> Repo.update()

          broadcast_cosmetic_event(user_id, :item_equipped, %{
            item_type: item_type,
            item_id: item_id
          })

          updated
        end)
    end
  end

  @doc """
  Unequips a cosmetic item for a user.

  Validates that the user owns the item and it is currently equipped.
  Broadcasts a PubSub event on success.
  """
  @spec unequip_item(String.t(), String.t(), String.t()) ::
          {:ok, Inventory.t()} | {:error, atom() | String.t()}
  def unequip_item(user_id, item_type, item_id) do
    case get_inventory_entry(user_id, item_type, item_id) do
      nil ->
        {:error, :not_owned}

      %Inventory{equipped_at: nil} ->
        {:error, :not_equipped}

      entry ->
        {:ok, updated} =
          entry
          |> Inventory.equip_changeset(%{equipped_at: nil})
          |> Repo.update()

        broadcast_cosmetic_event(user_id, :item_unequipped, %{
          item_type: item_type,
          item_id: item_id
        })

        {:ok, updated}
    end
  end

  @doc """
  Grants a cosmetic item to a user.

  Checks for duplicate ownership before inserting. Performs a rarity
  manifest check to ensure the item is valid for the given type.

  ## Parameters

    * `user_id` — the user receiving the item
    * `item_type` — the cosmetic category (must be in Inventory.valid_item_types/0)
    * `item_id` — UUID of the specific cosmetic item
    * `obtained_via` — acquisition channel (must be in Inventory.valid_obtained_via/0)
  """
  @spec grant_item(String.t(), String.t(), String.t(), String.t()) ::
          {:ok, Inventory.t()} | {:error, Ecto.Changeset.t() | atom()}
  def grant_item(user_id, item_type, item_id, obtained_via) do
    # Check for duplicate ownership
    case get_inventory_entry(user_id, item_type, item_id) do
      %Inventory{} ->
        {:error, :already_owned}

      nil ->
        # Validate item exists and check rarity against manifest
        with :ok <- rarity_check(item_type, item_id) do
          %Inventory{}
          |> Inventory.changeset(%{
            user_id: user_id,
            item_type: item_type,
            item_id: item_id,
            obtained_at: DateTime.utc_now(),
            obtained_via: obtained_via
          })
          |> Repo.insert()
        end
    end
  end

  # ==================== BADGES ====================

  @doc "Lists all active badges."
  @spec list_badges(keyword()) :: [Badge.t()]
  def list_badges(opts \\ []) do
    category = Keyword.get(opts, :category)
    rarity = Keyword.get(opts, :rarity)

    query =
      from(b in Badge,
        where: b.is_active == true,
        order_by: [asc: b.sort_order, asc: b.name]
      )

    query = if category, do: from(b in query, where: b.category == ^category), else: query
    query = if rarity, do: from(b in query, where: b.rarity == ^rarity), else: query

    Repo.all(query)
  end

  @doc "Gets a single badge by ID."
  @spec get_badge(String.t()) :: Badge.t() | nil
  def get_badge(id), do: Repo.get(Badge, id)

  @doc "Lists badges owned by a user (via inventory)."
  @spec list_user_badges(String.t()) :: [map()]
  def list_user_badges(user_id) do
    from(i in Inventory,
      where: i.user_id == ^user_id and i.item_type == "badge",
      order_by: [desc: i.obtained_at]
    )
    |> Repo.all()
    |> Enum.map(fn inv ->
      badge = Repo.get(Badge, inv.item_id)

      %{
        inventory_id: inv.id,
        badge: badge,
        equipped_at: inv.equipped_at,
        obtained_at: inv.obtained_at,
        obtained_via: inv.obtained_via
      }
    end)
    |> Enum.reject(fn %{badge: b} -> is_nil(b) end)
  end

  # ==================== NAMEPLATES ====================

  @doc "Lists all active nameplates."
  @spec list_nameplates(keyword()) :: [Nameplate.t()]
  def list_nameplates(opts \\ []) do
    rarity = Keyword.get(opts, :rarity)

    query =
      from(n in Nameplate,
        where: n.is_active == true,
        order_by: [asc: n.sort_order, asc: n.name]
      )

    query = if rarity, do: from(n in query, where: n.rarity == ^rarity), else: query

    Repo.all(query)
  end

  @doc "Gets a single nameplate by ID."
  @spec get_nameplate(String.t()) :: Nameplate.t() | nil
  def get_nameplate(id), do: Repo.get(Nameplate, id)

  @doc "Lists nameplates owned by a user (via inventory)."
  @spec list_user_nameplates(String.t()) :: [map()]
  def list_user_nameplates(user_id) do
    from(i in Inventory,
      where: i.user_id == ^user_id and i.item_type == "nameplate",
      order_by: [desc: i.obtained_at]
    )
    |> Repo.all()
    |> Enum.map(fn inv ->
      nameplate = Repo.get(Nameplate, inv.item_id)

      %{
        inventory_id: inv.id,
        nameplate: nameplate,
        equipped_at: inv.equipped_at,
        obtained_at: inv.obtained_at,
        obtained_via: inv.obtained_via
      }
    end)
    |> Enum.reject(fn %{nameplate: n} -> is_nil(n) end)
  end

  @doc "Gets nameplate settings for a user."
  @spec get_nameplate_settings(String.t()) :: NameplateSetting.t() | nil
  def get_nameplate_settings(user_id) do
    Repo.get_by(NameplateSetting, user_id: user_id)
  end

  @doc "Updates nameplate settings for a user."
  @spec update_nameplate_settings(String.t(), map()) ::
          {:ok, NameplateSetting.t()} | {:error, Ecto.Changeset.t()}
  def update_nameplate_settings(user_id, attrs) do
    case get_nameplate_settings(user_id) do
      nil ->
        %NameplateSetting{}
        |> NameplateSetting.changeset(Map.put(attrs, "user_id", user_id))
        |> Repo.insert()

      setting ->
        setting
        |> NameplateSetting.changeset(attrs)
        |> Repo.update()
    end
  end

  # ==================== PRIVATE HELPERS ====================

  defp get_inventory_entry(user_id, item_type, item_id) do
    Repo.get_by(Inventory,
      user_id: user_id,
      item_type: item_type,
      item_id: item_id
    )
  end

  @doc false
  defp rarity_check(item_type, item_id) do
    schema = item_type_to_schema(item_type)

    if schema do
      case Repo.get(schema, item_id) do
        nil -> {:error, :item_not_found}
        item ->
          if Map.get(item, :rarity) in Rarity.string_values() do
            :ok
          else
            {:error, :invalid_rarity}
          end
      end
    else
      # For item types without a dedicated schema (e.g. border, title, chat_effect),
      # skip the rarity check — those go through legacy paths.
      :ok
    end
  end

  defp item_type_to_schema("badge"), do: Badge
  defp item_type_to_schema("nameplate"), do: Nameplate
  defp item_type_to_schema("profile_effect"), do: CGraph.Cosmetics.ProfileEffect
  defp item_type_to_schema("profile_frame"), do: CGraph.Cosmetics.ProfileFrame
  defp item_type_to_schema("name_style"), do: CGraph.Cosmetics.NameStyle
  defp item_type_to_schema(_), do: nil

  defp broadcast_cosmetic_event(user_id, event, payload) do
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "user:#{user_id}:cosmetics",
      {event, payload}
    )
  end
end
