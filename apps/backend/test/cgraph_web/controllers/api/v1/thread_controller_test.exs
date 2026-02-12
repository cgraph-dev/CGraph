defmodule CgraphWeb.API.V1.ThreadControllerTest do
  @moduledoc "Thread controller tests — Reddit-style threaded discussions"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.ForumFixtures

  describe "GET /api/v1/forums/:forum_id/boards/:board_id/threads" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)
      board = board_fixture(forum)
      thread1 = thread_fixture(board, user, %{title: "First Thread"})
      thread2 = thread_fixture(board, user, %{title: "Second Thread"})
      conn = log_in_user(conn, user)
      %{conn: conn, forum: forum, board: board, threads: [thread1, thread2]}
    end

    test "lists threads in a board", %{conn: conn, forum: forum, board: board} do
      conn = get(conn, ~p"/api/v1/forums/#{forum.id}/boards/#{board.id}/threads")
      assert %{"data" => threads} = json_response(conn, 200)
      assert is_list(threads)
    end
  end

  describe "POST /api/v1/forums/:forum_id/boards/:board_id/threads" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)
      board = board_fixture(forum)
      conn = log_in_user(conn, user)
      %{conn: conn, forum: forum, board: board}
    end

    test "creates a thread", %{conn: conn, forum: forum, board: board} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/boards/#{board.id}/threads", %{
        title: "New Discussion",
        content: "Let's talk about this"
      })
      assert conn.status in [200, 201]
    end

    test "validates required title", %{conn: conn, forum: forum, board: board} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/boards/#{board.id}/threads", %{
        content: "No title"
      })
      assert conn.status in [400, 422]
    end
  end

  describe "GET /api/v1/threads/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)
      board = board_fixture(forum)
      thread = thread_fixture(board, user, %{title: "Detail Thread"})
      conn = log_in_user(conn, user)
      %{conn: conn, thread: thread}
    end

    test "returns thread with comments", %{conn: conn, thread: thread} do
      conn = get(conn, ~p"/api/v1/threads/#{thread.id}")
      assert %{"data" => data} = json_response(conn, 200)
      assert data["title"] == "Detail Thread"
    end

    test "returns 404 for non-existent thread", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/threads/#{Ecto.UUID.generate()}")
      assert json_response(conn, 404)
    end
  end
end
