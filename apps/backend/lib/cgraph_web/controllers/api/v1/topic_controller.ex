defmodule CGraphWeb.API.V1.TopicController do
  @moduledoc "API controller for Discovery topics and user frequency weights."
  use CGraphWeb, :controller

  alias CGraph.Discovery

  action_fallback CGraphWeb.FallbackController

  @doc "GET /api/v1/topics — list all discovery topics."
  def index(conn, _params) do
    topics = Discovery.list_topics()

    conn
    |> put_status(200)
    |> render(:index, topics: topics)
  end

  @doc "GET /api/v1/frequencies — current user's topic weights."
  def get_frequencies(conn, _params) do
    user_id = conn.assigns.current_user.id
    frequencies = Discovery.get_user_frequencies(user_id)

    conn
    |> put_status(200)
    |> render(:frequencies, frequencies: frequencies)
  end

  @doc "PUT /api/v1/frequencies — update user's topic weights."
  def update_frequencies(conn, %{"frequencies" => entries}) when is_list(entries) do
    user_id = conn.assigns.current_user.id

    case Discovery.update_frequencies(user_id, entries) do
      {:ok, count} ->
        json(conn, %{data: %{updated: count}})

      {:error, reason} ->
        conn
        |> put_status(422)
        |> json(%{error: "Failed to update frequencies", detail: inspect(reason)})
    end
  end

  def update_frequencies(conn, _params) do
    conn
    |> put_status(400)
    |> json(%{error: "Expected 'frequencies' array in body"})
  end
end
