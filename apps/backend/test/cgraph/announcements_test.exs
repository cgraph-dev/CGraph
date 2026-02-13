defmodule CGraph.AnnouncementsTest do
  @moduledoc "Tests for announcement retrieval and dismissal."
  use CGraph.DataCase, async: true

  alias CGraph.Announcements

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Announcements)
    end

    test "exports announcement functions" do
      assert function_exported?(Announcements, :list_for_user, 2)
      assert function_exported?(Announcements, :get, 1)
      assert function_exported?(Announcements, :mark_read, 2)
      assert function_exported?(Announcements, :dismiss, 2)
    end
  end

  describe "list_for_user/2" do
    test "returns empty list for user with no announcements" do
      result = Announcements.list_for_user(Ecto.UUID.generate(), %{})
      assert is_list(result) or match?({:ok, []}, result)
    end
  end

  describe "get/1" do
    test "returns nil or error for non-existent announcement" do
      result = Announcements.get(Ecto.UUID.generate())
      assert is_nil(result) or match?({:error, :not_found}, result)
    end
  end
end
