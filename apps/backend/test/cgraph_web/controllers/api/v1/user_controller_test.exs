defmodule CgraphWeb.API.V1.UserControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "GET /api/v1/me (unauthenticated)" do
    test "returns 401 without authentication", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/me")
      assert json_response(conn, 401)
    end
  end

  describe "GET /api/v1/me (authenticated)" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "returns current user data", %{conn: conn, user: user} do
      conn = get(conn, ~p"/api/v1/me")
      
      assert %{
        "data" => %{
          "id" => id,
          "username" => username,
          "email" => email
        }
      } = json_response(conn, 200)
      
      assert id == user.id
      assert username == user.username
      assert email == user.email
    end
  end

  describe "PUT /api/v1/me" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "updates user profile", %{conn: conn, user: user} do
      update_params = %{
        display_name: "Updated Name",
        bio: "This is my new bio"
      }

      conn = put(conn, ~p"/api/v1/me", user: update_params)
      
      assert %{
        "data" => %{
          "display_name" => "Updated Name",
          "bio" => "This is my new bio"
        }
      } = json_response(conn, 200)
    end

    test "cannot change username to existing one", %{conn: conn} do
      other_user = user_fixture()
      
      conn = put(conn, ~p"/api/v1/me", user: %{username: other_user.username})
      
      # Error response format: {"error": {"message": "...", "details": {"username": [...]}}}
      response = json_response(conn, 422)
      assert response["error"]["details"]["username"]
    end
  end

  describe "DELETE /api/v1/me" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "soft deletes user account", %{conn: conn, user: user} do
      conn = delete(conn, ~p"/api/v1/me")
      
      # Controller returns 200 with message about grace period
      assert %{"message" => message} = json_response(conn, 200)
      assert message =~ "scheduled for deletion"
      
      # Verify user has deletion scheduled
      updated_user = Cgraph.Accounts.get_user!(user.id)
      assert updated_user.deleted_at != nil
    end
  end

  describe "GET /api/v1/users" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      
      # Create additional users
      _user2 = user_fixture(%{username: "testuser2"})
      _user3 = user_fixture(%{username: "testuser3"})
      
      %{conn: conn, user: user}
    end

    test "lists users with pagination", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users", %{page: 1, per_page: 10})
      
      assert %{
        "data" => users,
        "meta" => %{
          "page" => 1,
          "per_page" => 10
        }
      } = json_response(conn, 200)
      
      assert is_list(users)
      assert length(users) >= 3
    end

    test "searches users by query", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users", %{q: "testuser"})
      
      assert %{"data" => users} = json_response(conn, 200)
      assert length(users) >= 2
    end
  end

  describe "GET /api/v1/users/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, other_user: other_user}
    end

    test "returns user by id", %{conn: conn, other_user: other_user} do
      conn = get(conn, ~p"/api/v1/users/#{other_user.id}")
      
      assert %{
        "data" => %{
          "id" => id,
          "username" => username
        }
      } = json_response(conn, 200)
      
      assert id == other_user.id
      assert username == other_user.username
    end

    test "returns 404 for non-existent user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users/#{Ecto.UUID.generate()}")
      assert json_response(conn, 404)
    end
  end

  describe "GET /api/v1/users/:username/profile" do
    setup %{conn: conn} do
      user = user_fixture()
      # Create user then update with bio (registration doesn't include bio field)
      other_user = user_fixture(%{display_name: "Test Display"})
      {:ok, other_user} = Cgraph.Accounts.update_user(other_user, %{bio: "Test bio"})
      
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, other_user: other_user}
    end

    test "returns user profile by username", %{conn: conn, other_user: other_user} do
      conn = get(conn, ~p"/api/v1/users/#{other_user.username}/profile")
      
      assert %{"data" => user_data} = json_response(conn, 200)
      assert user_data["username"] == other_user.username
      assert user_data["display_name"] == "Test Display"
      assert user_data["bio"] == "Test bio"
    end
  end

  describe "GET /api/v1/me/sessions" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "lists active sessions", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/me/sessions")
      
      assert %{"data" => sessions} = json_response(conn, 200)
      assert is_list(sessions)
    end
  end

  describe "PUT /api/v1/me/username" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "changes username successfully", %{conn: conn, user: _user} do
      new_username = "new_username_#{System.unique_integer([:positive])}"
      conn = put(conn, ~p"/api/v1/me/username", %{username: new_username})
      
      assert %{
        "data" => %{
          "username" => ^new_username,
          "can_change_username" => false
        }
      } = json_response(conn, 200)
    end

    test "rejects username change within cooldown period", %{conn: conn, user: user} do
      # First, set the user's username_changed_at to now (truncate to seconds for :utc_datetime)
      {:ok, _} = Cgraph.Repo.update(
        Ecto.Changeset.change(user, %{username_changed_at: DateTime.truncate(DateTime.utc_now(), :second)})
      )

      new_username = "another_username_#{System.unique_integer([:positive])}"
      conn = put(conn, ~p"/api/v1/me/username", %{username: new_username})
      
      assert %{"error" => _} = json_response(conn, 422)
    end

    test "rejects duplicate username", %{conn: conn, user: _user} do
      other_user = user_fixture()
      
      conn = put(conn, ~p"/api/v1/me/username", %{username: other_user.username})
      
      assert %{"error" => _} = json_response(conn, 422)
    end

    test "rejects invalid username format", %{conn: conn, user: _user} do
      conn = put(conn, ~p"/api/v1/me/username", %{username: "ab"}) # too short
      
      assert %{"error" => _} = json_response(conn, 422)
    end
  end
end
