defmodule CGraphWeb.API.V1.CustomizationController do
  use CGraphWeb, :controller

  alias CGraph.Customizations

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/users/:id/customizations
  Fetches all customizations for a user.
  """
  def show(conn, %{"id" => user_id}) do
    with {:ok, customizations} <- Customizations.get_user_customizations(user_id) do
      render(conn, :show, customizations: customizations)
    end
  end

  @doc """
  PUT /api/v1/users/:id/customizations
  Updates all customizations for a user.
  """
  def update(conn, %{"id" => user_id} = params) do
    customization_params = Map.drop(params, ["id"])

    with {:ok, customizations} <- Customizations.update_user_customizations(user_id, customization_params) do
      render(conn, :show, customizations: customizations)
    end
  end

  @doc """
  PATCH /api/v1/users/:id/customizations
  Updates specific customization fields.
  """
  def patch(conn, %{"id" => user_id} = params) do
    customization_params = Map.drop(params, ["id"])

    with {:ok, customizations} <- Customizations.update_user_customizations(user_id, customization_params) do
      render(conn, :show, customizations: customizations)
    end
  end

  @doc """
  DELETE /api/v1/users/:id/customizations
  Resets customizations to defaults.
  """
  def delete(conn, %{"id" => user_id}) do
    with {:ok, _customizations} <- Customizations.delete_user_customizations(user_id),
         {:ok, new_customizations} <- Customizations.create_default_customizations(user_id) do
      render(conn, :show, customizations: new_customizations)
    end
  end
end
