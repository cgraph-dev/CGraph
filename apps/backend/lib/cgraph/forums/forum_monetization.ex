defmodule CGraph.Forums.ForumMonetization do
  @moduledoc """
  Context module for forum monetization settings and tiers.
  Handles monetization mode (free/gated/hybrid) and tier CRUD.
  """

  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.Forums.Forum
  alias CGraph.Forums.ForumMonetizationTier

  @max_tiers 3

  @doc "Get monetization settings for a forum."
  def get_settings(forum_id) do
    forum = Repo.get!(Forum, forum_id)
    tiers = list_tiers(forum_id)
    %{type: forum.monetization_type, tiers: tiers}
  end

  @doc "Set monetization mode for a forum."
  def set_mode(forum_id, type) when type in ~w(free gated hybrid) do
    Forum
    |> Repo.get!(forum_id)
    |> Forum.monetization_changeset(%{monetization_type: type})
    |> Repo.update()
  end

  @doc "Create a monetization tier (max 3 per forum)."
  def create_tier(forum_id, attrs) do
    current_count =
      ForumMonetizationTier
      |> where(forum_id: ^forum_id)
      |> Repo.aggregate(:count)

    if current_count >= @max_tiers do
      {:error, :max_tiers_reached}
    else
      %ForumMonetizationTier{}
      |> ForumMonetizationTier.changeset(Map.put(attrs, "forum_id", forum_id))
      |> Repo.insert()
    end
  end

  @doc "Update an existing tier."
  def update_tier(tier_id, attrs) do
    ForumMonetizationTier
    |> Repo.get!(tier_id)
    |> ForumMonetizationTier.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete a tier."
  def delete_tier(tier_id) do
    ForumMonetizationTier
    |> Repo.get!(tier_id)
    |> Repo.delete()
  end

  @doc "List tiers for a forum, ordered by sort_order."
  def list_tiers(forum_id) do
    ForumMonetizationTier
    |> where(forum_id: ^forum_id)
    |> order_by(:sort_order)
    |> Repo.all()
  end
end
