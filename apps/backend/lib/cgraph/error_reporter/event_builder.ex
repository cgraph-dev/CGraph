defmodule CGraph.ErrorReporter.EventBuilder do
  @moduledoc """
  Builds structured error and message event maps for the error reporter.

  Responsible for formatting exceptions, stacktraces, fingerprints,
  and breadcrumbs. Event maps produced here are dispatched to reporting
  adapters by `CGraph.ErrorReporter`.
  """

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Build a structured event map from an exception, its stacktrace,
  contextual data, and reporter configuration.
  """
  @spec build_error_event(Exception.t() | term(), list(), map(), map()) :: map()
  def build_error_event(exception, stacktrace, context, config) do
    user = Process.get(:error_reporter_user, %{})
    tags = Process.get(:error_reporter_tags, %{})
    extra = Process.get(:error_reporter_extra, %{})

    {exc_type, exc_message, exc_module} =
      if is_struct(exception) do
        {exception_type(exception), Exception.message(exception), exception.__struct__}
      else
        {inspect(exception), inspect(exception), nil}
      end

    %{
      type: :exception,
      exception: %{
        type: exc_type,
        message: exc_message,
        module: exc_module
      },
      stacktrace: format_stacktrace(stacktrace),
      fingerprint: generate_fingerprint(exception, stacktrace),
      severity: :error,
      timestamp: DateTime.utc_now(),
      environment: config[:environment],
      release: config[:release],
      server_name: node(),
      context: Map.merge(context, extra),
      user: user,
      tags: tags,
      breadcrumbs: get_breadcrumbs()
    }
  end

  @doc """
  Build a structured event map from a log message.
  """
  @spec build_message_event(String.t(), atom(), map(), map()) :: map()
  def build_message_event(message, severity, context, config) do
    user = Process.get(:error_reporter_user, %{})
    tags = Process.get(:error_reporter_tags, %{})
    extra = Process.get(:error_reporter_extra, %{})

    %{
      type: :message,
      message: message,
      severity: severity,
      timestamp: DateTime.utc_now(),
      environment: config[:environment],
      release: config[:release],
      server_name: node(),
      context: Map.merge(context, extra),
      user: user,
      tags: tags
    }
  end

  @doc """
  Add a breadcrumb for error context.

  Breadcrumbs are stored in the process dictionary and attached to
  subsequent error events. Only the 20 most recent are kept.
  """
  @spec add_breadcrumb(String.t(), String.t(), map()) :: term()
  def add_breadcrumb(message, category, data) do
    breadcrumb = %{
      message: message,
      category: category,
      data: data,
      timestamp: DateTime.utc_now()
    }

    existing = Process.get(:error_reporter_breadcrumbs, [])
    # Keep last 20 breadcrumbs
    updated = Enum.take([breadcrumb | existing], 20)
    Process.put(:error_reporter_breadcrumbs, updated)
  end

  # ============================================================================
  # Private helpers
  # ============================================================================

  defp exception_type(%{__struct__: struct}), do: struct |> Module.split() |> Enum.join(".")
  defp exception_type(_), do: "Unknown"

  defp format_stacktrace(stacktrace) when is_list(stacktrace) do
    Enum.map(stacktrace, fn
      {mod, fun, arity, location} when is_integer(arity) ->
        %{
          module: inspect(mod),
          function: "#{fun}/#{arity}",
          file: Keyword.get(location, :file) |> to_string(),
          line: Keyword.get(location, :line)
        }

      {mod, fun, args, location} when is_list(args) ->
        %{
          module: inspect(mod),
          function: "#{fun}/#{length(args)}",
          file: Keyword.get(location, :file) |> to_string(),
          line: Keyword.get(location, :line)
        }

      entry ->
        %{raw: inspect(entry)}
    end)
  end

  defp format_stacktrace(stacktrace) when is_binary(stacktrace) do
    [%{raw: stacktrace}]
  end

  defp format_stacktrace(_), do: []

  defp generate_fingerprint(exception, stacktrace) do
    stacktrace = if is_list(stacktrace), do: stacktrace, else: []

    # Create a fingerprint based on exception type and top stack frames
    frames =
      stacktrace
      |> Enum.take(3)
      |> Enum.map_join("|", fn
        {mod, fun, arity, _} when is_integer(arity) -> "#{mod}.#{fun}/#{arity}"
        {mod, fun, args, _} when is_list(args) -> "#{mod}.#{fun}/#{length(args)}"
        _ -> "unknown"
      end)

    data = "#{exception_type(exception)}|#{frames}"

    :crypto.hash(:md5, data)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end

  defp get_breadcrumbs do
    Process.get(:error_reporter_breadcrumbs, [])
  end
end
