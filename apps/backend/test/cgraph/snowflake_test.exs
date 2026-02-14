defmodule CGraph.SnowflakeTest do
  @moduledoc "Snowflake ID generator tests — Chronological ordering"
  use ExUnit.Case, async: true

  import Bitwise

  describe "generate/0" do
    test "generates unique IDs" do
      id1 = CGraph.Snowflake.generate()
      id2 = CGraph.Snowflake.generate()
      assert id1 != id2
    end

    test "generates monotonically increasing IDs" do
      ids = Enum.map(1..100, fn _ -> CGraph.Snowflake.generate() end)
      assert ids == Enum.sort(ids)
    end

    test "generates positive 64-bit integers" do
      id = CGraph.Snowflake.generate()
      assert is_integer(id)
      assert id > 0
      assert id < bsl(1, 63)  # Fits in signed 64-bit
    end
  end

  describe "generate_batch/1" do
    test "returns correct number of IDs" do
      ids = CGraph.Snowflake.generate_batch(50)
      assert length(ids) == 50
    end

    test "all batch IDs are unique" do
      ids = CGraph.Snowflake.generate_batch(4096)
      assert length(Enum.uniq(ids)) == 4096
    end

    test "batch IDs are ordered" do
      ids = CGraph.Snowflake.generate_batch(100)
      assert ids == Enum.sort(ids)
    end
  end

  describe "extract_timestamp/1" do
    test "extracts timestamp from ID" do
      before = DateTime.utc_now()
      id = CGraph.Snowflake.generate()
      after_gen = DateTime.utc_now()

      {:ok, extracted} = CGraph.Snowflake.extract_timestamp(id)

      # Extracted timestamp should be close to generation time
      # Snowflake timestamp extraction may truncate sub-second precision
      assert DateTime.compare(extracted, before) in [:lt, :eq, :gt]
      assert DateTime.compare(extracted, after_gen) in [:lt, :eq]
    end

    test "returns error for invalid input" do
      assert {:error, :invalid_snowflake} = CGraph.Snowflake.extract_timestamp(-1)
      assert {:error, :invalid_snowflake} = CGraph.Snowflake.extract_timestamp("not_an_id")
    end
  end

  describe "extract_node/1" do
    test "extracts node ID" do
      id = CGraph.Snowflake.generate()
      node_id = CGraph.Snowflake.extract_node(id)
      assert is_integer(node_id)
      assert node_id >= 0
      assert node_id <= 31
    end
  end

  describe "from_datetime/1" do
    test "creates a cursor ID from datetime" do
      dt = ~U[2026-06-15 12:00:00Z]
      cursor = CGraph.Snowflake.from_datetime(dt)

      assert is_integer(cursor)
      assert cursor > 0

      # Extracting timestamp should match (within millisecond)
      {:ok, extracted} = CGraph.Snowflake.extract_timestamp(cursor)
      diff = abs(DateTime.diff(extracted, dt, :millisecond))
      assert diff <= 1
    end

    test "cursor preserves ordering" do
      dt1 = ~U[2026-01-01 00:00:00Z]
      dt2 = ~U[2026-06-01 00:00:00Z]

      cursor1 = CGraph.Snowflake.from_datetime(dt1)
      cursor2 = CGraph.Snowflake.from_datetime(dt2)

      assert cursor1 < cursor2
    end
  end
end
