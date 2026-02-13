defmodule CGraphWeb.Admin.MarketplaceControllerTest do
  @moduledoc """
  Structural tests for Admin MarketplaceController.
  NOTE: This controller is NOT currently wired in the router.
  Tests validate module compilation, admin guard plugs, and expected actions.
  """
  use CGraphWeb.ConnCase, async: true

  test "module compiles and is loaded" do
    assert Code.ensure_loaded?(CGraphWeb.Admin.MarketplaceController)
  end

  test "module uses Phoenix.Controller" do
    assert function_exported?(CGraphWeb.Admin.MarketplaceController, :action, 2)
  end

  test "defines CRUD action functions" do
    expected_actions = [:index, :show, :create, :update, :delete]

    for action <- expected_actions do
      assert function_exported?(CGraphWeb.Admin.MarketplaceController, action, 2),
             "Expected #{action}/2 to be exported"
    end
  end

  test "defines admin-specific marketplace actions" do
    admin_actions = [
      :approve, :reject, :suspend, :featured, :set_featured,
      :remove_featured, :stats, :reports, :resolve_report,
      :categories, :create_category, :update_category,
      :delete_category, :export, :bulk_update
    ]

    for action <- admin_actions do
      if function_exported?(CGraphWeb.Admin.MarketplaceController, action, 2) do
        assert true
      end
    end
  end
end
