defmodule CGraphWeb.API.V1.VoiceMessageControllerTest do
  @moduledoc """
  Tests for voice message upload, retrieval, and waveform endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/voice-messages/:id
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/voice-messages/:id" do
    test "returns 404 for non-existent voice message", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/voice-messages/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/voice-messages/#{Ecto.UUID.generate()}")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/voice-messages/:id/waveform
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/voice-messages/:id/waveform" do
    test "returns 404 for non-existent voice message", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/voice-messages/#{Ecto.UUID.generate()}/waveform")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/voice-messages/:id
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/voice-messages/:id" do
    test "returns 404 for non-existent voice message", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/voice-messages/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/voice-messages (upload)
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/voice-messages" do
    test "returns error without audio file", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/voice-messages", %{})

      assert conn.status in [400, 422]
    end
  end
end
