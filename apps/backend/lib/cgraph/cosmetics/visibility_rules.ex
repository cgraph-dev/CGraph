defmodule CGraph.Cosmetics.VisibilityRules do
  @moduledoc """
  Filters and annotates cosmetic items with visibility/lock state.

  All items are visible to the user, but locked ones are shown as
  preview-only. Items with rarity >= legendary receive special
  `:locked_preview` treatment (visible but greyed out in the UI).

  ## Annotated Fields

    * `:state` — `:unlocked`, `:locked`, or `:locked_preview`
    * `:progress` — float 0.0–1.0 for locked items (0.0 when unknown)
  """

  import Ecto.Query, warn: false

  alias CGraph.Cosmetics.{Inventory, Rarity, UnlockEngine}
  alias CGraph.Repo

  @legendary_rank Rarity.rank(:legendary)

  @doc """
  Annotate each item with its visibility state for the given user.

  Returns the same list of items, each augmented with `:state` and
  `:progress` keys.
  """
  @spec filter_visible(list(map()), map()) :: list(map())
  def filter_visible(items, user) do
    owned_ids = get_owned_item_ids(user)

    Enum.map(items, fn item ->
      if MapSet.member?(owned_ids, item.id) do
        item |> Map.put(:state, :unlocked) |> Map.put(:progress, 1.0)
      else
        annotate_locked(item, user)
      end
    end)
  end

  # ── Private ───────────────────────────────────────────────────────────────

  defp get_owned_item_ids(user) do
    from(i in Inventory,
      where: i.user_id == ^user.id,
      select: i.item_id
    )
    |> Repo.all()
    |> MapSet.new()
  end

  defp annotate_locked(item, user) do
    rarity = Map.get(item, :rarity)
    high_rarity? = rarity != nil && Rarity.rank(rarity) >= @legendary_rank

    result = UnlockEngine.evaluate(user, item)

    {state, progress} =
      case result do
        :unlocked ->
          {:unlocked, 1.0}

        {:progress, p} ->
          {if(high_rarity?, do: :locked_preview, else: :locked), p}

        _other ->
          {if(high_rarity?, do: :locked_preview, else: :locked), 0.0}
      end

    item
    |> Map.put(:state, state)
    |> Map.put(:progress, progress)
  end
end
