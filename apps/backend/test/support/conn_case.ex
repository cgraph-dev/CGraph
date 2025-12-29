defmodule CgraphWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by tests that require
  setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also import other
  functionality to make it easier to build common data structures
  and query the data layer.
  """
  use ExUnit.CaseTemplate

  using do
    quote do
      # The default endpoint for testing
      @endpoint CgraphWeb.Endpoint

      use CgraphWeb, :verified_routes

      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      import CgraphWeb.ConnCase
    end
  end

  setup tags do
    Cgraph.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end

  @doc """
  Setup helper that registers and logs in users.
  """
  def register_and_log_in_user(%{conn: conn}) do
    user = CgraphWeb.UserFixtures.user_fixture()
    %{conn: log_in_user(conn, user), user: user}
  end

  @doc """
  Logs the given `user` into the `conn`.
  """
  def log_in_user(conn, user) do
    {:ok, token, _claims} = Cgraph.Guardian.encode_and_sign(user)

    conn
    |> Plug.Conn.put_req_header("authorization", "Bearer #{token}")
  end
end
