defmodule CGraph.Idempotency.Store do
  @moduledoc """
  ETS-backed store for idempotency records and lock management.

  Handles key lookup, lock acquisition/release, response storage,
  and automatic cleanup of expired records and stale locks.

  This module owns the two ETS tables used by the idempotency system:
  - `:cgraph_idempotency` — idempotency records
  - `:cgraph_idempotency_locks` — active lock references
  """

  require Logger

  alias CGraph.Idempotency.Helpers

  @table :cgraph_idempotency
  @locks_table :cgraph_idempotency_locks

  # ---------------------------------------------------------------------------
  # Table Management
  # ---------------------------------------------------------------------------

  @doc "Create the ETS tables used by the idempotency system."
  @spec init_tables() :: :ok
  def init_tables do
    :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@locks_table, [:named_table, :set, :public])
    :ok
  end

  # ---------------------------------------------------------------------------
  # Query Operations
  # ---------------------------------------------------------------------------

  @doc "Get the record for an idempotency key."
  @spec get(String.t()) :: {:ok, map()} | {:error, :not_found}
  def get(key) do
    case :ets.lookup(@table, key) do
      [{^key, record}] -> {:ok, record}
      [] -> {:error, :not_found}
    end
  end

  @doc "Check if a key exists."
  @spec exists?(String.t()) :: boolean()
  def exists?(key) do
    :ets.member(@table, key)
  end

  @doc "Get statistics about idempotency records."
  @spec get_stats() :: map()
  def get_stats do
    records = :ets.tab2list(@table)
    locks = :ets.tab2list(@locks_table)
    now = DateTime.utc_now()

    %{
      total_records: length(records),
      active_locks: length(locks),
      with_responses: Enum.count(records, fn {_, r} -> r.response != nil end),
      expired: Enum.count(records, fn {_, r} -> DateTime.compare(r.expires_at, now) == :lt end)
    }
  end

  # ---------------------------------------------------------------------------
  # Core Operations
  # ---------------------------------------------------------------------------

  @doc """
  Check an idempotency key and acquire a lock if available.

  Returns:
  - `{:cached, response}` — cached response exists
  - `{:ok, lock}` — lock acquired, proceed with execution
  - `{:error, :concurrent_request}` — another request holds the lock
  - `{:error, :fingerprint_mismatch}` — request body changed
  - `{:error, :invalid_key}` — key failed validation
  """
  @spec check_key(String.t(), term()) ::
          {:cached, map()} | {:ok, reference()} | {:error, atom()}
  def check_key(key, request_body) do
    case Helpers.validate_key(key) do
      nil ->
        {:error, :invalid_key}

      valid_key ->
        fp = Helpers.fingerprint(request_body)

        case :ets.lookup(@table, valid_key) do
          [{^valid_key, record}] ->
            handle_existing_record(record, fp)

          [] ->
            acquire_lock(valid_key, fp)
        end
    end
  end

  @doc """
  Store a response for a locked idempotency key.

  Must be called with the lock reference returned by `check_key/2`.
  """
  @spec store_response(reference(), map()) :: :ok | {:error, :lock_expired}
  def store_response(lock, response) do
    case :ets.lookup(@locks_table, lock) do
      [{^lock, key}] ->
        case :ets.lookup(@table, key) do
          [{^key, record}] when record.locked_by == lock ->
            updated = %{record | response: response, locked_at: nil, locked_by: nil}
            :ets.insert(@table, {key, updated})
            :ets.delete(@locks_table, lock)
            :ok

          _ ->
            {:error, :lock_expired}
        end

      [] ->
        {:error, :lock_expired}
    end
  end

  @doc """
  Release a lock without storing a response.

  Use when the operation fails and retries should be allowed.
  """
  @spec release_lock(reference()) :: :ok
  def release_lock(lock) do
    case :ets.lookup(@locks_table, lock) do
      [{^lock, key}] -> release_lock_for_key(lock, key)
      [] -> :ok
    end
  end

  @doc "Delete an idempotency key from the store."
  @spec delete_key(String.t()) :: true
  def delete_key(key) do
    :ets.delete(@table, key)
  end

  # ---------------------------------------------------------------------------
  # Cleanup
  # ---------------------------------------------------------------------------

  @doc "Remove all expired idempotency records."
  @spec cleanup_expired() :: :ok
  def cleanup_expired do
    now = DateTime.utc_now()

    expired =
      :ets.tab2list(@table)
      |> Enum.filter(fn {_key, record} ->
        DateTime.compare(record.expires_at, now) == :lt
      end)

    Enum.each(expired, fn {key, _} ->
      :ets.delete(@table, key)
    end)

    unless Enum.empty?(expired) do
      Logger.debug("idempotency_cleaned_up_expired_records",
        expired_count: inspect(length(expired))
      )
    end

    :ok
  end

  @doc "Release locks that have exceeded the lock TTL."
  @spec cleanup_stale_locks() :: :ok
  def cleanup_stale_locks do
    lock_ttl = Helpers.get_config(:lock_ttl)
    cutoff = DateTime.add(DateTime.utc_now(), -lock_ttl, :millisecond)

    stale =
      :ets.tab2list(@table)
      |> Enum.filter(fn {_key, record} ->
        record.locked_at != nil and
          record.response == nil and
          DateTime.compare(record.locked_at, cutoff) == :lt
      end)

    Enum.each(stale, fn {key, record} ->
      updated = %{record | locked_at: nil, locked_by: nil}
      :ets.insert(@table, {key, updated})

      if record.locked_by do
        :ets.delete(@locks_table, record.locked_by)
      end
    end)

    :ok
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp handle_existing_record(record, fingerprint) do
    cond do
      Helpers.get_config(:fingerprint_body) and record.fingerprint != fingerprint ->
        {:error, :fingerprint_mismatch}

      record.response != nil ->
        {:cached, record.response}

      record.locked_at != nil and not lock_expired?(record) ->
        {:error, :concurrent_request}

      true ->
        reacquire_lock(record)
    end
  end

  defp acquire_lock(key, fingerprint) do
    lock = make_ref()
    now = DateTime.utc_now()
    ttl = Helpers.get_config(:default_ttl)

    record = %{
      key: key,
      fingerprint: fingerprint,
      response: nil,
      locked_at: now,
      locked_by: lock,
      created_at: now,
      expires_at: DateTime.add(now, ttl, :millisecond)
    }

    :ets.insert(@table, {key, record})
    :ets.insert(@locks_table, {lock, key})

    {:ok, lock}
  end

  defp reacquire_lock(record) do
    lock = make_ref()
    now = DateTime.utc_now()

    updated = %{record | locked_at: now, locked_by: lock}

    :ets.insert(@table, {record.key, updated})
    :ets.insert(@locks_table, {lock, record.key})

    {:ok, lock}
  end

  defp release_lock_for_key(lock, key) do
    update_locked_record(lock, key)
    :ets.delete(@locks_table, lock)
  end

  defp update_locked_record(lock, key) do
    case :ets.lookup(@table, key) do
      [{^key, record}] when record.locked_by == lock -> clear_or_delete_record(key, record)
      _ -> :ok
    end
  end

  defp clear_or_delete_record(key, %{response: nil}), do: :ets.delete(@table, key)

  defp clear_or_delete_record(key, record) do
    updated = %{record | locked_at: nil, locked_by: nil}
    :ets.insert(@table, {key, updated})
  end

  defp lock_expired?(record) do
    lock_ttl = Helpers.get_config(:lock_ttl)
    cutoff = DateTime.add(DateTime.utc_now(), -lock_ttl, :millisecond)
    DateTime.compare(record.locked_at, cutoff) == :lt
  end
end
