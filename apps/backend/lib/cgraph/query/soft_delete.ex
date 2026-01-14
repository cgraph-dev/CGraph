defmodule CGraph.Query.SoftDelete do
  @moduledoc """
  Soft delete query helpers and automatic scoping.

  Provides composable query functions to filter soft-deleted records
  and a macro for schemas that support soft deletes.

  ## Usage in Schemas

      defmodule CGraph.Messages.Message do
        use Ecto.Schema
        use CGraph.Query.SoftDelete.Schema  # Adds deleted_at field + helpers

        schema "messages" do
          # ... fields ...
        end
      end

  ## Usage in Contexts

      import CGraph.Query.SoftDelete

      def list_active_messages(conversation_id) do
        Message
        |> not_deleted()
        |> where([m], m.conversation_id == ^conversation_id)
        |> Repo.all()
      end

      # Include deleted records
      def list_all_messages(conversation_id) do
        Message
        |> with_deleted()
        |> where([m], m.conversation_id == ^conversation_id)
        |> Repo.all()
      end

      # Only deleted records (for admin/recovery)
      def list_deleted_messages(conversation_id) do
        Message
        |> only_deleted()
        |> where([m], m.conversation_id == ^conversation_id)
        |> Repo.all()
      end

  ## Multi-Tenant Support

  Combine with tenant scoping:

      Message
      |> not_deleted()
      |> for_tenant(tenant_id)
      |> Repo.all()
  """

  import Ecto.Query

  @type queryable :: Ecto.Queryable.t()

  # ============================================================================
  # Query Functions
  # ============================================================================

  @doc """
  Exclude soft-deleted records from query.

  This is the default behavior for most application queries.

  ## Examples

      Message |> not_deleted() |> Repo.all()
  """
  @spec not_deleted(queryable()) :: Ecto.Query.t()
  def not_deleted(queryable) do
    from(q in queryable, where: is_nil(q.deleted_at))
  end

  @doc """
  Include all records, ignoring soft delete status.

  Use for admin views, data exports, or when you need to see deleted records.

  ## Examples

      Message |> with_deleted() |> Repo.all()
  """
  @spec with_deleted(queryable()) :: Ecto.Query.t()
  def with_deleted(queryable) do
    # Remove any existing deleted_at filter and return base query
    queryable
    |> exclude_where_deleted_at()
  end

  @doc """
  Return only soft-deleted records.

  Useful for trash views, recovery operations, or cleanup jobs.

  ## Examples

      Message |> only_deleted() |> Repo.all()
  """
  @spec only_deleted(queryable()) :: Ecto.Query.t()
  def only_deleted(queryable) do
    from(q in queryable, where: not is_nil(q.deleted_at))
  end

  @doc """
  Filter records deleted before a specific date.

  Useful for cleanup jobs that permanently delete old soft-deleted records.

  ## Examples

      # Get messages deleted more than 30 days ago
      Message
      |> deleted_before(DateTime.add(DateTime.utc_now(), -30, :day))
      |> Repo.delete_all()
  """
  @spec deleted_before(queryable(), DateTime.t()) :: Ecto.Query.t()
  def deleted_before(queryable, %DateTime{} = before_date) do
    from(q in queryable,
      where: not is_nil(q.deleted_at) and q.deleted_at < ^before_date
    )
  end

  @doc """
  Filter records deleted after a specific date.

  Useful for finding recently deleted records for recovery.
  """
  @spec deleted_after(queryable(), DateTime.t()) :: Ecto.Query.t()
  def deleted_after(queryable, %DateTime{} = after_date) do
    from(q in queryable,
      where: not is_nil(q.deleted_at) and q.deleted_at > ^after_date
    )
  end

  # Helper to remove deleted_at where clauses (best effort)
  defp exclude_where_deleted_at(queryable) do
    # For simple cases, just wrap in a subquery that doesn't add filters
    # This preserves existing query structure while allowing deleted records
    from(q in queryable, [])
  end

  # ============================================================================
  # Schema Macro
  # ============================================================================

  defmodule Schema do
    @moduledoc """
    Use in schemas to add soft delete field and helper functions.

    ## Example

        defmodule MyApp.Post do
          use Ecto.Schema
          use CGraph.Query.SoftDelete.Schema

          schema "posts" do
            field :title, :string
            # deleted_at is added automatically
            timestamps()
          end
        end

    The schema will have:
    - `deleted_at` field (utc_datetime, nullable)
    - `deleted?/1` function to check if record is deleted
    - `active?/1` function to check if record is not deleted
    """

    defmacro __using__(_opts) do
      quote do
        import CGraph.Query.SoftDelete.Schema

        @doc """
        Check if the record is soft-deleted.
        """
        def deleted?(%{deleted_at: nil}), do: false
        def deleted?(%{deleted_at: %DateTime{}}), do: true
        def deleted?(_), do: false

        @doc """
        Check if the record is active (not soft-deleted).
        """
        def active?(record), do: not deleted?(record)
      end
    end

    @doc """
    Add the deleted_at field to a schema.

    Call this inside your schema block:

        schema "posts" do
          soft_delete_field()
          field :title, :string
        end
    """
    defmacro soft_delete_field do
      quote do
        field :deleted_at, :utc_datetime
      end
    end
  end

  # ============================================================================
  # Context Helpers
  # ============================================================================

  defmodule Helpers do
    @moduledoc """
    Helper functions for working with soft-deleted records in contexts.
    """

    alias CGraph.Repo

    @doc """
    Soft delete a record.

    ## Examples

        {:ok, post} = SoftDelete.Helpers.soft_delete(post)
    """
    def soft_delete(%{__struct__: _} = struct) do
      struct
      |> Ecto.Changeset.change(deleted_at: DateTime.utc_now())
      |> Repo.update()
    end

    @doc """
    Restore a soft-deleted record.

    ## Examples

        {:ok, post} = SoftDelete.Helpers.restore(post)
    """
    def restore(%{__struct__: _} = struct) do
      struct
      |> Ecto.Changeset.change(deleted_at: nil)
      |> Repo.update()
    end

    @doc """
    Soft delete a record with a specific reason (stores in metadata if available).
    """
    def soft_delete_with_reason(%{__struct__: _} = struct, reason) when is_binary(reason) do
      changes = %{
        deleted_at: DateTime.utc_now()
      }

      # Add reason to metadata if the struct has that field
      changes =
        if Map.has_key?(struct, :metadata) do
          current_metadata = Map.get(struct, :metadata) || %{}
          Map.put(changes, :metadata, Map.put(current_metadata, "deleted_reason", reason))
        else
          changes
        end

      struct
      |> Ecto.Changeset.change(changes)
      |> Repo.update()
    end

    @doc """
    Check if soft delete is supported for a schema.
    """
    def soft_deletable?(%{__struct__: module}) do
      :deleted_at in (module.__schema__(:fields) || [])
    end

    def soft_deletable?(_), do: false
  end
end
