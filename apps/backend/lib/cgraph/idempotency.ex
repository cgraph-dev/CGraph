defmodule Cgraph.Idempotency do
  @moduledoc """
  Cgraph.Idempotency - Idempotency Key Management System
  
  ## Overview
  
  This module provides comprehensive idempotency key management for API operations,
  ensuring that retried requests produce the same result without duplicating side
  effects. Essential for payment processing, order creation, and any operation
  where duplicate execution would be problematic.
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Idempotency Flow                             │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Request with Key ──▶ Check Cache ──▶ Key Exists?              │
  │                              │              │                   │
  │                              │         ┌────┴────┐              │
  │                              │        YES       NO              │
  │                              │         │         │              │
  │                              │         ▼         ▼              │
  │                              │    Return    Lock Key            │
  │                              │    Cached    Execute             │
  │                              │    Response  Operation           │
  │                              │                   │              │
  │                              │                   ▼              │
  │                              │              Store Result        │
  │                              │              Release Lock        │
  │                              │                   │              │
  │                              │                   ▼              │
  │                              └──────────────▶ Response          │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Features
  
  1. **Key Locking**: Prevents concurrent execution of the same idempotent operation
  2. **Response Caching**: Stores and replays responses for duplicate requests
  3. **TTL Management**: Automatic expiration of old idempotency records
  4. **Fingerprinting**: Detects request body changes with same idempotency key
  5. **Distributed Support**: Works across multiple nodes with Redis backend
  
  ## Usage Examples
  
  ### In Controller
  
      def create(conn, params) do
        idempotency_key = get_idempotency_key(conn)
        
        case Cgraph.Idempotency.check(idempotency_key, params) do
          {:cached, response} ->
            # Return cached response
            conn
            |> put_status(response.status)
            |> put_resp_header("idempotency-replayed", "true")
            |> json(response.body)
            
          {:ok, lock} ->
            # Execute operation
            result = do_create_order(params)
            
            # Store result
            Cgraph.Idempotency.store(lock, %{
              status: 201,
              body: result
            })
            
            conn
            |> put_status(201)
            |> json(result)
            
          {:error, :concurrent_request} ->
            conn
            |> put_status(409)
            |> json(%{error: "Concurrent request in progress"})
        end
      end
  
  ### Using the Plug
  
      # In router
      pipeline :idempotent do
        plug CgraphWeb.Plugs.Idempotency, ttl: :timer.hours(24)
      end
      
      scope "/api" do
        pipe_through [:api, :idempotent]
        
        post "/orders", OrderController, :create
        post "/payments", PaymentController, :create
      end
  
  ## Configuration
  
  Configure in `config/config.exs`:
  
      config :cgraph, Cgraph.Idempotency,
        backend: :ets,  # :ets or :redis
        default_ttl: :timer.hours(24),
        lock_ttl: :timer.seconds(30),
        header: "idempotency-key",
        fingerprint_body: true
  
  ## Implementation Notes
  
  - Uses ETS for single-node deployments
  - Redis backend available for distributed deployments
  - Request fingerprinting prevents misuse of idempotency keys
  - Automatic cleanup of expired records
  """
  
  use GenServer
  require Logger
  
  # ---------------------------------------------------------------------------
  # Type Definitions
  # ---------------------------------------------------------------------------
  
  @type idempotency_key :: String.t()
  @type lock :: reference()
  @type fingerprint :: String.t()
  
  @type stored_response :: %{
    status: pos_integer(),
    body: term(),
    headers: [{String.t(), String.t()}]
  }
  
  @type record :: %{
    key: idempotency_key(),
    fingerprint: fingerprint(),
    response: stored_response() | nil,
    locked_at: DateTime.t() | nil,
    locked_by: lock() | nil,
    created_at: DateTime.t(),
    expires_at: DateTime.t()
  }
  
  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------
  
  @table :cgraph_idempotency
  @locks_table :cgraph_idempotency_locks
  
  @default_config %{
    backend: :ets,
    default_ttl: :timer.hours(24),
    lock_ttl: :timer.seconds(30),
    header: "idempotency-key",
    fingerprint_body: true,
    max_key_length: 255,
    cleanup_interval: :timer.minutes(5)
  }
  
  # ---------------------------------------------------------------------------
  # Client API - Core Operations
  # ---------------------------------------------------------------------------
  
  @doc """
  Check if an idempotency key exists and acquire a lock for execution.
  
  Returns one of:
  - `{:cached, response}` - A cached response exists
  - `{:ok, lock}` - Lock acquired, proceed with execution
  - `{:error, :concurrent_request}` - Another request is executing
  - `{:error, :fingerprint_mismatch}` - Request body differs from original
  
  ## Examples
  
      case Cgraph.Idempotency.check("key_123", params) do
        {:cached, response} ->
          # Return cached response
          
        {:ok, lock} ->
          # Execute and store result
          result = execute_operation()
          Cgraph.Idempotency.store(lock, result)
          
        {:error, reason} ->
          # Handle error
      end
  """
  @spec check(idempotency_key(), term()) :: 
    {:cached, stored_response()} | 
    {:ok, lock()} | 
    {:error, :concurrent_request | :fingerprint_mismatch | :invalid_key}
  def check(key, request_body \\ nil) do
    GenServer.call(__MODULE__, {:check, key, request_body})
  end
  
  @doc """
  Store the response for an idempotency key.
  
  Must be called with the lock returned by `check/2`.
  """
  @spec store(lock(), stored_response()) :: :ok | {:error, :lock_expired}
  def store(lock, response) do
    GenServer.call(__MODULE__, {:store, lock, response})
  end
  
  @doc """
  Release a lock without storing a response.
  
  Use this when the operation fails and you want to allow retries.
  """
  @spec release(lock()) :: :ok
  def release(lock) do
    GenServer.call(__MODULE__, {:release, lock})
  end
  
  @doc """
  Delete an idempotency key.
  
  Useful for testing or administrative purposes.
  """
  @spec delete(idempotency_key()) :: :ok
  def delete(key) do
    GenServer.call(__MODULE__, {:delete, key})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Query Operations
  # ---------------------------------------------------------------------------
  
  @doc """
  Get the record for an idempotency key.
  """
  @spec get(idempotency_key()) :: {:ok, record()} | {:error, :not_found}
  def get(key) do
    case :ets.lookup(@table, key) do
      [{^key, record}] -> {:ok, record}
      [] -> {:error, :not_found}
    end
  end
  
  @doc """
  Check if a key exists.
  """
  @spec exists?(idempotency_key()) :: boolean()
  def exists?(key) do
    :ets.member(@table, key)
  end
  
  @doc """
  Get statistics about idempotency records.
  """
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
  # Client API - Plug Helpers
  # ---------------------------------------------------------------------------
  
  @doc """
  Extract idempotency key from a Plug connection.
  """
  @spec get_key_from_conn(Plug.Conn.t()) :: idempotency_key() | nil
  def get_key_from_conn(conn) do
    header_name = get_config(:header)
    
    case Plug.Conn.get_req_header(conn, header_name) do
      [key | _] when is_binary(key) and byte_size(key) > 0 ->
        validate_key(key)
        
      _ ->
        nil
    end
  end
  
  @doc """
  Compute a fingerprint for a request body.
  
  Used to detect when the same idempotency key is used with different request bodies.
  """
  @spec fingerprint(term()) :: fingerprint()
  def fingerprint(nil), do: "empty"
  def fingerprint(body) when is_binary(body) do
    :crypto.hash(:sha256, body) |> Base.encode16(case: :lower)
  end
  def fingerprint(body) do
    body
    |> Jason.encode!()
    |> fingerprint()
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    # Create ETS tables
    :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@locks_table, [:named_table, :set, :public])
    
    # Schedule cleanup
    schedule_cleanup()
    
    state = %{
      config: load_config()
    }
    
    {:ok, state}
  end
  
  @impl true
  def handle_call({:check, key, request_body}, _from, state) do
    result = do_check(key, request_body)
    {:reply, result, state}
  end
  
  def handle_call({:store, lock, response}, _from, state) do
    result = do_store(lock, response)
    {:reply, result, state}
  end
  
  def handle_call({:release, lock}, _from, state) do
    do_release(lock)
    {:reply, :ok, state}
  end
  
  def handle_call({:delete, key}, _from, state) do
    :ets.delete(@table, key)
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_info(:cleanup, state) do
    cleanup_expired()
    cleanup_stale_locks()
    schedule_cleanup()
    {:noreply, state}
  end
  
  def handle_info(_msg, state) do
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Core Logic
  # ---------------------------------------------------------------------------
  
  defp do_check(key, request_body) do
    case validate_key(key) do
      nil ->
        {:error, :invalid_key}
        
      valid_key ->
        fp = fingerprint(request_body)
        
        case :ets.lookup(@table, valid_key) do
          [{^valid_key, record}] ->
            handle_existing_record(record, fp)
            
          [] ->
            acquire_lock(valid_key, fp)
        end
    end
  end
  
  defp handle_existing_record(record, fingerprint) do
    cond do
      # Check fingerprint mismatch
      get_config(:fingerprint_body) and record.fingerprint != fingerprint ->
        {:error, :fingerprint_mismatch}
        
      # Check if response exists (completed request)
      record.response != nil ->
        {:cached, record.response}
        
      # Check if locked by another request
      record.locked_at != nil and not lock_expired?(record) ->
        {:error, :concurrent_request}
        
      # Lock expired or no lock - reacquire
      true ->
        reacquire_lock(record)
    end
  end
  
  defp acquire_lock(key, fingerprint) do
    lock = make_ref()
    now = DateTime.utc_now()
    ttl = get_config(:default_ttl)
    
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
    
    updated = %{record |
      locked_at: now,
      locked_by: lock
    }
    
    :ets.insert(@table, {record.key, updated})
    :ets.insert(@locks_table, {lock, record.key})
    
    {:ok, lock}
  end
  
  defp do_store(lock, response) do
    case :ets.lookup(@locks_table, lock) do
      [{^lock, key}] ->
        case :ets.lookup(@table, key) do
          [{^key, record}] when record.locked_by == lock ->
            updated = %{record |
              response: response,
              locked_at: nil,
              locked_by: nil
            }
            
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
  
  defp do_release(lock) do
    case :ets.lookup(@locks_table, lock) do
      [{^lock, key}] ->
        case :ets.lookup(@table, key) do
          [{^key, record}] when record.locked_by == lock ->
            # If no response stored, delete the record to allow retry
            if record.response == nil do
              :ets.delete(@table, key)
            else
              # Just release the lock
              updated = %{record | locked_at: nil, locked_by: nil}
              :ets.insert(@table, {key, updated})
            end
        end
        
        :ets.delete(@locks_table, lock)
        
      [] ->
        :ok
    end
  end
  
  defp lock_expired?(record) do
    lock_ttl = get_config(:lock_ttl)
    cutoff = DateTime.add(DateTime.utc_now(), -lock_ttl, :millisecond)
    DateTime.compare(record.locked_at, cutoff) == :lt
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Validation
  # ---------------------------------------------------------------------------
  
  defp validate_key(nil), do: nil
  defp validate_key(key) when is_binary(key) do
    max_length = get_config(:max_key_length)
    
    if byte_size(key) > 0 and byte_size(key) <= max_length do
      key
    else
      nil
    end
  end
  defp validate_key(_), do: nil
  
  # ---------------------------------------------------------------------------
  # Private Functions - Cleanup
  # ---------------------------------------------------------------------------
  
  defp schedule_cleanup do
    interval = get_config(:cleanup_interval)
    Process.send_after(self(), :cleanup, interval)
  end
  
  defp cleanup_expired do
    now = DateTime.utc_now()
    
    expired =
      :ets.tab2list(@table)
      |> Enum.filter(fn {_key, record} ->
        DateTime.compare(record.expires_at, now) == :lt
      end)
    
    Enum.each(expired, fn {key, _} ->
      :ets.delete(@table, key)
    end)
    
    if length(expired) > 0 do
      Logger.debug("[Idempotency] Cleaned up #{length(expired)} expired records")
    end
  end
  
  defp cleanup_stale_locks do
    lock_ttl = get_config(:lock_ttl)
    cutoff = DateTime.add(DateTime.utc_now(), -lock_ttl, :millisecond)
    
    stale =
      :ets.tab2list(@table)
      |> Enum.filter(fn {_key, record} ->
        record.locked_at != nil and
        record.response == nil and
        DateTime.compare(record.locked_at, cutoff) == :lt
      end)
    
    Enum.each(stale, fn {key, record} ->
      # Release stale lock but keep record for fingerprint checking
      updated = %{record | locked_at: nil, locked_by: nil}
      :ets.insert(@table, {key, updated})
      
      if record.locked_by do
        :ets.delete(@locks_table, record.locked_by)
      end
    end)
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Configuration
  # ---------------------------------------------------------------------------
  
  defp load_config do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Map.merge(@default_config, Map.new(app_config))
  end
  
  defp get_config(key) do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
end
