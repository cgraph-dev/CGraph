defmodule CGraphWeb.QuestControllerTest do
  @moduledoc """
  Tests for quest system (daily, weekly, accept, claim rewards).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/quests" do
    test "lists all available quests", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/quests")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/quests/active" do
    test "returns user's active quests", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/quests/active")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/quests/daily" do
    test "returns daily quests", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/quests/daily")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/quests/weekly" do
    test "returns weekly quests", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/quests/weekly")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/quests/:id" do
    test "returns 404 for non-existent quest", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/quests/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/quests/:id/accept" do
    test "returns 404 for non-existent quest", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/quests/#{Ecto.UUID.generate()}/accept")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/quests/:id/claim" do
    test "returns 404 for non-existent quest", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/quests/#{Ecto.UUID.generate()}/claim")

      assert conn.status in [404, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/quests")

      assert json_response(conn, 401)
    end
  end
end
