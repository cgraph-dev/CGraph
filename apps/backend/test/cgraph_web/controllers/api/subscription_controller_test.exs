defmodule CGraphWeb.API.SubscriptionControllerTest do
  @moduledoc """
  Structural tests for SubscriptionController.
  NOTE: This controller is NOT currently wired in the router.
  Tests validate module compilation and guard plugs only.
  """
  use CGraphWeb.ConnCase, async: true

  test "module compiles and is loaded" do
    assert Code.ensure_loaded?(CGraphWeb.API.SubscriptionController)
  end

  test "module uses Phoenix.Controller" do
    # Verify the controller has action/2 (Phoenix.Controller behaviour)
    assert function_exported?(CGraphWeb.API.SubscriptionController, :action, 2)
  end

  test "defines expected action functions" do
    expected_actions = [:index, :show, :create, :update, :cancel, :resume]

    for action <- expected_actions do
      assert function_exported?(CGraphWeb.API.SubscriptionController, action, 2),
             "Expected #{action}/2 to be exported"
    end
  end
end
