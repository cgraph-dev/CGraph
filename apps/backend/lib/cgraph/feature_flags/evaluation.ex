defmodule CGraph.FeatureFlags.Evaluation do
  @moduledoc """
  Flag evaluation engine for the feature flags system.

  Handles boolean, percentage-based, targeted, and variant flag evaluation
  with consistent user hashing for sticky assignments.
  """

  @doc """
  Evaluates a feature flag for a given user and options context.

  Returns `true` if the flag is enabled for the user, `false` otherwise.

  ## Flag types handled

  - `:boolean` — simple on/off
  - `:percentage` — enabled for a percentage of users based on consistent hash
  - `:targeted` — enabled for specific user IDs, tiers, or groups
  - `:variant` — always `true` (variant selection is done via `select_variant/2`)
  """
  @spec evaluate_flag(map(), String.t() | nil, keyword()) :: boolean()
  def evaluate_flag(%{enabled: false}, _user_id, _opts), do: false

  def evaluate_flag(%{type: :boolean, enabled: enabled}, _user_id, _opts), do: enabled

  def evaluate_flag(%{type: :percentage, percentage: pct, enabled: true}, user_id, _opts) do
    user_percentage(user_id) < pct
  end

  def evaluate_flag(%{type: :targeted, rules: rules, enabled: true}, user_id, opts) do
    user_tier = Keyword.get(opts, :user_tier)
    group_id = Keyword.get(opts, :group_id)

    cond do
      # Check user ID targeting
      user_id && user_id in Map.get(rules, :user_ids, []) -> true

      # Check tier targeting
      user_tier && user_tier in Map.get(rules, :user_tiers, []) -> true

      # Check group targeting
      group_id && group_id in Map.get(rules, :group_ids, []) -> true

      # Default: not targeted
      true -> false
    end
  end

  def evaluate_flag(%{type: :variant, enabled: true}, _user_id, _opts), do: true

  def evaluate_flag(_flag, _user_id, _opts), do: false

  @doc """
  Selects a variant for an A/B test flag using consistent hashing.

  Returns the variant name based on weighted distribution. Falls back
  to the first variant if the hash doesn't match any bucket.
  """
  @spec select_variant(map(), String.t() | nil) :: String.t() | nil
  def select_variant(%{variants: variants, weights: weights}, user_id) do
    # Use consistent hashing for sticky assignments
    hash = user_percentage(user_id)

    # Find the variant based on weighted distribution
    {_total, selected} =
      Enum.reduce_while(
        Enum.zip(variants, weights),
        {0, nil},
        fn {variant, weight}, {accumulated, _} ->
          new_accumulated = accumulated + weight
          if hash < new_accumulated do
            {:halt, {new_accumulated, variant}}
          else
            {:cont, {new_accumulated, nil}}
          end
        end
      )

    selected || List.first(variants)
  end

  @doc """
  Generate a consistent percentage (0-100) for a user.

  Uses `phash2` for even distribution and consistency.
  Returns a random value if `user_id` is nil.
  """
  @spec user_percentage(String.t() | nil) :: non_neg_integer()
  def user_percentage(nil), do: :rand.uniform(100)

  def user_percentage(user_id) do
    # FNV-1a hash for consistent distribution
    :erlang.phash2(to_string(user_id), 100)
  end
end
