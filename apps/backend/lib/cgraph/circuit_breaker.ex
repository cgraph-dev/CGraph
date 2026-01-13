defmodule CGraph.CircuitBreaker do
  @moduledoc """
  Circuit Breaker implementation for fault tolerance.
  
  Uses the :fuse library to implement the circuit breaker pattern.
  This protects the system from cascading failures when external
  services are unavailable.
  
  ## Usage
  
      # Install a fuse for an external service
      CGraph.CircuitBreaker.install(:external_api, %{
        threshold: 5,
        reset_timeout: 30_000
      })
      
      # Use the circuit breaker
      case CGraph.CircuitBreaker.call(:external_api, fn -> make_request() end) do
        {:ok, result} -> handle_success(result)
        {:error, :circuit_open} -> handle_fallback()
        {:error, reason} -> handle_error(reason)
      end
  """
  
  require Logger
  
  @default_options %{
    threshold: 5,           # Number of failures before opening
    reset_timeout: 30_000,  # Time (ms) before attempting to close
    strategy: :standard     # :standard or :fault_tolerance
  }
  
  @doc """
  Install a circuit breaker with the given name and options.
  """
  @spec install(atom(), map()) :: :ok | {:error, term()}
  def install(name, opts \\ %{}) do
    options = Map.merge(@default_options, opts)
    
    fuse_opts = case options.strategy do
      :standard ->
        {{:standard, options.threshold, options.reset_timeout}, {:reset, options.reset_timeout}}
      :fault_tolerance ->
        {{:fault_tolerance, options.threshold, options.reset_timeout}, {:reset, options.reset_timeout}}
    end
    
    case :fuse.install(name, fuse_opts) do
      :ok -> 
        Logger.info("Circuit breaker installed: #{name}")
        :ok
      error -> 
        Logger.error("Failed to install circuit breaker #{name}: #{inspect(error)}")
        error
    end
  end
  
  @doc """
  Execute a function through the circuit breaker.
  """
  @spec call(atom(), (() -> term())) :: {:ok, term()} | {:error, :circuit_open | term()}
  def call(name, fun) do
    case :fuse.ask(name, :sync) do
      :ok ->
        try do
          result = fun.()
          {:ok, result}
        rescue
          error ->
            :fuse.melt(name)
            Logger.warning("Circuit breaker #{name} recorded failure: #{inspect(error)}")
            {:error, error}
        catch
          :exit, reason ->
            :fuse.melt(name)
            Logger.warning("Circuit breaker #{name} recorded exit: #{inspect(reason)}")
            {:error, reason}
        end
        
      :blown ->
        Logger.debug("Circuit breaker #{name} is open, request rejected")
        {:error, :circuit_open}
        
      {:error, :not_found} ->
        Logger.warning("Circuit breaker #{name} not found, executing without protection")
        {:ok, fun.()}
    end
  end
  
  @doc """
  Execute with a fallback when the circuit is open.
  """
  @spec call_with_fallback(atom(), (() -> term()), (() -> term())) :: term()
  def call_with_fallback(name, fun, fallback) do
    case call(name, fun) do
      {:ok, result} -> result
      {:error, :circuit_open} -> fallback.()
      {:error, _} -> fallback.()
    end
  end
  
  @doc """
  Get the current status of a circuit breaker.
  """
  @spec status(atom()) :: :ok | :blown | {:error, :not_found}
  def status(name) do
    :fuse.ask(name, :sync)
  end
  
  @doc """
  Reset a circuit breaker.
  """
  @spec reset(atom()) :: :ok | {:error, term()}
  def reset(name) do
    case :fuse.reset(name) do
      :ok ->
        Logger.info("Circuit breaker reset: #{name}")
        :ok
      error ->
        Logger.error("Failed to reset circuit breaker #{name}: #{inspect(error)}")
        error
    end
  end
  
  @doc """
  Remove a circuit breaker.
  """
  @spec remove(atom()) :: :ok | {:error, term()}
  def remove(name) do
    :fuse.remove(name)
  end
  
  @doc """
  List all installed circuit breakers with their status.
  """
  @spec list_all() :: [{atom(), :ok | :blown}]
  def list_all do
    # Note: :fuse doesn't provide a built-in way to list all fuses
    # This would need to be tracked separately in an ETS table or similar
    []
  end
end
