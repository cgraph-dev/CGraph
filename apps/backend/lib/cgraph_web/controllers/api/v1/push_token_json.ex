defmodule CgraphWeb.API.V1.PushTokenJSON do
  @moduledoc """
  JSON rendering for push token responses.
  """

  def index(%{tokens: tokens}) do
    %{data: Enum.map(tokens, &token_data/1)}
  end

  def show(%{token: token}) do
    %{data: token_data(token)}
  end

  @doc """
  Render push token data.
  """
  def token_data(token) do
    %{
      id: token.id,
      platform: token.platform,
      device_id: token.device_id,
      is_active: Map.get(token, :is_active, true),
      last_used_at: Map.get(token, :last_used_at),
      registered: true,  # Indicates successful registration
      created_at: token.inserted_at,
      updated_at: token.updated_at
    }
  end
end
