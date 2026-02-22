defmodule CGraph.DataExport.Formatter do
  @moduledoc """
  Data formatting functions for export operations.

  Supports JSON, CSV, XML, and NDJSON (newline-delimited JSON) formats
  with proper escaping and streaming-compatible chunk formatting.
  """

  # ---------------------------------------------------------------------------
  # Chunk Formatting (for streaming)
  # ---------------------------------------------------------------------------

  @doc """
  Format a chunk of records for streaming output.

  Handles format-specific details like JSON array delimiters,
  CSV headers on the first chunk, and NDJSON line separation.
  """
  @spec format_chunk([map()], atom(), boolean()) :: [String.t()]
  def format_chunk(chunk, format, is_first) do
    case format do
      :ndjson ->
        Enum.map(chunk, &(Jason.encode!(&1) <> "\n"))

      :json when is_first ->
        ["[\n" | Enum.intersperse(Enum.map(chunk, &Jason.encode!/1), ",\n")]

      :json ->
        [",\n" | Enum.intersperse(Enum.map(chunk, &Jason.encode!/1), ",\n")]

      :csv when is_first ->
        if first = List.first(chunk) do
          header = first |> Map.keys() |> Enum.join(",")
          [header <> "\n" | Enum.map(chunk, &format_csv_row/1)]
        else
          []
        end

      :csv ->
        Enum.map(chunk, &format_csv_row/1)

      _ ->
        Enum.map(chunk, &Jason.encode!/1)
    end
  end

  # ---------------------------------------------------------------------------
  # Record Formatting
  # ---------------------------------------------------------------------------

  @doc """
  Format a single record for export output.

  Applies column filtering if specified, then formats according
  to the target format.
  """
  @spec format_record(map(), atom(), [atom()] | nil) :: String.t()
  def format_record(record, format, columns) do
    data =
      if columns do
        Map.take(record, columns)
      else
        record
      end

    case format do
      :ndjson -> Jason.encode!(data) <> "\n"
      :json -> Jason.encode!(data) <> ",\n"
      :csv -> format_csv_row(data)
      _ -> Jason.encode!(data) <> "\n"
    end
  end

  # ---------------------------------------------------------------------------
  # NDJSON Formatting
  # ---------------------------------------------------------------------------

  @doc """
  Format export data as newline-delimited JSON.
  """
  @spec format_ndjson(map()) :: String.t()
  def format_ndjson(%{data: data}) do
    data
    |> Enum.flat_map(fn {_source, records} ->
      List.wrap(records)
    end)
    |> Enum.map_join("", &(Jason.encode!(&1) <> "\n"))
  end

  # ---------------------------------------------------------------------------
  # CSV Formatting
  # ---------------------------------------------------------------------------

  @doc """
  Format export data as CSV.
  """
  @spec format_csv(map()) :: String.t()
  def format_csv(%{data: data}) do
    data
    |> Enum.flat_map(fn {_source, records} ->
      List.wrap(records)
    end)
    |> Enum.map_join("", &format_csv_row/1)
  end

  @doc """
  Format a single map record as a CSV row.
  """
  @spec format_csv_row(map()) :: String.t()
  def format_csv_row(record) when is_map(record) do
    Enum.map_join(Map.values(record), ",", &csv_escape/1) <> "\n"
  end

  @doc false
  @spec csv_escape(term()) :: String.t()
  def csv_escape(nil), do: ""

  def csv_escape(value) when is_binary(value) do
    if String.contains?(value, [",", "\"", "\n"]) do
      "\"" <> String.replace(value, "\"", "\"\"") <> "\""
    else
      value
    end
  end

  def csv_escape(value), do: to_string(value)

  # ---------------------------------------------------------------------------
  # XML Formatting
  # ---------------------------------------------------------------------------

  @doc """
  Format export data as XML.
  """
  @spec format_xml(map()) :: String.t()
  def format_xml(%{data: data} = export_data) do
    """
    <?xml version="1.0" encoding="UTF-8"?>
    <export>
      <metadata>
        <export_id>#{export_data.export_id}</export_id>
        <user_id>#{export_data.user_id}</user_id>
        <exported_at>#{export_data.exported_at}</exported_at>
      </metadata>
      <data>
    #{format_xml_data(data)}
      </data>
    </export>
    """
  end

  @doc false
  @spec format_xml_data(map()) :: String.t()
  def format_xml_data(data) when is_map(data) do
    Enum.map_join(data, "\n", fn {key, value} ->
      "    <#{key}>#{format_xml_value(value)}</#{key}>"
    end)
  end

  @doc false
  @spec format_xml_value(term()) :: String.t()
  def format_xml_value(value) when is_list(value) do
    Enum.map_join(value, "\n", fn item ->
      "<item>#{format_xml_value(item)}</item>"
    end)
  end

  def format_xml_value(value) when is_map(value), do: xml_escape(Jason.encode!(value))
  def format_xml_value(value), do: xml_escape(to_string(value))

  @doc false
  @spec xml_escape(term()) :: String.t()
  def xml_escape(text) when is_binary(text) do
    text
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
  end

  def xml_escape(text), do: xml_escape(to_string(text))
end
