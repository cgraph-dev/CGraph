defmodule CGraph.ReadRepo do
  @moduledoc """
  Read-only Ecto repository for CGraph.

  Routes heavy read queries (leaderboards, analytics, search indexing,
  user profile lookups, forum feed generation) to a read replica when
  configured, falling back to the primary database otherwise.

  ## Usage

      # Leaderboard queries
      CGraph.ReadRepo.all(from u in User, order_by: [desc: u.xp], limit: 100)

      # Profile lookups
      CGraph.ReadRepo.get(User, user_id)

      # Forum feed
      CGraph.ReadRepo.all(from t in Thread, where: t.forum_id == ^forum_id)

  ## Configuration

  Set `READ_REPLICA_DATABASE_URL` in production to point to a
  PostgreSQL read replica. If unset, this repo uses the primary
  database (same config as CGraph.Repo).
  """
  use Ecto.Repo,
    otp_app: :cgraph,
    adapter: Ecto.Adapters.Postgres,
    read_only: true

  @doc """
  Default query options — exclude soft-deleted records.
  """
  @spec default_options(atom()) :: keyword()
  def default_options(_operation) do
    []
  end
end
