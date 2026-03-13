defmodule CGraph.Boosts do
  @moduledoc """
  Context for content boost operations.

  Manages creating, listing, cancelling, and expiring boosts.
  Boosts promote threads, posts, or forums with visibility,
  pin, or highlight effects paid via the nodes virtual currency.
  """

  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Boosts.{Boost, BoostEffect}

  # Nodes cost per hour by boost type
  @visibility_rate 50
  @pinned_rate 200
  @highlighted_rate 100

  @rates %{
    "visibility" => @visibility_rate,
    "pinned" => @pinned_rate,
    "highlighted" => @highlighted_rate
  }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Creates a boost for the given user.

  Calculates cost based on boost_type and duration_hours, debits nodes
  from the user's wallet, and creates the boost with its initial effect.
  """
  @spec create_boost(String.t(), map(), map()) ::
          {:ok, Boost.t()} | {:error, term()}
  def create_boost(user_id, attrs, _opts \\ %{}) do
    boost_type = Map.get(attrs, "boost_type") || Map.get(attrs, :boost_type)
    duration = Map.get(attrs, "duration_hours") || Map.get(attrs, :duration_hours)

    with {:ok, rate} <- get_rate(boost_type),
         {:ok, duration_int} <- parse_duration(duration),
         cost = rate * duration_int,
         {:ok, _wallet} <- debit_nodes(user_id, cost) do
      now = DateTime.utc_now() |> DateTime.truncate(:second)
      expires_at = DateTime.add(now, duration_int * 3600, :second)

      boost_attrs =
        attrs
        |> Map.new(fn {k, v} -> {to_string(k), v} end)
        |> Map.merge(%{
          "user_id" => user_id,
          "nodes_spent" => cost,
          "started_at" => now,
          "expires_at" => expires_at,
          "status" => "active"
        })

      Repo.transaction(fn ->
        case %Boost{} |> Boost.changeset(boost_attrs) |> Repo.insert() do
          {:ok, boost} ->
            effect_attrs = %{
              boost_id: boost.id,
              effect_type: boost_type,
              magnitude: Decimal.new(1),
              applied_at: now
            }

            {:ok, _effect} =
              %BoostEffect{} |> BoostEffect.changeset(effect_attrs) |> Repo.insert()

            Repo.preload(boost, :effects)

          {:error, changeset} ->
            Repo.rollback(changeset)
        end
      end)
    end
  end

  @doc """
  Lists active boosts for a user.
  """
  @spec list_active_boosts(String.t()) :: [Boost.t()]
  def list_active_boosts(user_id) do
    Boost
    |> where([b], b.user_id == ^user_id and b.status == "active")
    |> order_by([b], desc: b.inserted_at)
    |> preload(:effects)
    |> Repo.all()
  end

  @doc """
  Cancels a boost and refunds prorated remaining nodes.
  """
  @spec cancel_boost(String.t(), String.t()) ::
          {:ok, Boost.t()} | {:error, term()}
  def cancel_boost(user_id, boost_id) do
    case Repo.get_by(Boost, id: boost_id, user_id: user_id, status: "active") do
      nil ->
        {:error, :not_found}

      boost ->
        now = DateTime.utc_now() |> DateTime.truncate(:second)
        total_seconds = DateTime.diff(boost.expires_at, boost.started_at)
        elapsed_seconds = DateTime.diff(now, boost.started_at)
        remaining_ratio = max(0, (total_seconds - elapsed_seconds) / total_seconds)
        refund = trunc(boost.nodes_spent * remaining_ratio)

        Repo.transaction(fn ->
          {:ok, updated} =
            boost
            |> Boost.changeset(%{status: "cancelled"})
            |> Repo.update()

          if refund > 0, do: credit_nodes(user_id, refund)

          updated
        end)
    end
  end

  @doc """
  Expires all boosts past their expiry time.
  """
  @spec expire_boosts() :: {non_neg_integer(), nil | [term()]}
  def expire_boosts do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Boost
    |> where([b], b.status == "active" and b.expires_at <= ^now)
    |> Repo.update_all(set: [status: "expired", updated_at: now])
  end

  @doc """
  Exports boost history for a user (GDPR data export).
  """
  @spec export_user_boosts(String.t()) :: {:ok, list()}
  def export_user_boosts(user_id) do
    boosts =
      Boost
      |> where([b], b.user_id == ^user_id)
      |> order_by([b], desc: b.inserted_at)
      |> preload(:effects)
      |> Repo.all()
      |> Enum.map(fn b ->
        %{
          id: b.id,
          target_type: b.target_type,
          target_id: b.target_id,
          boost_type: b.boost_type,
          duration_hours: b.duration_hours,
          nodes_spent: b.nodes_spent,
          started_at: b.started_at,
          expires_at: b.expires_at,
          status: b.status
        }
      end)

    {:ok, boosts}
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp get_rate(boost_type) when is_binary(boost_type) do
    case Map.fetch(@rates, boost_type) do
      {:ok, rate} -> {:ok, rate}
      :error -> {:error, :invalid_boost_type}
    end
  end

  defp get_rate(_), do: {:error, :invalid_boost_type}

  defp parse_duration(hours) when is_integer(hours) and hours > 0, do: {:ok, hours}

  defp parse_duration(hours) when is_binary(hours) do
    case Integer.parse(hours) do
      {h, _} when h > 0 -> {:ok, h}
      _ -> {:error, :invalid_duration}
    end
  end

  defp parse_duration(_), do: {:error, :invalid_duration}

  defp debit_nodes(user_id, amount) do
    case function_exported?(CGraph.Nodes, :debit_nodes, 4) do
      true -> CGraph.Nodes.debit_nodes(user_id, amount, :boost_purchase, [])
      false -> {:ok, %{balance: 0}}
    end
  end

  defp credit_nodes(user_id, amount) do
    case function_exported?(CGraph.Nodes, :credit_nodes, 4) do
      true -> CGraph.Nodes.credit_nodes(user_id, amount, :boost_refund, [])
      false -> {:ok, %{balance: 0}}
    end
  end
end
