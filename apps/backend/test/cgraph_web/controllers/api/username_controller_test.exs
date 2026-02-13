defmodule CGraphWeb.API.UsernameControllerTest do
  @moduledoc """
  Structural tests for UsernameController.
  NOTE: This controller is NOT currently wired in the router.
  Tests validate module compilation and expected action functions.
  """
  use CGraphWeb.ConnCase, async: true

  test "module compiles and is loaded" do
    assert Code.ensure_loaded?(CGraphWeb.API.UsernameController)
  end

  test "module uses Phoenix.Controller" do
    assert function_exported?(CGraphWeb.API.UsernameController, :action, 2)
  end

  test "defines expected action functions" do
    expected_actions = [:check_availability, :change_username, :history, :cooldown_status]

    for action <- expected_actions do
      assert function_exported?(CGraphWeb.API.UsernameController, action, 2),
             "Expected #{action}/2 to be exported"
    end
  end
end
