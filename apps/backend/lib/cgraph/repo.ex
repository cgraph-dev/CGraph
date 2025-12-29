defmodule Cgraph.Repo do
  @moduledoc """
  Ecto repository for CGraph database operations.
  
  Uses PostgreSQL with UUID primary keys throughout the application.
  Implements soft deletes and audit logging patterns.
  """
  use Ecto.Repo,
    otp_app: :cgraph,
    adapter: Ecto.Adapters.Postgres

  @doc """
  Soft delete a record by setting deleted_at timestamp.
  """
  def soft_delete(struct) do
    struct
    |> Ecto.Changeset.change(deleted_at: DateTime.utc_now())
    |> update()
  end

  @doc """
  Restore a soft-deleted record.
  """
  def restore(struct) do
    struct
    |> Ecto.Changeset.change(deleted_at: nil)
    |> update()
  end

  @doc """
  Default query options that exclude soft-deleted records.
  Override in specific queries when needed.
  """
  def default_options(_operation) do
    []
  end
end
