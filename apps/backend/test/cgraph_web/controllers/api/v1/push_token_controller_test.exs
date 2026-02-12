defmodule CgraphWeb.API.V1.PushTokenControllerTest do
  @moduledoc "Push token controller tests — WhatsApp/Telegram push registration"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "POST /api/v1/push-tokens" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "registers a push token", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/push-tokens", %{
        token: "ExponentPushToken[xxxxxxxxxxxxxx]",
        platform: "ios",
        device_id: "device-abc-123"
      })
      assert conn.status in [200, 201]
    end

    test "validates token format", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/push-tokens", %{
        token: "",
        platform: "ios"
      })
      assert conn.status in [400, 422]
    end

    test "requires authentication" do
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = post(conn, ~p"/api/v1/push-tokens", %{token: "test", platform: "ios"})
      assert json_response(conn, 401)
    end
  end

  describe "DELETE /api/v1/push-tokens/:token" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "unregisters a push token", %{conn: conn} do
      # First register
      post(conn, ~p"/api/v1/push-tokens", %{
        token: "test_token_to_delete",
        platform: "android"
      })

      # Then delete
      conn = delete(conn, ~p"/api/v1/push-tokens/test_token_to_delete")
      assert conn.status in [200, 204, 404]
    end
  end
end
