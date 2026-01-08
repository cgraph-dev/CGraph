defmodule CgraphWeb.API.V1.ReportController do
  @moduledoc """
  REST API controller for content reports.

  Allows users to report violations of community guidelines.
  Reports are queued for moderator review.

  ## Endpoints

  - `POST /api/v1/reports` - Create a new report
  - `GET /api/v1/reports` - List user's own reports
  - `GET /api/v1/reports/:id` - Get report status
  """

  use CgraphWeb, :controller

  alias Cgraph.Moderation

  action_fallback CgraphWeb.FallbackController

  @doc """
  Create a new content report.

  ## Request Body

  ```json
  {
    "report": {
      "target_type": "message",
      "target_id": "uuid",
      "category": "harassment",
      "description": "Optional details about the violation"
    }
  }
  ```

  ## Response

  - `201 Created` - Report submitted successfully
  - `400 Bad Request` - Invalid parameters
  - `409 Conflict` - Duplicate report exists
  - `422 Unprocessable Entity` - Cannot report own content
  """
  def create(conn, %{"report" => report_params}) do
    user = conn.assigns.current_user

    # Convert string keys to atoms for category and target_type
    attrs = normalize_params(report_params)

    case Moderation.create_report(user, attrs) do
      {:ok, report} ->
        conn
        |> put_status(:created)
        |> render(:show, report: report)

      {:error, :duplicate} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "You have already reported this content"})

      {:error, :self_report} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "You cannot report your own content"})

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: CgraphWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)
    end
  end

  @doc """
  List the current user's submitted reports.
  """
  def index(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", 1) |> to_integer(1)
    limit = Map.get(params, "limit", 20) |> to_integer(20) |> min(100)

    reports = Moderation.list_user_reports(user.id, page: page, limit: limit)
    render(conn, :index, reports: reports)
  end

  @doc """
  Get the status of a specific report.
  """
  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Moderation.get_user_report(user.id, id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Report not found"})

      report ->
        render(conn, :show, report: report)
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp normalize_params(params) do
    %{}
    |> put_if_present(:target_type, params["target_type"], &normalize_target_type/1)
    |> put_if_present(:target_id, params["target_id"])
    |> put_if_present(:category, params["category"], &normalize_category/1)
    |> put_if_present(:description, params["description"])
    |> put_if_present(:evidence_urls, params["evidence_urls"])
  end

  defp put_if_present(map, _key, nil), do: map
  defp put_if_present(map, key, value), do: Map.put(map, key, value)
  defp put_if_present(map, key, value, transform) when not is_nil(value) do
    Map.put(map, key, transform.(value))
  end
  defp put_if_present(map, _key, nil, _transform), do: map

  defp normalize_target_type(type) when is_binary(type) do
    String.to_existing_atom(type)
  rescue
    ArgumentError -> type
  end

  defp normalize_category(category) when is_binary(category) do
    String.to_existing_atom(category)
  rescue
    ArgumentError -> category
  end

  defp to_integer(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {int, _} -> int
      :error -> default
    end
  end
  defp to_integer(value, _default) when is_integer(value), do: value
  defp to_integer(_, default), do: default
end
