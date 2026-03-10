defmodule CGraph.Security.JWTKeyRotation do
  @moduledoc """
  JWT signing key rotation for Guardian.

  Implements a dual-key strategy where:
  - The **primary key** signs new tokens
  - The **previous key** remains valid for verification during grace period
  - Keys rotate on a configurable schedule (default: 30 days)

  ## Environment Variables

  - `JWT_SECRET` - Current/primary signing key (required)
  - `JWT_SECRET_PREVIOUS` - Previous key for grace period verification (optional)
  - `JWT_ROTATION_GRACE_DAYS` - Days to accept old key after rotation (default: 7)

  ## Rotation Workflow

  1. Generate new key: `mix phx.gen.secret`
  2. Set `JWT_SECRET_PREVIOUS` to current `JWT_SECRET`
  3. Set `JWT_SECRET` to new key
  4. Deploy with rolling restart
  5. After grace period, remove `JWT_SECRET_PREVIOUS`

  ## Automatic Rotation (Optional)

  For automated rotation, this module can integrate with:
  - HashiCorp Vault (transit secrets engine)
  - AWS Secrets Manager with rotation lambda
  - Azure Key Vault with automatic rotation

  ## Security Notes

  - Keys should be at least 256 bits (32 bytes) for HS256
  - Never log or expose keys in error messages
  - Consider RS256 for multi-service architectures
  """

  use GenServer
  require Logger

  @type key_info :: %{
    key: binary(),
    id: binary(),
    created_at: DateTime.t(),
    expires_at: DateTime.t() | nil
  }

  @default_grace_days 7
  @rotation_check_interval :timer.hours(1)

  # ============================================================================
  # Client API
  # ============================================================================

  @doc """
  Start the key rotation manager.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Get the current primary signing key.

  Returns the key used to sign new tokens.
  """
  @spec current_key() :: binary()
  def current_key do
    GenServer.call(__MODULE__, :current_key)
  catch
    :exit, _ ->
      # Fallback if GenServer not started (during config load)
      primary_key_from_env()
  end

  @doc """
  Get all valid keys for verification (primary + previous during grace period).

  Guardian will try each key until one verifies the signature.
  """
  @spec verification_keys() :: [binary()]
  def verification_keys do
    GenServer.call(__MODULE__, :verification_keys)
  catch
    :exit, _ ->
      # Fallback if GenServer not started
      [primary_key_from_env() | previous_keys_from_env()]
      |> Enum.reject(&is_nil/1)
  end

  @doc """
  Get key info for monitoring/debugging.

  Returns metadata about current and previous keys without exposing the keys.
  """
  @spec key_info() :: %{
    primary: %{id: binary(), created_at: DateTime.t()},
    previous: [%{id: binary(), expires_at: DateTime.t()}] | nil
  }
  def key_info do
    GenServer.call(__MODULE__, :key_info)
  end

  @doc """
  Trigger a key rotation (for testing or emergency rotation).

  In production, prefer environment variable rotation with deploys.
  """
  @spec rotate_keys() :: :ok | {:error, term()}
  def rotate_keys do
    GenServer.call(__MODULE__, :rotate_keys)
  end

  @doc """
  Check if a key ID is still valid for verification.
  """
  @spec key_valid?(binary()) :: boolean()
  def key_valid?(key_id) do
    GenServer.call(__MODULE__, {:key_valid?, key_id})
  end

  # ============================================================================
  # GenServer Implementation
  # ============================================================================

  @impl true
  @spec init(keyword()) :: {:ok, map()}
  def init(_opts) do
    state = %{
      primary_key: primary_key_from_env(),
      primary_key_id: generate_key_id(primary_key_from_env()),
      primary_created_at: DateTime.utc_now(),
      previous_keys: load_previous_keys(),
      grace_days: grace_days_from_env()
    }

    # Schedule periodic cleanup of expired previous keys
    Process.send_after(self(), :cleanup_expired_keys, @rotation_check_interval)

    Logger.info("jwtkeyrotation_initialized_with_previous_key_s", state_previous_keys_count: inspect(length(state.previous_keys)))

    {:ok, state}
  end

  @impl true
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  def handle_call(:current_key, _from, state) do
    {:reply, state.primary_key, state}
  end

  @impl true
  def handle_call(:verification_keys, _from, state) do
    now = DateTime.utc_now()

    valid_previous =
      state.previous_keys
      |> Enum.filter(fn %{expires_at: exp} ->
        is_nil(exp) or DateTime.compare(exp, now) == :gt
      end)
      |> Enum.map(& &1.key)

    keys = [state.primary_key | valid_previous]
    {:reply, keys, state}
  end

  @impl true
  def handle_call(:key_info, _from, state) do
    now = DateTime.utc_now()

    info = %{
      primary: %{
        id: state.primary_key_id,
        created_at: state.primary_created_at
      },
      previous: Enum.map(state.previous_keys, fn prev ->
        %{
          id: prev.id,
          expires_at: prev.expires_at,
          expired: prev.expires_at && DateTime.compare(prev.expires_at, now) != :gt
        }
      end),
      grace_days: state.grace_days
    }

    {:reply, info, state}
  end

  @impl true
  def handle_call(:rotate_keys, _from, state) do
    # This is for manual/emergency rotation
    # In production, rotation happens via env var changes + deploy
    Logger.warning("[JWTKeyRotation] Manual key rotation triggered")

    new_key = :crypto.strong_rand_bytes(32) |> Base.url_encode64()
    new_key_id = generate_key_id(new_key)
    now = DateTime.utc_now()

    # Move current primary to previous
    previous_entry = %{
      key: state.primary_key,
      id: state.primary_key_id,
      created_at: state.primary_created_at,
      expires_at: DateTime.add(now, state.grace_days * 24 * 3600, :second)
    }

    new_state = %{state |
      primary_key: new_key,
      primary_key_id: new_key_id,
      primary_created_at: now,
      previous_keys: [previous_entry | state.previous_keys]
    }

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:key_valid?, key_id}, _from, state) do
    now = DateTime.utc_now()

    valid =
      state.primary_key_id == key_id or
      Enum.any?(state.previous_keys, fn prev ->
        prev.id == key_id and
        (is_nil(prev.expires_at) or DateTime.compare(prev.expires_at, now) == :gt)
      end)

    {:reply, valid, state}
  end

  @impl true
  @spec handle_info(:cleanup_expired_keys, map()) :: {:noreply, map()}
  def handle_info(:cleanup_expired_keys, state) do
    now = DateTime.utc_now()

    {expired, valid} =
      Enum.split_with(state.previous_keys, fn prev ->
        prev.expires_at && DateTime.compare(prev.expires_at, now) != :gt
      end)

    unless expired == [] do
      Logger.info("jwtkeyrotation_cleaned_up_expired_key_s", expired_count: inspect(length(expired)))
    end

    # Schedule next cleanup
    Process.send_after(self(), :cleanup_expired_keys, @rotation_check_interval)

    {:noreply, %{state | previous_keys: valid}}
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp primary_key_from_env do
    System.get_env("JWT_SECRET") ||
      Application.get_env(:cgraph, CGraph.Guardian)[:secret_key] ||
      raise "JWT_SECRET environment variable is required"
  end

  defp previous_keys_from_env do
    case System.get_env("JWT_SECRET_PREVIOUS") do
      nil -> []
      "" -> []
      prev_key -> [prev_key]
    end
  end

  defp load_previous_keys do
    grace_days = grace_days_from_env()
    now = DateTime.utc_now()

    previous_keys_from_env()
    |> Enum.map(fn key ->
      %{
        key: key,
        id: generate_key_id(key),
        created_at: nil,  # Unknown for env-loaded keys
        expires_at: DateTime.add(now, grace_days * 24 * 3600, :second)
      }
    end)
  end

  defp grace_days_from_env do
    case System.get_env("JWT_ROTATION_GRACE_DAYS") do
      nil -> @default_grace_days
      days -> String.to_integer(days)
    end
  end

  defp generate_key_id(key) when is_binary(key) do
    :crypto.hash(:sha256, key)
    |> Base.url_encode64(padding: false)
    |> binary_part(0, 8)
  end

  defp generate_key_id(_), do: "unknown"
end
