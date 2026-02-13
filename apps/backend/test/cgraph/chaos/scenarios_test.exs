defmodule CGraph.Chaos.ScenariosTest do
  @moduledoc """
  Tests for pre-built chaos scenarios.
  Validates that scenarios inject faults correctly and can be restored.
  """
  use ExUnit.Case, async: true

  alias CGraph.Chaos.FaultInjector
  alias CGraph.Chaos.Scenarios

  setup do
    on_exit(fn -> FaultInjector.clear_all() end)
    :ok
  end

  describe "redis_down/0" do
    test "injects Redis failure" do
      Scenarios.redis_down()

      assert {:error, :connection_refused} = FaultInjector.check_error(:redis)
      assert FaultInjector.partitioned?(:redis)
    end
  end

  describe "database_slow/1" do
    test "injects database latency" do
      Scenarios.database_slow(2_000)

      assert {:delay, 2_000} = FaultInjector.check_latency(:database)
    end

    test "uses default 3s latency" do
      Scenarios.database_slow()

      assert {:delay, 3_000} = FaultInjector.check_latency(:database)
    end
  end

  describe "push_services_down/0" do
    test "fails all push services" do
      Scenarios.push_services_down()

      assert {:error, :service_unavailable} = FaultInjector.check_error(:apns)
      assert {:error, :service_unavailable} = FaultInjector.check_error(:fcm)
      assert {:error, :service_unavailable} = FaultInjector.check_error(:expo)
    end
  end

  describe "search_unavailable/0" do
    test "fails MeiliSearch" do
      Scenarios.search_unavailable()

      assert {:error, :connection_refused} = FaultInjector.check_error(:meilisearch)
      assert FaultInjector.partitioned?(:meilisearch)
    end
  end

  describe "mailer_down/0" do
    test "fails mailer service" do
      Scenarios.mailer_down()

      assert {:error, :service_unavailable} = FaultInjector.check_error(:mailer)
    end
  end

  describe "cascade_failure/0" do
    test "fails multiple services simultaneously" do
      Scenarios.cascade_failure()

      assert {:error, _} = FaultInjector.check_error(:redis)
      assert {:error, _} = FaultInjector.check_error(:apns)
      assert {:error, _} = FaultInjector.check_error(:meilisearch)
      assert {:error, _} = FaultInjector.check_error(:mailer)
    end
  end

  describe "intermittent_failures/2" do
    test "injects count-limited failures" do
      Scenarios.intermittent_failures(:redis, 3)

      assert {:error, :timeout} = FaultInjector.check_error(:redis)
      assert {:error, :timeout} = FaultInjector.check_error(:redis)
      assert {:error, :timeout} = FaultInjector.check_error(:redis)
      assert :none = FaultInjector.check_error(:redis)
    end
  end

  describe "high_latency/1" do
    test "adds latency to all external services" do
      Scenarios.high_latency(1_000)

      for svc <- [:redis, :database, :apns, :fcm, :expo, :meilisearch, :mailer] do
        assert {:delay, 1_000} = FaultInjector.check_latency(svc)
      end
    end
  end

  describe "restore_all/0" do
    test "clears all injected faults" do
      Scenarios.cascade_failure()
      Scenarios.high_latency(5_000)

      Scenarios.restore_all()

      for svc <- [:redis, :database, :apns, :fcm, :expo, :meilisearch, :mailer] do
        assert :none = FaultInjector.check_latency(svc)
        assert :none = FaultInjector.check_error(svc)
        refute FaultInjector.partitioned?(svc)
      end
    end
  end
end
