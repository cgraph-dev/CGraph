defmodule CGraph.Release do
  @moduledoc """
  Production release tasks for database operations.

  Usage:
    fly ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"
    fly ssh console -C "/app/bin/cgraph eval 'CGraph.Release.rollback(CGraph.Repo, 1)'"
  """

  @app :cgraph

  def migrate do
    load_app()

    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def rollback(repo, version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp load_app do
    Application.load(@app)
  end
end
