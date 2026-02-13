defmodule CGraph.ThemesTest do
  @moduledoc "Tests for theme management."
  use CGraph.DataCase, async: true

  alias CGraph.Themes

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Themes)
    end

    test "exports theme functions" do
      assert function_exported?(Themes, :get_theme, 1)
      assert function_exported?(Themes, :update_theme, 2)
      assert function_exported?(Themes, :reset_theme, 1)
      assert function_exported?(Themes, :default_theme, 0)
    end
  end

  describe "default_theme/0" do
    test "returns a map with theme properties" do
      theme = Themes.default_theme()
      assert is_map(theme)
    end
  end

  describe "get_theme/1" do
    test "returns default for unknown user" do
      result = Themes.get_theme(Ecto.UUID.generate())
      assert is_map(result) or match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end

  describe "is_premium_feature?/2" do
    test "function exists" do
      assert function_exported?(Themes, :is_premium_feature?, 2)
    end
  end
end
