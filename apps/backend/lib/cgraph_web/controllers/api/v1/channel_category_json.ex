defmodule CGraphWeb.API.V1.ChannelCategoryJSON do
  @moduledoc """
  JSON rendering for channel category responses.
  """
  alias CGraph.Groups.ChannelCategory

  @doc "Renders a list of resources as JSON."
  @spec index(map()) :: map()
  def index(%{categories: categories}) do
    %{data: Enum.map(categories, &category_data/1)}
  end

  @doc "Renders a single resource as JSON."
  @spec show(map()) :: map()
  def show(%{category: category}) do
    %{data: category_data(category)}
  end

  defp category_data(%ChannelCategory{} = category) do
    %{
      id: category.id,
      name: category.name,
      position: category.position,
      is_collapsed: category.is_collapsed,
      group_id: category.group_id,
      created_at: category.inserted_at,
      updated_at: category.updated_at
    }
  end
end
