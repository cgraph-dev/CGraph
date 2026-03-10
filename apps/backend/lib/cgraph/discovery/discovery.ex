defmodule CGraph.Discovery do
  @moduledoc """
  Discovery context — topics, user frequencies, feed ranking, and community health.

  This context is SEPARATE from CGraph.Forums. It adds ranked discovery feeds
  on top of the existing forum data without modifying the Forums context.
  """

  import Ecto.Query, warn: false

  alias CGraph.Discovery.{Topic, UserFrequency, Feed, CommunityHealth}
  alias CGraph.Repo
  alias CGraph.ReadRepo

  # ---------------------------------------------------------------------------
  # Topics
  # ---------------------------------------------------------------------------

  @doc "Lists all discovery topics."
  @spec list_topics() :: [Topic.t()]
  def list_topics do
    from(t in Topic, order_by: [asc: t.name])
    |> ReadRepo.all()
  end

  @doc "Gets a single topic by id."
  @spec get_topic(binary()) :: Topic.t() | nil
  def get_topic(id), do: ReadRepo.get(Topic, id)

  # ---------------------------------------------------------------------------
  # User Frequencies
  # ---------------------------------------------------------------------------

  @doc "Returns the current user's frequency weights."
  @spec get_user_frequencies(binary()) :: [UserFrequency.t()]
  def get_user_frequencies(user_id) do
    from(uf in UserFrequency,
      where: uf.user_id == ^user_id,
      preload: [:topic]
    )
    |> ReadRepo.all()
  end

  @doc "Upserts frequency weights for a user. Expects a list of %{topic_id, weight} maps."
  @spec update_frequencies(binary(), [map()]) :: {:ok, non_neg_integer()} | {:error, term()}
  def update_frequencies(user_id, entries) when is_list(entries) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    records =
      Enum.map(entries, fn %{"topic_id" => topic_id, "weight" => weight} ->
        %{
          user_id: user_id,
          topic_id: topic_id,
          weight: min(100, max(0, weight)),
          inserted_at: now,
          updated_at: now
        }
      end)

    {count, _} =
      Repo.insert_all(UserFrequency, records,
        on_conflict: {:replace, [:weight, :updated_at]},
        conflict_target: [:user_id, :topic_id]
      )

    {:ok, count}
  rescue
    e -> {:error, e}
  end

  # ---------------------------------------------------------------------------
  # Feed (delegates)
  # ---------------------------------------------------------------------------

  @doc "Returns ranked feed posts for the given mode."
  defdelegate list_feed(mode, opts \\ []), to: Feed

  @doc "Returns valid feed mode atoms."
  defdelegate valid_feed_modes(), to: Feed, as: :valid_modes

  # ---------------------------------------------------------------------------
  # Community Health (delegates)
  # ---------------------------------------------------------------------------

  @doc "Returns the health score for a community (cached)."
  defdelegate get_community_health(forum_id), to: CommunityHealth, as: :compute
end
