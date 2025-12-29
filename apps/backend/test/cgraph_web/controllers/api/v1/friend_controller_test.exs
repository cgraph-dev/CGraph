defmodule CgraphWeb.API.V1.FriendControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "GET /api/v1/friends" do
    setup %{conn: conn} do
      user = user_fixture()
      friend1 = user_fixture(%{username: "friend1"})
      friend2 = user_fixture(%{username: "friend2"})
      
      # Create friendships
      {:ok, _} = Cgraph.Accounts.send_friend_request(user, friend1)
      {:ok, _} = Cgraph.Accounts.accept_friend_request(friend1, user)
      {:ok, _} = Cgraph.Accounts.send_friend_request(user, friend2)
      {:ok, _} = Cgraph.Accounts.accept_friend_request(friend2, user)
      
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, friends: [friend1, friend2]}
    end

    test "lists user's friends", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends")
      
      assert %{"data" => friends} = json_response(conn, 200)
      assert is_list(friends)
      assert length(friends) == 2
    end
  end

  describe "POST /api/v1/friends" do
    setup %{conn: conn} do
      user = user_fixture()
      potential_friend = user_fixture()
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, potential_friend: potential_friend}
    end

    test "sends friend request", %{conn: conn, potential_friend: potential_friend} do
      conn = post(conn, ~p"/api/v1/friends", %{user_id: potential_friend.id})
      
      assert %{
        "data" => %{
          "status" => "pending"
        }
      } = json_response(conn, 201)
    end

    test "returns error when sending request to self", %{conn: conn, user: user} do
      conn = post(conn, ~p"/api/v1/friends", %{user_id: user.id})
      assert json_response(conn, 400)
    end
  end

  describe "GET /api/v1/friends/pending" do
    setup %{conn: conn} do
      user = user_fixture()
      requester1 = user_fixture()
      requester2 = user_fixture()
      
      # Others send requests to this user
      {:ok, _} = Cgraph.Accounts.send_friend_request(requester1, user)
      {:ok, _} = Cgraph.Accounts.send_friend_request(requester2, user)
      
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, requesters: [requester1, requester2]}
    end

    test "lists pending friend requests", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends/pending")
      
      assert %{"data" => requests} = json_response(conn, 200)
      assert is_list(requests)
      assert length(requests) == 2
    end
  end

  describe "POST /api/v1/friends/:id/accept" do
    setup %{conn: conn} do
      user = user_fixture()
      requester = user_fixture()
      
      {:ok, request} = Cgraph.Accounts.send_friend_request(requester, user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, requester: requester, request: request}
    end

    test "accepts friend request", %{conn: conn, request: request} do
      conn = post(conn, ~p"/api/v1/friends/#{request.id}/accept")
      
      assert %{
        "data" => %{
          "status" => "accepted"
        }
      } = json_response(conn, 200)
    end
  end

  describe "POST /api/v1/friends/:id/decline" do
    setup %{conn: conn} do
      user = user_fixture()
      requester = user_fixture()
      
      {:ok, request} = Cgraph.Accounts.send_friend_request(requester, user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, request: request}
    end

    test "declines friend request", %{conn: conn, request: request} do
      conn = post(conn, ~p"/api/v1/friends/#{request.id}/decline")
      assert response(conn, 204)
    end
  end

  describe "DELETE /api/v1/friends/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      friend = user_fixture()
      
      {:ok, _} = Cgraph.Accounts.send_friend_request(user, friend)
      {:ok, friendship} = Cgraph.Accounts.accept_friend_request(friend, user)
      
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, friend: friend, friendship: friendship}
    end

    test "removes friend", %{conn: conn, friendship: friendship} do
      conn = delete(conn, ~p"/api/v1/friends/#{friendship.id}")
      assert response(conn, 204)
    end
  end

  describe "POST /api/v1/friends/:id/block" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, other_user: other_user}
    end

    test "blocks a user", %{conn: conn, other_user: other_user} do
      conn = post(conn, ~p"/api/v1/friends/#{other_user.id}/block")
      
      assert %{
        "data" => %{
          "blocked_user_id" => blocked_user_id
        }
      } = json_response(conn, 201)
      
      assert blocked_user_id == other_user.id
    end
  end

  describe "DELETE /api/v1/friends/:id/block" do
    setup %{conn: conn} do
      user = user_fixture()
      blocked_user = user_fixture()
      
      {:ok, _} = Cgraph.Accounts.block_user(user, blocked_user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, blocked_user: blocked_user}
    end

    test "unblocks a user", %{conn: conn, blocked_user: blocked_user} do
      conn = delete(conn, ~p"/api/v1/friends/#{blocked_user.id}/block")
      assert response(conn, 204)
    end
  end

  describe "GET /api/v1/friends/:id/mutual" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      mutual_friend = user_fixture()
      
      # Create mutual friendship
      {:ok, _} = Cgraph.Accounts.send_friend_request(user, mutual_friend)
      {:ok, _} = Cgraph.Accounts.accept_friend_request(mutual_friend, user)
      {:ok, _} = Cgraph.Accounts.send_friend_request(other_user, mutual_friend)
      {:ok, _} = Cgraph.Accounts.accept_friend_request(mutual_friend, other_user)
      
      conn = log_in_user(conn, user)
      
      %{conn: conn, other_user: other_user, mutual_friend: mutual_friend}
    end

    test "returns mutual friends", %{conn: conn, other_user: other_user, mutual_friend: mutual_friend} do
      conn = get(conn, ~p"/api/v1/friends/#{other_user.id}/mutual")
      
      assert %{"data" => %{"users" => mutuals, "count" => count}} = json_response(conn, 200)
      assert is_list(mutuals)
      assert count == length(mutuals)
      
      ids = Enum.map(mutuals, & &1["id"])
      assert mutual_friend.id in ids
    end
  end

  describe "GET /api/v1/friends/suggestions" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      
      # Create some users who could be suggested
      _suggestion1 = user_fixture()
      _suggestion2 = user_fixture()
      
      %{conn: conn, user: user}
    end

    test "returns friend suggestions", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/friends/suggestions")
      
      assert %{"data" => suggestions} = json_response(conn, 200)
      assert is_list(suggestions)
    end
  end
end
