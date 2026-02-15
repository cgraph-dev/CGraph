defmodule CGraph.Forums.Categories do
  @moduledoc """
  Category management for forums.

  Categories help organize posts within a forum.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.Category
  alias CGraph.Repo

  @doc """
  List categories in a forum.
  """
  def list_categories(forum) do
    from(c in Category,
      where: c.forum_id == ^forum.id,
      order_by: [asc: c.position]
    )
    |> Repo.all()
  end

  @doc """
  Get a category by ID within a forum.
  """
  def get_category(forum, category_id) do
    query = from c in Category,
      where: c.id == ^category_id,
      where: c.forum_id == ^forum.id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      category -> {:ok, category}
    end
  end

  @doc """
  Create a category in a forum.
  """
  def create_category(forum, attrs) do
    %Category{}
    |> Category.changeset(attrs |> stringify_keys() |> Map.put("forum_id", forum.id))
    |> Repo.insert()
  end

  @doc """
  Update a category.
  """
  def update_category(category, attrs) do
    category
    |> Category.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a category.
  """
  def delete_category(category) do
    Repo.delete(category)
  end

  @doc """
  Reorder categories within a forum.
  """
  def reorder_categories(forum, category_ids) do
    Enum.with_index(category_ids)
    |> Enum.each(fn {category_id, index} ->
      from(c in Category, where: c.id == ^category_id and c.forum_id == ^forum.id)
      |> Repo.update_all(set: [position: index])
    end)

    {:ok, list_categories(forum)}
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
