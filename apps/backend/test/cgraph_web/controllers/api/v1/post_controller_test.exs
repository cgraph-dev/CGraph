defmodule CgraphWeb.API.V1.PostControllerTest do
  @moduledoc "Post controller tests — Reddit-style forum post CRUD"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.ForumFixtures

  describe "GET /api/v1/forums/:forum_id/posts" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)
      post1 = post_fixture(forum, user, %{title: "First Post", content: "Hello"})
      post2 = post_fixture(forum, user, %{title: "Second Post", content: "World"})

      %{conn: conn, user: user, forum: forum, posts: [post1, post2]}
    end

    test "lists posts in a forum (public, no auth)", %{conn: conn, forum: forum} do
      conn = get(conn, ~p"/api/v1/forums/#{forum.id}/posts")
      assert %{"data" => posts} = json_response(conn, 200)
      assert is_list(posts)
      assert length(posts) >= 2
    end

    test "supports pagination", %{conn: conn, forum: forum} do
      conn = get(conn, ~p"/api/v1/forums/#{forum.id}/posts", %{per_page: "1"})
      assert %{"data" => posts} = json_response(conn, 200)
      assert length(posts) <= 1
    end

    test "returns 404 for non-existent forum", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts")
      assert json_response(conn, 404)
    end
  end

  describe "POST /api/v1/forums/:forum_id/posts" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, forum: forum}
    end

    test "creates a post", %{conn: conn, forum: forum} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts", %{
        title: "Test Post",
        content: "This is test content"
      })
      assert %{"data" => post} = json_response(conn, 201)
      assert post["title"] == "Test Post"
    end

    test "requires authentication", %{forum: forum} do
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts", %{
        title: "Unauth Post",
        content: "Should fail"
      })
      assert json_response(conn, 401)
    end

    test "validates required fields", %{conn: conn, forum: forum} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts", %{})
      assert json_response(conn, 422)
    end
  end

  describe "GET /api/v1/forums/:forum_id/posts/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)
      %{post: post} = post_fixture(forum, user, %{title: "Detailed Post", content: "Content"})
      %{conn: conn, forum: forum, post: post}
    end

    test "returns post details", %{conn: conn, forum: forum, post: post} do
      conn = get(conn, ~p"/api/v1/forums/#{forum.id}/posts/#{post.id}")
      assert %{"data" => data} = json_response(conn, 200)
      assert data["title"] == "Detailed Post"
    end
  end
end
