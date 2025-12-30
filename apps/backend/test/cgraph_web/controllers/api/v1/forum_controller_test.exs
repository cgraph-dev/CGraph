defmodule CgraphWeb.API.V1.ForumControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.ForumFixtures

  describe "GET /api/v1/forums" do
    setup %{conn: conn} do
      user = user_fixture()
      # Pass user as first arg, attrs as second arg with valid forum names
      forum1 = forum_fixture(user, %{name: "forum_one", slug: "forum-one"})
      forum2 = forum_fixture(user, %{name: "forum_two", slug: "forum-two"})
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, forums: [forum1, forum2]}
    end

    test "lists all forums", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums")
      
      assert %{"data" => forums} = json_response(conn, 200)
      assert is_list(forums)
      assert length(forums) >= 2
    end

    test "supports pagination", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums", %{page: 1, per_page: 1})
      
      assert %{
        "data" => forums,
        "meta" => %{"per_page" => 1}
      } = json_response(conn, 200)
      
      assert length(forums) == 1
    end

    test "supports sorting", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums", %{sort: "activity"})
      assert %{"data" => _forums} = json_response(conn, 200)
    end
  end

  describe "GET /api/v1/forums/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture()
      conn = log_in_user(conn, user)
      
      %{conn: conn, forum: forum}
    end

    test "returns forum details", %{conn: conn, forum: forum} do
      conn = get(conn, ~p"/api/v1/forums/#{forum.id}")
      
      assert %{
        "data" => %{
          "id" => id,
          "name" => name,
          "description" => _description
        }
      } = json_response(conn, 200)
      
      assert id == forum.id
      assert name == forum.name
    end

    test "returns 404 for non-existent forum", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}")
      assert json_response(conn, 404)
    end
  end

  describe "POST /api/v1/forums (admin only)" do
    setup %{conn: conn} do
      admin = admin_user_fixture()
      conn = log_in_user(conn, admin)
      %{conn: conn, admin: admin}
    end

    test "creates forum as admin", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forums", %{
        name: "NewForum",
        slug: "new-forum",
        description: "A new forum"
      })
      
      assert %{
        "data" => %{
          "name" => "NewForum",
          "slug" => "new-forum"
        }
      } = json_response(conn, 201)
    end
  end

  describe "POST /api/v1/forums (non-admin)" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "allows any authenticated user to create a forum (free tier)", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forums", %{
        name: "NewForum",
        slug: "new-forum"
      })
      
      # Any authenticated user can now create forums (up to tier limit)
      response = json_response(conn, 201)
      assert response["data"]["name"] == "NewForum"
      assert response["data"]["slug"] == "new-forum"
    end

    test "enforces free tier limit of 1 forum", %{conn: conn, user: user} do
      # Create first forum (should succeed)
      conn = post(conn, ~p"/api/v1/forums", %{
        name: "FirstForum",
        slug: "first-forum"
      })
      assert json_response(conn, 201)

      # Create second forum (should fail for free tier)
      conn = build_conn()
        |> put_req_header("accept", "application/json")
        |> log_in_user(user)
        |> post(~p"/api/v1/forums", %{
          name: "SecondForum",
          slug: "second-forum"
        })
      
      # Should return error about forum limit
      response = json_response(conn, 422)
      assert response["error"]["code"] == "forum_limit_reached" or 
             String.contains?(response["error"]["message"] || "", "limit")
    end
  end
end

defmodule CgraphWeb.API.V1.PostControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.ForumFixtures

  describe "GET /api/v1/forums/:forum_id/posts" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture()
      %{post: post1} = post_fixture(forum, user, %{title: "First Post"})
      %{post: post2} = post_fixture(forum, user, %{title: "Second Post"})
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, forum: forum, posts: [post1, post2]}
    end

    test "lists posts in forum", %{conn: conn, forum: forum} do
      conn = get(conn, ~p"/api/v1/forums/#{forum.id}/posts")
      
      assert %{"data" => posts} = json_response(conn, 200)
      assert is_list(posts)
      assert length(posts) >= 2
    end

    test "supports sorting by hot/new/top", %{conn: conn, forum: forum} do
      conn = get(conn, ~p"/api/v1/forums/#{forum.id}/posts", %{sort: "new"})
      assert %{"data" => posts} = json_response(conn, 200)
      
      # Verify posts are sorted by date descending
      dates = Enum.map(posts, & &1["created_at"])
      assert dates == Enum.sort(dates, :desc)
    end
  end

  describe "POST /api/v1/forums/:forum_id/posts" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)  # Pass user to make them the owner/member
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, forum: forum}
    end

    test "creates a new post", %{conn: conn, forum: forum, user: user} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts", %{
        title: "My New Post",
        content: "This is the content of my post."
      })
      
      assert %{
        "data" => %{
          "id" => id,
          "title" => "My New Post",
          "author" => %{"id" => author_id}
        }
      } = json_response(conn, 201)
      
      assert is_binary(id)
      assert author_id == user.id
    end

    test "returns error for missing title", %{conn: conn, forum: forum} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts", %{
        content: "No title here"
      })
      
      # Error format: {"error": {"details": {"title": [...]}, "message": "..."}}
      assert json_response(conn, 422)["error"]["details"]["title"]
    end
  end

  describe "POST /api/v1/forums/:forum_id/posts/:id/vote" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)  # Pass user to make them the owner/member
      %{post: post} = post_fixture(forum)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, forum: forum, post: post}
    end

    test "upvotes a post", %{conn: conn, forum: forum, post: post} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts/#{post.id}/vote", %{
        direction: "up"
      })
      
      assert %{
        "data" => %{
          "vote_type" => "up",
          "score" => score
        }
      } = json_response(conn, 200)
      
      assert score > 0
    end

    test "downvotes a post", %{conn: conn, forum: forum, post: post} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts/#{post.id}/vote", %{
        direction: "down"
      })
      
      assert %{
        "data" => %{
          "vote_type" => "down"
        }
      } = json_response(conn, 200)
    end
  end
end

defmodule CgraphWeb.API.V1.CommentControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.ForumFixtures

  describe "GET /api/v1/forums/:forum_id/posts/:post_id/comments" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture()
      %{post: post} = post_fixture(forum, user)
      %{comment: comment1} = comment_fixture(post, user)
      %{comment: comment2} = comment_fixture(post, user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, forum: forum, post: post, comments: [comment1, comment2]}
    end

    test "lists comments on post", %{conn: conn, forum: forum, post: post} do
      conn = get(conn, ~p"/api/v1/forums/#{forum.id}/posts/#{post.id}/comments")
      
      assert %{"data" => comments} = json_response(conn, 200)
      assert is_list(comments)
      assert length(comments) >= 2
    end
  end

  describe "POST /api/v1/forums/:forum_id/posts/:post_id/comments" do
    setup %{conn: conn} do
      user = user_fixture()
      forum = forum_fixture(user)  # Pass user to make them the owner/member
      %{post: post} = post_fixture(forum)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, forum: forum, post: post}
    end

    test "creates a new comment", %{conn: conn, forum: forum, post: post, user: user} do
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts/#{post.id}/comments", %{
        content: "This is my comment"
      })
      
      assert %{
        "data" => %{
          "id" => id,
          "content" => "This is my comment",
          "author" => %{"id" => author_id}
        }
      } = json_response(conn, 201)
      
      assert is_binary(id)
      assert author_id == user.id
    end

    test "creates a reply to another comment", %{conn: conn, forum: forum, post: post} do
      # First create a parent comment
      %{comment: parent} = comment_fixture(post)
      
      conn = post(conn, ~p"/api/v1/forums/#{forum.id}/posts/#{post.id}/comments", %{
        content: "This is a reply",
        parent_id: parent.id
      })
      
      assert %{
        "data" => %{
          "parent_id" => parent_id
        }
      } = json_response(conn, 201)
      
      assert parent_id == parent.id
    end
  end
end
