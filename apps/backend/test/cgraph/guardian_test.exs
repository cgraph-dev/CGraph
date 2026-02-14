defmodule CGraph.GuardianTest do
  @moduledoc "Tests for JWT authentication module."
  use ExUnit.Case, async: true

  alias CGraph.Guardian

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Guardian)
    end

    test "exports token functions" do
      assert function_exported?(Guardian, :subject_for_token, 2)
      assert function_exported?(Guardian, :resource_from_claims, 1)
      assert function_exported?(Guardian, :generate_tokens, 1)
      assert function_exported?(Guardian, :verify_access_token, 1)
    end
  end

  describe "subject_for_token/2" do
    test "returns error for plain map (requires User struct)" do
      user = %{id: "user-123"}
      result = Guardian.subject_for_token(user, %{})
      assert match?({:error, :invalid_resource}, result)
    end
  end

  describe "resource_from_claims/1" do
    test "returns error for invalid claims" do
      result = Guardian.resource_from_claims(%{})
      assert match?({:error, _}, result)
    end
  end

  describe "generate_tokens/1" do
    test "requires a valid user" do
      result = Guardian.generate_tokens(nil)
      assert match?({:error, _}, result)
    end
  end
end
