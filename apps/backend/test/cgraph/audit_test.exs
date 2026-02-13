defmodule CGraph.AuditTest do
  @moduledoc "Tests for immutable audit logging system."
  use ExUnit.Case, async: false

  alias CGraph.Audit

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Audit)
    end

    test "exports logging functions" do
      assert function_exported?(Audit, :log, 4)
      assert function_exported?(Audit, :query, 1)
      assert function_exported?(Audit, :get_user_audit_trail, 2)
      assert function_exported?(Audit, :export, 1)
    end
  end

  describe "log/4" do
    test "logs an audit entry" do
      result = Audit.log(:user, :login, %{user_id: "test-user"}, %{ip: "127.0.0.1"})
      assert result == :ok or match?({:ok, _}, result)
    end
  end

  describe "query/1" do
    test "queries audit entries with filters" do
      result = Audit.query(%{action: :login, limit: 5})
      assert is_list(result) or match?({:ok, _}, result)
    end
  end

  describe "get_user_audit_trail/2" do
    test "returns trail for user" do
      result = Audit.get_user_audit_trail(Ecto.UUID.generate(), %{})
      assert is_list(result) or match?({:ok, _}, result)
    end
  end

  describe "stats/1" do
    test "returns audit statistics" do
      result = Audit.stats(%{})
      assert is_map(result) or match?({:ok, _}, result)
    end
  end

  describe "flush/0" do
    test "flushes pending audit entries" do
      result = Audit.flush()
      assert result == :ok or match?({:ok, _}, result)
    end
  end
end
