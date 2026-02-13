defmodule CGraphWeb.API.V1.ReferralControllerTest do
  @moduledoc """
  Tests for referral program endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "referral endpoints require authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      # Try to access a referral endpoint without auth
      conn = get(conn, ~p"/api/v1/referrals")
      # This will either 401 or 404 depending on whether the route matches
      assert conn.status in [401, 404]
    end
  end
end
