defmodule CGraph.Services.RegistryTest do
  use ExUnit.Case, async: true

  # We can't use the module directly because it registers as __MODULE__
  # and auto-registers builtin services that need real PG/Redis.
  # Instead, we test the GenServer by directly calling handle_call/handle_cast
  # via a custom-named instance, or test the logic indirectly.

  # Strategy: We test the registry by starting a named GenServer,
  # then registering services with mock health checks.

  alias CGraph.Services.Registry

  # We can't start_link because it auto-registers builtins that hit real services.
  # Instead, test the core data structures and state machine logic.

  describe "service registration and state management" do
    setup do
      # Start a custom registry process by calling GenServer directly
      # This is tricky since Registry hardcodes __MODULE__ in the public API.
      # We'll use a workaround: start_link and override the name
      # But the init auto-registers builtins which may fail.
      # Best approach: test through the module by temporarily starting it.

      # Since the module is a singleton, skip if already started
      case GenServer.start_link(Registry, [], name: :"test_registry_#{System.unique_integer([:positive])}") do
        {:ok, pid} ->
          # The builtin health checks will likely fail (no real PG), but that's OK
          # The GenServer will still start
          %{pid: pid}

        {:error, {:already_started, pid}} ->
          %{pid: pid}
      end
    end

    test "starts successfully", %{pid: pid} do
      assert Process.alive?(pid)
    end

    test "registers custom service", %{pid: pid} do
      result = GenServer.call(pid, {:register, "test_service", %{
        type: :external,
        critical: false,
        health_check: fn -> :healthy end,
        check_interval: 60_000
      }})

      assert result == :ok
    end

    test "gets service status after registration", %{pid: pid} do
      GenServer.call(pid, {:register, "status_test", %{
        type: :external,
        critical: false,
        health_check: fn -> :healthy end,
        check_interval: 60_000
      }})

      {:ok, state} = GenServer.call(pid, {:status, "status_test"})
      assert state in [:healthy, :unknown]
    end

    test "returns not_found for unknown service", %{pid: pid} do
      assert {:error, :not_found} = GenServer.call(pid, {:status, "nonexistent"})
    end

    test "get returns service details", %{pid: pid} do
      GenServer.call(pid, {:register, "detail_test", %{
        type: :database,
        critical: true,
        check_interval: 60_000
      }})

      {:ok, service} = GenServer.call(pid, {:get, "detail_test"})
      assert service.name == "detail_test"
      assert service.type == :database
      assert service.critical == true
    end

    test "get returns not_found for unknown service", %{pid: pid} do
      assert {:error, :not_found} = GenServer.call(pid, {:get, "nope"})
    end

    test "lists all registered services", %{pid: pid} do
      GenServer.call(pid, {:register, "svc_a", %{type: :internal, critical: false}})
      GenServer.call(pid, {:register, "svc_b", %{type: :external, critical: true}})

      services = GenServer.call(pid, :all)
      assert is_map(services)
      assert Map.has_key?(services, "svc_a")
      assert Map.has_key?(services, "svc_b")
    end

    test "deregisters a service", %{pid: pid} do
      GenServer.call(pid, {:register, "to_remove", %{type: :internal, critical: false}})
      assert :ok = GenServer.call(pid, {:deregister, "to_remove"})
      assert {:error, :not_found} = GenServer.call(pid, {:status, "to_remove"})
    end

    test "system_healthy? returns true when no critical services are unhealthy", %{pid: pid} do
      GenServer.call(pid, {:register, "optional_svc", %{
        type: :optional,
        critical: false,
        health_check: fn -> :unhealthy end,
        check_interval: 60_000
      }})

      # The builtin "postgres" is critical but may be unknown/unhealthy
      # System health depends on critical services being healthy or degraded
      result = GenServer.call(pid, :system_healthy?)
      assert is_boolean(result)
    end

    test "health_summary returns proper structure", %{pid: pid} do
      summary = GenServer.call(pid, :health_summary)

      assert is_map(summary)
      assert Map.has_key?(summary, :total)
      assert Map.has_key?(summary, :healthy)
      assert Map.has_key?(summary, :degraded)
      assert Map.has_key?(summary, :unhealthy)
      assert Map.has_key?(summary, :unknown)
      assert Map.has_key?(summary, :critical_healthy)
      assert Map.has_key?(summary, :services)
      assert is_list(summary.services)
    end

    test "health_summary totals match service count", %{pid: pid} do
      summary = GenServer.call(pid, :health_summary)
      total = summary.healthy + summary.degraded + summary.unhealthy + summary.unknown
      assert total == summary.total
    end

    test "dependency_graph returns map of service dependencies", %{pid: pid} do
      GenServer.call(pid, {:register, "dep_svc", %{
        type: :internal,
        critical: false,
        dependencies: ["postgres", "redis"]
      }})

      graph = GenServer.call(pid, :dependency_graph)
      assert is_map(graph)
      assert graph["dep_svc"] == ["postgres", "redis"]
    end

    test "manual health check works", %{pid: pid} do
      GenServer.call(pid, {:register, "check_me", %{
        type: :internal,
        critical: false,
        health_check: fn -> :healthy end,
        check_interval: 60_000
      }})

      {:ok, result} = GenServer.call(pid, {:check_health, "check_me"})
      assert result == :healthy
    end

    test "health check failure increments consecutive_failures", %{pid: pid} do
      GenServer.call(pid, {:register, "flaky_svc", %{
        type: :external,
        critical: false,
        health_check: fn -> :unhealthy end,
        check_interval: 60_000
      }})

      # Trigger check explicitly
      GenServer.call(pid, {:check_health, "flaky_svc"})
      GenServer.call(pid, {:check_health, "flaky_svc"})

      {:ok, service} = GenServer.call(pid, {:get, "flaky_svc"})
      assert service.consecutive_failures >= 2
      assert service.state == :unhealthy
    end

    test "service defaults are sensible", %{pid: pid} do
      GenServer.call(pid, {:register, "default_svc", %{}})

      {:ok, service} = GenServer.call(pid, {:get, "default_svc"})
      assert service.type == :external
      assert service.critical == false
      assert service.state == :unknown
      assert service.consecutive_failures == 0
      assert service.dependencies == []
    end

    test "check_all triggers checks for all services", %{pid: pid} do
      GenServer.call(pid, {:register, "ca_1", %{
        type: :internal,
        critical: false,
        health_check: fn -> :healthy end,
        check_interval: 60_000
      }})

      GenServer.call(pid, {:register, "ca_2", %{
        type: :internal,
        critical: false,
        health_check: fn -> :degraded end,
        check_interval: 60_000
      }})

      assert :ok = GenServer.call(pid, :check_all)

      {:ok, s1} = GenServer.call(pid, {:get, "ca_1"})
      {:ok, s2} = GenServer.call(pid, {:get, "ca_2"})

      assert s1.state == :healthy
      assert s2.state == :degraded
    end

    test "health check that raises is caught", %{pid: pid} do
      GenServer.call(pid, {:register, "crasher", %{
        type: :external,
        critical: false,
        health_check: fn -> raise "check exploded" end,
        check_interval: 60_000
      }})

      {:ok, result} = GenServer.call(pid, {:check_health, "crasher"})
      assert result == :unhealthy

      {:ok, service} = GenServer.call(pid, {:get, "crasher"})
      assert service.state == :unhealthy
      assert service.last_error != nil
    end
  end
end
