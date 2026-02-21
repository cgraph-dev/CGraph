defmodule CGraph.DataExport do
  @moduledoc """
  CGraph.DataExport - Comprehensive Data Export Infrastructure

  ## Overview

  This module provides production-grade data export capabilities for GDPR compliance,
  data portability requirements, and bulk data operations. It supports multiple export
  formats, streaming for large datasets, progress tracking, and secure download links.

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                      CGraph.DataExport                         │
  ├─────────────────────────────────────────────────────────────────┤
  │  Export Formats    │  Data Sources     │  Delivery Methods     │
  │  ────────────────  │  ────────────────  │  ─────────────────    │
  │  • JSON            │  • User data      │  • Direct download    │
  │  • CSV             │  • Activity logs  │  • S3 upload          │
  │  • XML             │  • Messages       │  • Email link         │
  │  • NDJSON          │  • Custom queries │  • Webhook delivery   │
  ├─────────────────────────────────────────────────────────────────┤
  │  Security          │  Performance      │  Compliance           │
  │  ────────────────  │  ────────────────  │  ─────────────────    │
  │  • Encryption      │  • Streaming      │  • GDPR exports       │
  │  • Signed URLs     │  • Chunking       │  • Audit logging      │
  │  • Access control  │  • Compression    │  • Retention policy   │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Submodules

  - `CGraph.DataExport.Server` — GenServer lifecycle, ETS management, streaming, cleanup
  - `CGraph.DataExport.Processor` — Export execution and data collection
  - `CGraph.DataExport.Formatter` — JSON, CSV, XML, and NDJSON formatting
  - `CGraph.DataExport.Storage` — File I/O, encryption, configuration
  - `CGraph.DataExport.Delivery` — Download URLs, token verification, notifications, audit

  ## Usage Examples

  ### User Data Export (GDPR)

      {:ok, export} = CGraph.DataExport.export_user_data(user_id, [
        format: :json,
        include: [:profile, :messages, :activity, :settings],
        delivery: :download
      ])

      {:ok, url} = CGraph.DataExport.get_download_url(export.id)

  ### Custom Query Export

      query = from u in User, where: u.created_at > ^start_date

      {:ok, export} = CGraph.DataExport.export_query(query, [
        format: :csv,
        filename: "users_export",
        columns: [:id, :email, :name, :created_at]
      ])

  ### Streaming Large Dataset

      CGraph.DataExport.stream_export(query, [format: :ndjson])
      |> Stream.each(&IO.puts/1)
      |> Stream.run()

  ## Configuration

  Configure in `config/config.exs`:

      config :cgraph, CGraph.DataExport,
        storage: :s3,
        bucket: "my-exports-bucket",
        encryption: true,
        link_expiry: :timer.hours(24),
        max_export_size: 100_000_000,
        retention_days: 7
  """

  # ---------------------------------------------------------------------------
  # Type Definitions
  # ---------------------------------------------------------------------------

  @type export_id :: String.t()
  @type export_format :: :json | :csv | :xml | :ndjson
  @type delivery_method :: :download | :s3 | :email | :webhook
  @type export_status :: :pending | :processing | :completed | :failed | :expired

  @type export_options :: [
          format: export_format(),
          delivery: delivery_method(),
          include: [atom()],
          exclude: [atom()],
          filename: String.t(),
          compress: boolean(),
          encrypt: boolean(),
          password: String.t() | nil,
          expires_in: pos_integer(),
          notify_email: String.t() | nil,
          webhook_url: String.t() | nil,
          columns: [atom()] | nil
        ]

  @type export :: %{
          id: export_id(),
          user_id: String.t() | nil,
          type: atom(),
          format: export_format(),
          status: export_status(),
          filename: String.t(),
          file_size: non_neg_integer() | nil,
          download_count: non_neg_integer(),
          created_at: DateTime.t(),
          completed_at: DateTime.t() | nil,
          expires_at: DateTime.t() | nil,
          download_token: String.t() | nil,
          storage_path: String.t() | nil,
          error: String.t() | nil
        }

  # ---------------------------------------------------------------------------
  # Public API — GenServer Lifecycle
  # ---------------------------------------------------------------------------

  @doc """
  Start the DataExport GenServer.
  """
  def start_link(opts \\ []), do: CGraph.DataExport.Server.start_link(opts)

  # ---------------------------------------------------------------------------
  # Public API — User Data Exports (GDPR)
  # ---------------------------------------------------------------------------

  @doc """
  Export all user data for GDPR compliance (Article 20 - Right to Data Portability).

  ## Options

  - `:format` - Export format (:json, :csv, :xml, :ndjson). Default: :json
  - `:include` - List of data types to include. Default: all
  - `:exclude` - List of data types to exclude
  - `:delivery` - Delivery method (:download, :s3, :email). Default: :download
  - `:notify_email` - Email to notify when export is ready
  - `:encrypt` - Whether to encrypt the export file. Default: true
  - `:password` - Optional password for encrypted exports

  ## Examples

      {:ok, export} = CGraph.DataExport.export_user_data(user_id)

      {:ok, export} = CGraph.DataExport.export_user_data(user_id, [
        format: :csv,
        include: [:profile, :messages]
      ])
  """
  @spec export_user_data(String.t(), export_options()) :: {:ok, export()} | {:error, term()}
  def export_user_data(user_id, opts \\ []),
    do: CGraph.DataExport.Server.export_user_data(user_id, opts)

  @doc """
  Export data from a custom Ecto query.

  ## Options

  - `:format` - Export format. Default: :json
  - `:filename` - Base filename for the export
  - `:columns` - List of columns to include (for CSV)
  - `:chunk_size` - Number of records per chunk for streaming

  ## Examples

      query = from u in User, where: u.role == "admin"

      {:ok, export} = CGraph.DataExport.export_query(query, [
        format: :csv,
        filename: "admin_users",
        columns: [:id, :email, :name]
      ])
  """
  @spec export_query(Ecto.Query.t(), export_options()) :: {:ok, export()} | {:error, term()}
  def export_query(query, opts \\ []),
    do: CGraph.DataExport.Server.export_query(query, opts)

  @doc """
  Stream export data for memory-efficient processing.

  Returns a Stream that yields formatted data chunks.

  ## Examples

      CGraph.DataExport.stream_export(query, format: :ndjson)
      |> Stream.into(File.stream!("export.ndjson"))
      |> Stream.run()
  """
  @spec stream_export(Ecto.Query.t(), keyword()) :: Enumerable.t()
  def stream_export(query, opts \\ []),
    do: CGraph.DataExport.Server.stream_export(query, opts)

  # ---------------------------------------------------------------------------
  # Public API — Export Management
  # ---------------------------------------------------------------------------

  @doc "Get an export by ID."
  defdelegate get_export(export_id), to: CGraph.DataExport.Server

  @doc "Get all exports for a user."
  defdelegate list_user_exports(user_id), to: CGraph.DataExport.Server

  @doc """
  Generate a secure download URL for an export.

  ## Examples

      {:ok, url} = CGraph.DataExport.get_download_url(export_id)
  """
  defdelegate get_download_url(export_id), to: CGraph.DataExport.Delivery

  @doc "Verify a download token and return the export."
  defdelegate verify_download(export_id, token), to: CGraph.DataExport.Delivery

  @doc "Delete an export and its associated file."
  defdelegate delete_export(export_id), to: CGraph.DataExport.Server

  @doc "Cancel a pending or processing export."
  defdelegate cancel_export(export_id), to: CGraph.DataExport.Server

  # ---------------------------------------------------------------------------
  # Public API — Statistics
  # ---------------------------------------------------------------------------

  @doc "Get export statistics."
  defdelegate get_stats(), to: CGraph.DataExport.Server
end
