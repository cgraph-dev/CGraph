defmodule CGraph.Gamification.CurrencySystem do
  @moduledoc """
  Handles generic currency operations (add/deduct) for the gamification system.

  For coin-specific transactions with logging, see `CGraph.Gamification.award_coins/4`
  and `CGraph.Gamification.spend_coins/4`.
  """

  alias CGraph.Accounts.User
  alias CGraph.Repo

  @doc "Add currency to a user's account."
  @spec add_currency(User.t() | String.t(), pos_integer(), atom()) :: {:ok, User.t()} | {:error, term()}
  def add_currency(%User{} = user, amount, currency_type) when amount > 0 do
    case currency_type do
      :coins ->
        user |> Ecto.Changeset.change(%{coins: user.coins + amount}) |> Repo.update()

      _ ->
        {:error, :invalid_currency_type}
    end
  end

  def add_currency(user_id, amount, currency_type) when is_binary(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> add_currency(user, amount, currency_type)
    end
  end

  @doc "Deduct currency from a user's account."
  @spec deduct_currency(User.t() | String.t(), pos_integer(), atom()) :: {:ok, User.t()} | {:error, term()}
  def deduct_currency(%User{} = user, amount, currency_type) when amount > 0 do
    case currency_type do
      :coins when user.coins >= amount ->
        user |> Ecto.Changeset.change(%{coins: user.coins - amount}) |> Repo.update()

      :coins ->
        {:error, :insufficient_funds}

      _ ->
        {:error, :invalid_currency_type}
    end
  end

  def deduct_currency(user_id, amount, currency_type) when is_binary(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> deduct_currency(user, amount, currency_type)
    end
  end
end
