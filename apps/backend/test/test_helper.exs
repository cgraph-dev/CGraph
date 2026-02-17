ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(CGraph.Repo, :manual)

# Force-load all application modules before tests run.
# This prevents function_exported?/3 from returning false
# in async tests due to modules not being loaded yet.
case :application.get_key(:cgraph, :modules) do
  {:ok, modules} -> Enum.each(modules, &Code.ensure_loaded!/1)
  _ -> :ok
end

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
  CGraph.Metrics,
  CGraph.Security.TokenBlacklist
] do
  case mod.start_link([]) do
    {:ok, _pid} -> :ok
    {:error, {:already_started, _pid}} -> :ok
    {:error, reason} ->
      IO.puts("Warning: Failed to start #{inspect(mod)}: #{inspect(reason)}")
  end
end
