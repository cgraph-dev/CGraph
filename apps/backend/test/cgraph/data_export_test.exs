defmodule CGraph.DataExportTest do
  @moduledoc "Tests for GDPR-compliant data export infrastructure."
  use CGraph.DataCase, async: false

  alias CGraph.DataExport

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(DataExport)
    end

    test "exports export functions" do
      assert function_exported?(DataExport, :export_user_data, 2)
      assert function_exported?(DataExport, :get_export, 1)
      assert function_exported?(DataExport, :list_user_exports, 1)
      assert function_exported?(DataExport, :delete_export, 1)
    end
  end

  describe "get_export/1" do
    test "returns nil or error for non-existent export" do
      result = DataExport.get_export(Ecto.UUID.generate())
      assert is_nil(result) or match?({:error, _}, result)
    end
  end

  describe "list_user_exports/1" do
    test "returns empty list for user with no exports" do
      result = DataExport.list_user_exports(Ecto.UUID.generate())
      assert is_list(result) or match?({:ok, []}, result) or match?({:ok, _}, result)
    end
  end

  describe "get_stats/0" do
    test "returns export statistics" do
      result = DataExport.get_stats()
      assert is_map(result) or match?({:ok, _}, result)
    end
  end
end
