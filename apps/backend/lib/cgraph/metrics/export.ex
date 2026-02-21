defmodule CGraph.Metrics.Export do
  @moduledoc """
  Metric export in Prometheus text and JSON formats.

  Converts internal metric state into standard exposition formats
  for scraping by monitoring systems.
  """

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc "Export metrics in the specified format (:prometheus or :json)."
  @spec export(map(), atom()) :: String.t() | {:error, :unknown_format}
  def export(state, :prometheus), do: export_prometheus(state)
  def export(state, :json), do: export_json(state)
  def export(_state, _format), do: {:error, :unknown_format}

  # ---------------------------------------------------------------------------
  # Prometheus Export
  # ---------------------------------------------------------------------------

  defp export_prometheus(state) do
    lines = []

    # Export counters
    lines = lines ++ export_counters_prometheus(state)

    # Export gauges
    lines = lines ++ export_gauges_prometheus(state)

    # Export histograms
    lines = lines ++ export_histograms_prometheus(state)

    Enum.join(lines, "\n")
  end

  defp export_counters_prometheus(state) do
    state.counters
    |> Enum.group_by(fn {{name, _labels}, _value} -> name end)
    |> Enum.flat_map(fn {name, entries} ->
      definition = Map.get(state.definitions, name, %{help: ""})

      [
        "# HELP #{name} #{definition.help}",
        "# TYPE #{name} counter"
      ] ++ Enum.map(entries, fn {{_name, labels}, value} ->
        label_str = format_labels(labels)
        "#{name}#{label_str} #{value}"
      end)
    end)
  end

  defp export_gauges_prometheus(state) do
    state.gauges
    |> Enum.group_by(fn {{name, _labels}, _value} -> name end)
    |> Enum.flat_map(fn {name, entries} ->
      definition = Map.get(state.definitions, name, %{help: ""})

      [
        "# HELP #{name} #{definition.help}",
        "# TYPE #{name} gauge"
      ] ++ Enum.map(entries, fn {{_name, labels}, value} ->
        label_str = format_labels(labels)
        "#{name}#{label_str} #{value}"
      end)
    end)
  end

  defp export_histograms_prometheus(state) do
    state.histograms
    |> Enum.group_by(fn {{name, _labels}, _histogram} -> name end)
    |> Enum.flat_map(&format_histogram_group(&1, state.definitions))
  end

  defp format_histogram_group({name, entries}, definitions) do
    definition = Map.get(definitions, name, %{help: ""})
    header = ["# HELP #{name} #{definition.help}", "# TYPE #{name} histogram"]
    bucket_lines = Enum.flat_map(entries, &format_histogram_entry(name, &1))
    header ++ bucket_lines
  end

  defp format_histogram_entry(name, {{_name, labels}, histogram}) do
    base_labels = format_labels_map(labels)
    bucket_entries = format_bucket_entries(name, histogram.buckets, base_labels)
    label_str = format_labels(labels)

    bucket_entries ++ [
      "#{name}_sum#{label_str} #{histogram.sum}",
      "#{name}_count#{label_str} #{histogram.count}"
    ]
  end

  defp format_bucket_entries(name, buckets, base_labels) do
    Enum.map(buckets, fn {bound, count} ->
      le = if bound == :inf, do: "+Inf", else: to_string(bound)
      bucket_labels = Map.put(base_labels, "le", le)
      "#{name}_bucket#{format_labels_from_map(bucket_labels)} #{count}"
    end)
  end

  defp format_labels([]), do: ""
  defp format_labels(labels) do
    inner = Enum.map_join(labels, ",", fn {k, v} ->
      "#{k}=\"#{escape_label_value(v)}\""
    end)

    "{#{inner}}"
  end

  defp format_labels_map(labels) do
    labels |> Enum.into(%{}, fn {k, v} -> {to_string(k), to_string(v)} end)
  end

  defp format_labels_from_map(map) when map == %{}, do: ""
  defp format_labels_from_map(map) do
    inner = Enum.map_join(map, ",", fn {k, v} ->
      "#{k}=\"#{escape_label_value(v)}\""
    end)

    "{#{inner}}"
  end

  defp escape_label_value(value) do
    value
    |> to_string()
    |> String.replace("\\", "\\\\")
    |> String.replace("\"", "\\\"")
    |> String.replace("\n", "\\n")
  end

  # ---------------------------------------------------------------------------
  # JSON Export
  # ---------------------------------------------------------------------------

  defp export_json(state) do
    data = %{
      counters: Enum.map(state.counters, fn {{name, labels}, value} ->
        %{name: name, labels: Map.new(labels), value: value}
      end),
      gauges: Enum.map(state.gauges, fn {{name, labels}, value} ->
        %{name: name, labels: Map.new(labels), value: value}
      end),
      histograms: Enum.map(state.histograms, fn {{name, labels}, histogram} ->
        %{
          name: name,
          labels: Map.new(labels),
          buckets: Enum.map(histogram.buckets, fn {b, c} -> %{le: b, count: c} end),
          sum: histogram.sum,
          count: histogram.count
        }
      end),
      collected_at: DateTime.utc_now() |> DateTime.to_iso8601()
    }

    Jason.encode!(data)
  end
end
