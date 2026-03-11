defmodule CGraph.Cosmetics.Rarity do
  @moduledoc """
  Unified rarity tier system for all CGraph cosmetic items.

  Defines the canonical 7-tier rarity hierarchy used across avatar borders,
  chat effects, profile themes, titles, and all other cosmetic types.

  ## Tiers (lowest → highest)

      free → common → uncommon → rare → epic → legendary → mythic

  `unique`, `seasonal`, and `event` are **not** rarity tiers — they are
  source categories tracked via the `source` field on each cosmetic item.

  ## Usage

      iex> CGraph.Cosmetics.Rarity.tiers()
      [:free, :common, :uncommon, :rare, :epic, :legendary, :mythic]

      iex> CGraph.Cosmetics.Rarity.rank(:epic)
      4

      iex> CGraph.Cosmetics.Rarity.compare(:rare, :legendary)
      :lt
  """

  @tiers [:free, :common, :uncommon, :rare, :epic, :legendary, :mythic]
  @string_values Enum.map(@tiers, &Atom.to_string/1)
  @rank_map @tiers |> Enum.with_index() |> Map.new()
  @color_map %{
    free: "#9ca3af",
    common: "#a3a3a3",
    uncommon: "#22c55e",
    rare: "#3b82f6",
    epic: "#a855f7",
    legendary: "#f59e0b",
    mythic: "#ef4444"
  }

  @doc """
  Returns the canonical list of rarity tiers as atoms, ordered from lowest to highest.

  ## Examples

      iex> CGraph.Cosmetics.Rarity.tiers()
      [:free, :common, :uncommon, :rare, :epic, :legendary, :mythic]
  """
  @spec tiers() :: [atom()]
  def tiers, do: @tiers

  @doc """
  Returns the canonical list of rarity tiers as strings, ordered from lowest to highest.

  Intended for use with `Ecto.Changeset.validate_inclusion/3`.

  ## Examples

      iex> CGraph.Cosmetics.Rarity.string_values()
      ["free", "common", "uncommon", "rare", "epic", "legendary", "mythic"]
  """
  @spec string_values() :: [String.t()]
  def string_values, do: @string_values

  @doc """
  Returns the canonical list of rarity tiers as atoms.

  Alias for `tiers/0`.

  ## Examples

      iex> CGraph.Cosmetics.Rarity.atom_values()
      [:free, :common, :uncommon, :rare, :epic, :legendary, :mythic]
  """
  @spec atom_values() :: [atom()]
  def atom_values, do: @tiers

  @doc """
  Returns the hex color code associated with a rarity tier.

  Accepts both atom and string tier names.

  ## Examples

      iex> CGraph.Cosmetics.Rarity.color(:epic)
      "#a855f7"

      iex> CGraph.Cosmetics.Rarity.color("legendary")
      "#f59e0b"
  """
  @spec color(atom() | String.t()) :: String.t()
  def color(tier) when is_atom(tier), do: Map.fetch!(@color_map, tier)
  def color(tier) when is_binary(tier), do: color(String.to_existing_atom(tier))

  @doc """
  Returns the numeric rank (0-based) of a rarity tier.

  Higher rank = rarer. `free` is 0, `mythic` is 6.

  ## Examples

      iex> CGraph.Cosmetics.Rarity.rank(:free)
      0

      iex> CGraph.Cosmetics.Rarity.rank(:mythic)
      6

      iex> CGraph.Cosmetics.Rarity.rank("rare")
      3
  """
  @spec rank(atom() | String.t()) :: non_neg_integer()
  def rank(tier) when is_atom(tier), do: Map.fetch!(@rank_map, tier)
  def rank(tier) when is_binary(tier), do: rank(String.to_existing_atom(tier))

  @doc """
  Compares two rarity tiers, returning `:lt`, `:eq`, or `:gt`.

  ## Examples

      iex> CGraph.Cosmetics.Rarity.compare(:common, :epic)
      :lt

      iex> CGraph.Cosmetics.Rarity.compare(:mythic, :mythic)
      :eq

      iex> CGraph.Cosmetics.Rarity.compare(:legendary, :rare)
      :gt
  """
  @spec compare(atom() | String.t(), atom() | String.t()) :: :lt | :eq | :gt
  def compare(a, b) do
    rank_a = rank(a)
    rank_b = rank(b)

    cond do
      rank_a < rank_b -> :lt
      rank_a == rank_b -> :eq
      rank_a > rank_b -> :gt
    end
  end
end
