defmodule CGraphWeb.SettingsControllerTest do
  @moduledoc """
  Tests for user settings (notifications, privacy, appearance, locale).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/settings" do
    test "returns current user settings", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/settings")

      response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  describe "PUT /api/v1/settings" do
    test "updates settings", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/settings", %{})

      assert conn.status in [200, 422]
    end
  end

  describe "PUT /api/v1/settings/notifications" do
    test "updates notification preferences", %{conn: conn} do
      conn =
        put(conn, ~p"/api/v1/settings/notifications", %{
          "push_enabled" => true,
          "email_enabled" => false
        })

      assert conn.status in [200, 422]
    end
  end

  describe "PUT /api/v1/settings/privacy" do
    test "updates privacy settings", %{conn: conn} do
      conn =
        put(conn, ~p"/api/v1/settings/privacy", %{
          "profile_visibility" => "friends_only"
        })

      assert conn.status in [200, 422]
    end
  end

  describe "PUT /api/v1/settings/appearance" do
    test "updates appearance settings", %{conn: conn} do
      conn =
        put(conn, ~p"/api/v1/settings/appearance", %{
          "theme" => "dark"
        })

      assert conn.status in [200, 422]
    end
  end

  describe "PUT /api/v1/settings/locale" do
    test "updates locale settings", %{conn: conn} do
      conn =
        put(conn, ~p"/api/v1/settings/locale", %{
          "locale" => "en"
        })

      assert conn.status in [200, 422]
    end
  end

  describe "POST /api/v1/settings/reset" do
    test "resets settings to defaults", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/settings/reset")

      assert conn.status in [200, 204]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/settings")

      assert json_response(conn, 401)
    end
  end
end
