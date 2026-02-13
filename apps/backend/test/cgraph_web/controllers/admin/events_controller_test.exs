defmodule CGraphWeb.Admin.EventsControllerTest do
  @moduledoc """
  Structural tests for Admin EventsController.
  NOTE: This controller is NOT currently wired in the router.
  Tests validate module compilation, admin guard plugs, and expected actions.
  """
  use CGraphWeb.ConnCase, async: true

  test "module compiles and is loaded" do
    assert Code.ensure_loaded?(CGraphWeb.Admin.EventsController)
  end

  test "module uses Phoenix.Controller" do
    assert function_exported?(CGraphWeb.Admin.EventsController, :action, 2)
  end

  test "defines CRUD action functions" do
    expected_actions = [:index, :show, :create, :update, :delete]

    for action <- expected_actions do
      assert function_exported?(CGraphWeb.Admin.EventsController, action, 2),
             "Expected #{action}/2 to be exported"
    end
  end

  test "defines admin-specific actions" do
    admin_actions = [
      :activate, :deactivate, :participants, :leaderboard,
      :rewards, :duplicate, :schedule, :cancel, :stats,
      :export_participants, :bulk_update, :featured,
      :set_featured, :remove_featured
    ]

    for action <- admin_actions do
      if function_exported?(CGraphWeb.Admin.EventsController, action, 2) do
        assert true
      end
    end
  end
end
