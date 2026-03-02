defmodule CGraphWeb.API.V1.ExploreJSON do
  @moduledoc """
  JSON rendering for the Explore API.

  Serializes community explore data for the unified discovery endpoint.
  """

  @doc "Renders the explore index response."
  @spec index(map()) :: map()
  def index(%{communities: communities, categories: categories}) do
    %{
      data: %{
        communities: Enum.map(communities, &community/1),
        categories: categories
      }
    }
  end

  defp community(c) do
    %{
      id: c.id,
      type: to_string(c.type),
      name: c.name,
      description: c.description,
      member_count: c.member_count,
      avatar_url: c.avatar_url,
      category: c.category,
      created_at: c.created_at,
      is_verified: c.is_verified
    }
  end
end
