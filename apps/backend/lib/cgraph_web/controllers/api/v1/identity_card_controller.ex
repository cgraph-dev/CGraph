defmodule CGraphWeb.API.V1.IdentityCardController do
  @moduledoc """
  Controller for forum identity cards.

  Provides show (GET) and update (PUT) endpoints with ETS-based caching
  (5-minute TTL) for read-heavy identity card lookups.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Forums.IdentityCard
  alias CGraph.Repo

  import Ecto.Query

  action_fallback CGraphWeb.FallbackController

  @cache_table :identity_card_cache
  @cache_ttl_ms :timer.minutes(5)

  @doc """
  GET /api/v1/identity-cards/:user_id

  Returns the identity card for the given user. Serves from ETS cache
  when available (5-minute TTL).
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"user_id" => user_id}) do
    case cached_get(user_id) do
      {:ok, card} ->
        render_data(conn, card)

      :miss ->
        case fetch_identity_card(user_id) do
          nil ->
            render_error(conn, :not_found, "Identity card not found")

          card ->
            cache_put(user_id, card)
            render_data(conn, card)
        end
    end
  end

  @doc """
  PUT /api/v1/identity-cards

  Updates the current user's identity card. Creates one if it doesn't exist.
  Invalidates the cache on successful update.
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, params) do
    user = conn.assigns.current_user

    case fetch_identity_card(user.id) do
      nil ->
        attrs = Map.put(params, "user_id", user.id)

        %IdentityCard{}
        |> IdentityCard.changeset(attrs)
        |> Repo.insert()
        |> case do
          {:ok, card} ->
            cache_invalidate(user.id)
            render_data(conn, card)

          {:error, changeset} ->
            {:error, changeset}
        end

      card ->
        card
        |> IdentityCard.update_changeset(params)
        |> Repo.update()
        |> case do
          {:ok, updated} ->
            cache_invalidate(user.id)
            render_data(conn, updated)

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  # ---------------------------------------------------------------------------
  # ETS Cache helpers
  # ---------------------------------------------------------------------------

  defp ensure_table do
    case :ets.whereis(@cache_table) do
      :undefined ->
        :ets.new(@cache_table, [:set, :public, :named_table, read_concurrency: true])

      _ref ->
        @cache_table
    end
  end

  defp cached_get(user_id) do
    ensure_table()

    case :ets.lookup(@cache_table, user_id) do
      [{^user_id, card, inserted_at}] ->
        if System.monotonic_time(:millisecond) - inserted_at < @cache_ttl_ms do
          {:ok, card}
        else
          :ets.delete(@cache_table, user_id)
          :miss
        end

      [] ->
        :miss
    end
  end

  defp cache_put(user_id, card) do
    ensure_table()
    :ets.insert(@cache_table, {user_id, card, System.monotonic_time(:millisecond)})
  end

  defp cache_invalidate(user_id) do
    ensure_table()
    :ets.delete(@cache_table, user_id)
  end

  defp fetch_identity_card(user_id) do
    Repo.one(from(ic in IdentityCard, where: ic.user_id == ^user_id))
  end
end
