defmodule Cgraph.Security.PasswordBreachCheck do
  @moduledoc """
  Password breach detection using HaveIBeenPwned API with k-anonymity.

  ## Overview

  Checks if a password has been exposed in known data breaches using the
  HaveIBeenPwned Passwords API. Uses k-anonymity to ensure the password
  is never sent to the API - only a partial hash is transmitted.

  ## How It Works

  1. Hash the password with SHA-1
  2. Send only the first 5 characters of the hash to HIBP
  3. HIBP returns all hashes starting with those 5 characters
  4. Check if the full hash exists in the returned set
  5. If found, the password has been breached

  ## Privacy Guarantee

  Using k-anonymity means:
  - The full password never leaves the server
  - HIBP never sees the complete hash
  - HIBP cannot determine which hash you're checking
  - Approximately 500 hashes are returned per request

  ## Usage

      case PasswordBreachCheck.check(password) do
        {:ok, :safe} -> 
          # Password not found in breaches
          proceed_with_registration()
        
        {:ok, {:breached, count}} ->
          # Password found in `count` breaches
          warn_user_or_reject()
        
        {:error, reason} ->
          # API error, consider allowing (fail open)
          proceed_with_caution()
      end

      # Async check (returns immediately, logs result)
      PasswordBreachCheck.check_async(password, user_id: user.id)

  ## Configuration

      config :cgraph, Cgraph.Security.PasswordBreachCheck,
        enabled: true,
        reject_threshold: 1,  # Reject if found this many times
        warn_threshold: 0,    # Warn if found at all
        timeout: 5000,
        cache_ttl: 86400      # Cache results for 24 hours

  ## Telemetry Events

  - `[:cgraph, :security, :password_breach_check]` - Check performed
  - `[:cgraph, :security, :password_breached]` - Breached password detected
  """

  require Logger

  @hibp_api_url "https://api.pwnedpasswords.com/range/"
  @user_agent "CGraph-PasswordCheck/1.0"
  @default_timeout 5000
  @cache_prefix "hibp_check:"

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type password :: String.t()
  @type check_result :: {:ok, :safe} | {:ok, {:breached, pos_integer()}} | {:error, term()}

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Check if a password has been exposed in data breaches.

  ## Options

  - `:timeout` - HTTP request timeout (default: 5000ms)
  - `:use_cache` - Whether to use cached results (default: true)

  ## Returns

  - `{:ok, :safe}` - Password not found in any breaches
  - `{:ok, {:breached, count}}` - Password found in `count` breaches
  - `{:error, reason}` - API or network error
  """
  @spec check(password(), keyword()) :: check_result()
  def check(password, opts \\ []) when is_binary(password) do
    if enabled?() do
      do_check(password, opts)
    else
      {:ok, :safe}
    end
  end

  @doc """
  Check password asynchronously.

  Spawns a process to perform the check. Useful for non-blocking
  checks during registration where you want to log but not block.

  ## Options

  - `:user_id` - User ID for audit logging
  - `:on_breached` - Callback function if password is breached
  """
  @spec check_async(password(), keyword()) :: :ok
  def check_async(password, opts \\ []) do
    user_id = Keyword.get(opts, :user_id)
    on_breached = Keyword.get(opts, :on_breached)
    
    Task.start(fn ->
      case check(password) do
        {:ok, {:breached, count}} ->
          log_breach_detected(password, count, user_id)
          if on_breached, do: on_breached.({:breached, count})
        
        _ ->
          :ok
      end
    end)
    
    :ok
  end

  @doc """
  Validate password is not breached, returning error if it is.

  Useful in changeset validations.

  ## Options

  - `:threshold` - Minimum breach count to reject (default: 1)
  """
  @spec validate(password(), keyword()) :: :ok | {:error, String.t()}
  def validate(password, opts \\ []) do
    threshold = Keyword.get(opts, :threshold, get_reject_threshold())
    
    case check(password) do
      {:ok, :safe} -> 
        :ok
      
      {:ok, {:breached, count}} when count >= threshold ->
        {:error, "This password has appeared in #{count} data breach(es) and cannot be used"}
      
      {:ok, {:breached, _count}} ->
        :ok  # Below threshold
      
      {:error, _reason} ->
        # Fail open - allow password if API is unavailable
        :ok
    end
  end

  @doc """
  Add breach check validation to an Ecto changeset.

  ## Usage

      user_changeset
      |> validate_password_not_breached(:password)
  """
  @spec validate_changeset(Ecto.Changeset.t(), atom(), keyword()) :: Ecto.Changeset.t()
  def validate_changeset(changeset, field, opts \\ []) do
    Ecto.Changeset.validate_change(changeset, field, fn _, password ->
      case validate(password, opts) do
        :ok -> []
        {:error, message} -> [{field, message}]
      end
    end)
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp do_check(password, opts) do
    use_cache = Keyword.get(opts, :use_cache, true)
    timeout = Keyword.get(opts, :timeout, @default_timeout)
    
    # Generate SHA-1 hash of the password
    hash = hash_password(password)
    prefix = String.slice(hash, 0, 5)
    suffix = String.slice(hash, 5..-1//1)
    
    # Check cache first
    if use_cache do
      case check_cache(hash) do
        {:ok, result} -> {:ok, result}
        :miss -> fetch_and_check(prefix, suffix, timeout, hash)
      end
    else
      fetch_and_check(prefix, suffix, timeout, hash)
    end
  end

  defp fetch_and_check(prefix, suffix, timeout, full_hash) do
    start_time = System.monotonic_time()
    
    case fetch_range(prefix, timeout) do
      {:ok, response_body} ->
        result = find_suffix_in_response(suffix, response_body)
        
        # Cache the result
        cache_result(full_hash, result)
        
        # Emit telemetry
        duration = System.monotonic_time() - start_time
        emit_check_telemetry(result, duration)
        
        {:ok, result}
      
      {:error, reason} ->
        Logger.warning("HIBP API error: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp fetch_range(prefix, timeout) do
    url = "#{@hibp_api_url}#{prefix}"
    headers = [
      {"user-agent", @user_agent},
      {"accept", "text/plain"}
    ]
    
    # Use Finch for HTTP requests
    request = Finch.build(:get, url, headers)
    
    case Finch.request(request, Cgraph.Finch, receive_timeout: timeout) do
      {:ok, %Finch.Response{status: 200, body: body}} ->
        {:ok, body}
      
      {:ok, %Finch.Response{status: status}} ->
        {:error, {:http_error, status}}
      
      {:error, reason} ->
        {:error, reason}
    end
  end

  defp find_suffix_in_response(suffix, response_body) do
    suffix_upper = String.upcase(suffix)
    
    response_body
    |> String.split("\r\n")
    |> Enum.find_value(:safe, fn line ->
      case String.split(line, ":") do
        [hash_suffix, count_str] ->
          if String.upcase(hash_suffix) == suffix_upper do
            count = String.to_integer(String.trim(count_str))
            {:breached, count}
          else
            nil
          end
        _ ->
          nil
      end
    end)
  end

  defp hash_password(password) do
    :crypto.hash(:sha, password)
    |> Base.encode16(case: :upper)
  end

  # Cache operations

  defp check_cache(hash) do
    key = "#{@cache_prefix}#{hash}"
    
    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} -> :miss
      {:ok, :safe} -> {:ok, :safe}
      {:ok, {:breached, count}} -> {:ok, {:breached, count}}
      _ -> :miss
    end
  end

  defp cache_result(hash, result) do
    key = "#{@cache_prefix}#{hash}"
    ttl = get_cache_ttl()
    
    Cachex.put(:cgraph_cache, key, result, ttl: ttl * 1000)
  rescue
    _ -> :ok
  end

  # Configuration

  defp enabled? do
    config()[:enabled] != false
  end

  defp get_reject_threshold do
    config()[:reject_threshold] || 1
  end

  defp get_cache_ttl do
    config()[:cache_ttl] || 86_400
  end

  defp config do
    Application.get_env(:cgraph, __MODULE__, [])
  end

  # Logging and telemetry

  defp log_breach_detected(_password, count, user_id) do
    # Note: Never log the actual password!
    Logger.warning("Breached password detected: found in #{count} breaches, user_id: #{inspect(user_id)}")
    
    if user_id do
      Cgraph.Audit.log(:security, :breached_password_used, %{
        user_id: user_id,
        breach_count: count
      })
    end
    
    :telemetry.execute(
      [:cgraph, :security, :password_breached],
      %{breach_count: count},
      %{user_id: user_id}
    )
  rescue
    _ -> :ok
  end

  defp emit_check_telemetry(result, duration) do
    breached = case result do
      {:breached, _} -> true
      _ -> false
    end
    
    :telemetry.execute(
      [:cgraph, :security, :password_breach_check],
      %{duration: duration},
      %{breached: breached}
    )
  end
end
