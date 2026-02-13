# Module aliases for backward compatibility.
#
# Test support modules are defined with the `Cgraph`/`CgraphWeb` prefix
# (matching the OTP app name), but some test files reference them as
# `CGraph.DataCase`/`CGraphWeb.ConnCase` (matching the lib module convention).
#
# Meta pattern: rather than mass-renaming 80+ files in either direction,
# define thin aliases so both conventions resolve correctly.

defmodule CGraph.DataCase do
  @moduledoc false
  defmacro __using__(opts) do
    quote do
      use Cgraph.DataCase, unquote(opts)
    end
  end
end

defmodule CGraphWeb.ConnCase do
  @moduledoc false
  defmacro __using__(opts) do
    quote do
      use CgraphWeb.ConnCase, unquote(opts)
    end
  end
end

defmodule CGraphWeb.ChannelCase do
  @moduledoc false
  defmacro __using__(opts) do
    quote do
      use CgraphWeb.ChannelCase, unquote(opts)
    end
  end
end
