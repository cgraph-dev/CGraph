defmodule CGraphWeb.API.V1.FileTransferControllerTest do
  @moduledoc "Tests for the file transfer REST API."
  use CGraphWeb.ConnCase, async: false
  import CGraph.Factory

  setup %{conn: conn} do
    user = insert(:user)

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("content-type", "application/json")

    authed_conn = log_in_user(conn, user)

    %{conn: conn, authed_conn: authed_conn, user: user}
  end

  # ============================================================================
  # Authentication
  # ============================================================================

  describe "authentication" do
    test "POST /api/v1/transfers/upload returns 401 without auth", %{conn: conn} do
      conn |> post(~p"/api/v1/transfers/upload", %{}) |> json_response(401)
    end

    test "GET /api/v1/transfers/usage returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/transfers/usage") |> json_response(401)
    end

    test "DELETE /api/v1/transfers/:id returns 401 without auth", %{conn: conn} do
      conn |> delete(~p"/api/v1/transfers/#{Ecto.UUID.generate()}") |> json_response(401)
    end
  end

  # ============================================================================
  # POST /api/v1/files/upload
  # ============================================================================

  describe "POST /api/v1/transfers/upload" do
    test "initiates a direct upload", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/transfers/upload", %{
          file_name: "photo.jpg",
          file_size: 1_000_000,
          file_mime_type: "image/jpeg"
        })
        |> json_response(201)

      assert response["transfer"]["status"] == "pending"
      assert response["transfer"]["file_name"] == "photo.jpg"
      assert response["upload"]["type"] == "direct"
    end

    test "initiates a chunked upload for large files", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/transfers/upload", %{
          file_name: "video.mp4",
          file_size: 20_000_000,
          file_mime_type: "video/mp4"
        })
        |> json_response(201)

      assert response["transfer"]["upload_type"] == "chunked"
      assert response["upload"]["type"] == "chunked"
      assert response["upload"]["chunks_total"] > 0
    end

    test "rejects dangerous file types", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/transfers/upload", %{
          file_name: "virus.exe",
          file_size: 1000,
          file_mime_type: "application/octet-stream"
        })
        |> json_response(422)

      assert response["error"] =~ "not allowed"
    end

    test "rejects oversized files", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/transfers/upload", %{
          file_name: "huge.zip",
          file_size: 30_000_000,
          file_mime_type: "application/zip"
        })
        |> json_response(422)

      assert response["error"] =~ "size"
    end
  end

  # ============================================================================
  # GET /api/v1/files/:id
  # ============================================================================

  describe "GET /api/v1/transfers/:id" do
    test "returns transfer status", %{authed_conn: conn, user: user} do
      transfer = insert(:file_transfer, user: user, status: "ready")

      response =
        conn |> get(~p"/api/v1/transfers/#{transfer.id}") |> json_response(200)

      assert response["transfer"]["id"] == transfer.id
      assert response["transfer"]["status"] == "ready"
    end

    test "returns 404 for nonexistent transfer", %{authed_conn: conn} do
      conn
      |> get(~p"/api/v1/transfers/#{Ecto.UUID.generate()}")
      |> json_response(404)
    end
  end

  # ============================================================================
  # POST /api/v1/files/:id/complete
  # ============================================================================

  describe "POST /api/v1/transfers/:id/complete" do
    test "completes an upload", %{authed_conn: conn, user: user} do
      transfer = insert(:file_transfer, user: user, status: "uploading")

      response =
        conn
        |> post(~p"/api/v1/transfers/#{transfer.id}/complete", %{})
        |> json_response(200)

      assert response["transfer"]["status"] == "ready"
    end
  end

  # ============================================================================
  # GET /api/v1/files/:id/download
  # ============================================================================

  describe "GET /api/v1/transfers/:id/download" do
    test "generates download URL for ready transfer", %{authed_conn: conn, user: user} do
      transfer = insert(:file_transfer, user: user, status: "ready")

      response =
        conn
        |> get(~p"/api/v1/transfers/#{transfer.id}/download")
        |> json_response(200)

      assert response["download"]["file_name"] == transfer.file_name
      assert response["download"]["expires_in"] == 3600
    end

    test "returns 404 for nonexistent transfer", %{authed_conn: conn} do
      conn
      |> get(~p"/api/v1/transfers/#{Ecto.UUID.generate()}/download")
      |> json_response(404)
    end
  end

  # ============================================================================
  # DELETE /api/v1/files/:id
  # ============================================================================

  describe "DELETE /api/v1/transfers/:id" do
    test "cancels a pending upload", %{authed_conn: conn, user: user} do
      transfer = insert(:file_transfer, user: user, status: "pending")

      response =
        conn |> delete(~p"/api/v1/transfers/#{transfer.id}") |> json_response(200)

      assert response["transfer"]["status"] == "failed"
    end

    test "rejects cancel for completed upload", %{authed_conn: conn, user: user} do
      transfer = insert(:file_transfer, user: user, status: "ready")

      conn
      |> delete(~p"/api/v1/transfers/#{transfer.id}")
      |> json_response(409)
    end
  end

  # ============================================================================
  # GET /api/v1/files/usage
  # ============================================================================

  describe "GET /api/v1/transfers/usage" do
    test "returns storage usage", %{authed_conn: conn, user: user} do
      insert(:file_transfer, user: user, file_size: 5000, status: "ready")
      insert(:file_transfer, user: user, file_size: 3000, status: "ready")

      response = conn |> get(~p"/api/v1/transfers/usage") |> json_response(200)

      assert response["usage"]["used_bytes"] == 8000
    end

    test "returns 0 for no files", %{authed_conn: conn} do
      response = conn |> get(~p"/api/v1/transfers/usage") |> json_response(200)

      assert response["usage"]["used_bytes"] == 0
    end
  end
end
