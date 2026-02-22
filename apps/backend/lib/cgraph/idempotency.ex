defmodule CGraph.Idempotency do
  @moduledoc """
  CGraph.Idempotency - Idempotency Key Management System

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

        case CGraph.Idempotency.check(idempotency_key, params) do
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
            CGraph.Idempotency.store(lock, %{
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
        plug CGraphWeb.Plugs.Idempotency, ttl: :timer.hours(24)
      end

      scope "/api" do
        pipe_through [:api, :idempotent]

        post "/orders", OrderController, :create
        post "/payments", PaymentController, :create
      end

  ## Configuration

  Configure in `config/config.exs`:

      config :cgraph, CGraph.Idempotency,
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

  ## Sub-modules

  - `CGraph.Idempotency.Store` — ETS-backed record/lock management and cleanup
  - `CGraph.Idempotency.Helpers` — Validation, fingerprinting, and configuration
  """

  use GenServer

  alias CGraph.Idempotency.{Helpers, Store}

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

      case CGraph.Idempotency.check("key_123", params) do
        {:cached, response} ->
          # Return cached response

        {:ok, lock} ->
          # Execute and store result
          result = execute_operation()
          CGraph.Idempotency.store(lock, result)

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
  # Client API - Query Operations (delegated to Store)
  # ---------------------------------------------------------------------------

  @doc "Get the record for an idempotency key."
  @spec get(idempotency_key()) :: {:ok, record()} | {:error, :not_found}
  defdelegate get(key), to: Store

  @doc "Check if a key exists."
  @spec exists?(idempotency_key()) :: boolean()
  defdelegate exists?(key), to: Store

  @doc "Get statistics about idempotency records."
  @spec get_stats() :: map()
  defdelegate get_stats(), to: Store

  # ---------------------------------------------------------------------------
  # Client API - Plug Helpers (delegated to Helpers)
  # ---------------------------------------------------------------------------

  @doc "Extract idempotency key from a Plug connection."
  @spec get_key_from_conn(Plug.Conn.t()) :: idempotency_key() | nil
  defdelegate get_key_from_conn(conn), to: Helpers

  @doc """
  Compute a fingerprint for a request body.

  Used to detect when the same idempotency key is used with different request bodies.
  """
  @spec fingerprint(term()) :: fingerprint()
  defdelegate fingerprint(body), to: Helpers

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    Store.init_tables()
    schedule_cleanup()
    {:ok, %{config: Helpers.load_config()}}
  end

  @impl true
  def handle_call({:check, key, request_body}, _from, state) do
    result = Store.check_key(key, request_body)
    {:reply, result, state}
  end

  def handle_call({:store, lock, response}, _from, state) do
    result = Store.store_response(lock, response)
    {:reply, result, state}
  end

  def handle_call({:release, lock}, _from, state) do
    Store.release_lock(lock)
    {:reply, :ok, state}
  end

  def handle_call({:delete, key}, _from, state) do
    Store.delete_key(key)
    {:reply, :ok, state}
  end

  @impl true
  def handle_info(:cleanup, state) do
    Store.cleanup_expired()
    Store.cleanup_stale_locks()
    schedule_cleanup()
    {:noreply, state}
  end

  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp schedule_cleanup do
    interval = Helpers.get_config(:cleanup_interval)
    Process.send_after(self(), :cleanup, interval)
  end
end
