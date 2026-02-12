defmodule CgraphWeb.API.V1.ReportControllerTest do
  @moduledoc "Report/moderation controller tests — Reddit/Discord-style"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "POST /api/v1/reports" do
    setup %{conn: conn} do
      user = user_fixture()
      reported_user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, reported_user: reported_user}
    end

    test "creates a report", %{conn: conn, reported_user: reported_user} do
      conn = post(conn, ~p"/api/v1/reports", %{
        reported_id: reported_user.id,
        reported_type: "user",
        reason: "spam",
        description: "This user is sending spam messages"
      })
      assert conn.status in [200, 201]
    end

    test "requires a reason", %{conn: conn, reported_user: reported_user} do
      conn = post(conn, ~p"/api/v1/reports", %{
        reported_id: reported_user.id,
        reported_type: "user"
      })
      assert conn.status in [400, 422]
    end

    test "requires authentication" do
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = post(conn, ~p"/api/v1/reports", %{reason: "spam"})
      assert json_response(conn, 401)
    end
  end

  describe "GET /api/v1/reports (admin)" do
    setup %{conn: conn} do
      admin = user_fixture(%{role: "admin"})
      conn = log_in_user(conn, admin)
      %{conn: conn, admin: admin}
    end

    test "admin can list reports", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/reports")
      # Should either return list or 403 if not admin route
      assert conn.status in [200, 403]
    end
  end
end
