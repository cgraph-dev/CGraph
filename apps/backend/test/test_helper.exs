ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(CGraph.Repo, :manual)

# Import ExMachina factory helpers in all tests
{:ok, _} = Application.ensure_all_started(:ex_machina)

# Start GenServers that tests depend on but aren't in the test supervision tree.
# These are standalone services (health check, feature flags, etc.) that tests call directly.
for mod <- [
  CGraph.HealthCheck,
  CGraph.FeatureFlags,
  CGraph.Events,
  CGraph.ErrorReporter,
  CGraph.ConnectionPool,
  CGraph.Idempotency,
  CGraph.Webhooks
] do
  case mod.start_link([]) do
    {:ok, _pid} -> :ok
    {:error, {:already_started, _pid}} -> :ok
    {:error, reason} ->
      IO.puts("Warning: Failed to start #{inspect(mod)}: #{inspect(reason)}")
  end
end
