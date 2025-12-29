defmodule CgraphWeb.API.V1.PushTokenController do
  @moduledoc """
  Handles push notification token registration.
  Users register their device tokens for receiving push notifications.
  """
  use CgraphWeb, :controller

  alias Cgraph.Notifications

  action_fallback CgraphWeb.FallbackController

  @doc """
  List user's registered push tokens.
  GET /api/v1/push_tokens
  """
  def index(conn, _params) do
    user = conn.assigns.current_user
    
    tokens = Notifications.list_push_tokens(user)
    render(conn, :index, tokens: tokens)
  end

  @doc """
  Register a new push token.
  POST /api/v1/push_tokens
  """
  def create(conn, params) do
    user = conn.assigns.current_user
    
    # Map user-friendly platform names to internal schema values
    # ios -> apns (Apple Push Notification Service)
    # android -> fcm (Firebase Cloud Messaging)
    # web -> web
    platform = case Map.get(params, "platform") do
      "ios" -> "apns"
      "android" -> "fcm"
      other -> other  # "web", "expo", or invalid (will be caught by validation)
    end
    
    # Use string keys to match Ecto changeset expectations
    token_params = %{
      "token" => Map.get(params, "token"),
      "platform" => platform,
      "device_id" => Map.get(params, "device_id"),
      "device_name" => Map.get(params, "device_name")
    }
    
    # Validate using original user input (ios, android, web)
    validation_params = %{
      token: Map.get(params, "token"), 
      platform: Map.get(params, "platform")
    }
    
    with :ok <- validate_token_params(validation_params),
         {:ok, push_token} <- Notifications.register_push_token(user, token_params) do
      conn
      |> put_status(:created)
      |> render(:show, token: push_token)
    end
  end

  @doc """
  Update a push token (e.g., refresh token).
  PUT /api/v1/push_tokens/:id
  """
  def update(conn, %{"id" => token_id} = params) do
    user = conn.assigns.current_user
    
    with {:ok, push_token} <- Notifications.get_push_token(user, token_id),
         {:ok, updated_token} <- Notifications.update_push_token(push_token, params) do
      render(conn, :show, token: updated_token)
    end
  end

  @doc """
  Delete/unregister a push token.
  DELETE /api/v1/push_tokens/:id or /api/v1/push_tokens/:token
  
  Supports both :id (UUID) and :token (actual token string) params.
  """
  def delete(conn, %{"id" => token_id}) do
    user = conn.assigns.current_user
    
    with {:ok, push_token} <- Notifications.get_push_token(user, token_id),
         {:ok, _} <- Notifications.delete_push_token(push_token) do
      send_resp(conn, :no_content, "")
    end
  end

  # Handle :token param (from routes using token string)
  def delete(conn, %{"token" => token_value}) do
    user = conn.assigns.current_user
    
    with {:ok, push_token} <- Notifications.get_push_token_by_value(user, token_value),
         {:ok, _} <- Notifications.delete_push_token(push_token) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Delete push token by device ID (useful for logout).
  DELETE /api/v1/push_tokens/device/:device_id
  """
  def delete_by_device(conn, %{"device_id" => device_id}) do
    user = conn.assigns.current_user
    
    with {:ok, _} <- Notifications.delete_push_token_by_device(user, device_id) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Test push notification to a specific token.
  POST /api/v1/push_tokens/:id/test
  """
  def test(conn, %{"id" => token_id}) do
    user = conn.assigns.current_user
    
    with {:ok, push_token} <- Notifications.get_push_token(user, token_id),
         {:ok, _} <- Notifications.send_test_notification(push_token) do
      json(conn, %{data: %{message: "Test notification sent"}})
    end
  end

  # Private helpers

  defp validate_token_params(%{token: token, platform: platform}) do
    cond do
      is_nil(token) or String.length(token) == 0 ->
        {:error, :token_required}
      
      platform not in ["ios", "android", "web"] ->
        {:error, :invalid_platform}
      
      true ->
        :ok
    end
  end
end
