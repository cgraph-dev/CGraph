defmodule CgraphWeb.API.V1.CategoryJSON do
  @moduledoc """
  JSON rendering for category responses.
  """

  def index(%{categories: categories}) do
    %{data: Enum.map(categories, &category_data/1)}
  end

  def show(%{category: category}) do
    %{data: category_data(category)}
  end

  @doc """
  Render category data.
  """
  def category_data(category) do
    %{
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      icon: Map.get(category, :icon),
      position: category.position,
      forum_id: category.forum_id,
      post_count: Map.get(category, :post_count, 0),
      is_default: Map.get(category, :is_default, false),
      requires_flair: Map.get(category, :requires_flair, false),
      created_at: category.inserted_at,
      updated_at: category.updated_at
    }
  end
end
