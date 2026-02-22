defmodule CGraphWeb.ErrorTracker.Extractor do
  @moduledoc """
  Error extraction, categorization, severity mapping, and fingerprinting.

  Extracts structured error information from exceptions, changesets, and error
  tuples. Categorizes errors by type and assigns severity levels. Computes
  fingerprints for deduplication.
  """

  # ---------------------------------------------------------------------------
  # Error Extraction
  # ---------------------------------------------------------------------------

  @doc """
  Extract structured error information from various error types.

  Handles exceptions, Ecto changesets, error tuples, and unknown errors.
  """
  @spec extract_error_info(term()) :: map()
  def extract_error_info(%{__exception__: true} = exception) do
    %{
      type: exception.__struct__,
      message: Exception.message(exception),
      stacktrace: extract_stacktrace(),
      exception: true
    }
  end

  def extract_error_info(%Ecto.Changeset{} = changeset) do
    %{
      type: :changeset_error,
      message: "Validation failed",
      errors: format_changeset_errors(changeset),
      exception: false
    }
  end

  def extract_error_info({:error, reason}) when is_atom(reason) do
    %{
      type: reason,
      message: Atom.to_string(reason),
      exception: false
    }
  end

  def extract_error_info({:error, %{} = error_map}) do
    %{
      type: Map.get(error_map, :type, :unknown),
      message: Map.get(error_map, :message, inspect(error_map)),
      details: error_map,
      exception: false
    }
  end

  def extract_error_info({:error, reason}) when is_binary(reason) do
    %{
      type: :error,
      message: reason,
      exception: false
    }
  end

  def extract_error_info(error) do
    %{
      type: :unknown,
      message: inspect(error),
      exception: false
    }
  end

  # ---------------------------------------------------------------------------
  # Error Categorization
  # ---------------------------------------------------------------------------

  @doc """
  Categorize an error by its type.

  Returns an atom representing the error category (e.g. `:database`,
  `:validation`, `:security`).
  """
  @spec categorize_error(term()) :: CGraphWeb.ErrorTracker.error_category()
  def categorize_error(%DBConnection.ConnectionError{}), do: :database
  def categorize_error(%Ecto.NoResultsError{}), do: :not_found
  def categorize_error(%Ecto.StaleEntryError{}), do: :database
  def categorize_error(%Ecto.ConstraintError{}), do: :validation
  def categorize_error(%Ecto.InvalidChangesetError{}), do: :validation
  def categorize_error(%Ecto.Changeset{}), do: :validation

  def categorize_error(%Phoenix.Router.NoRouteError{}), do: :not_found
  def categorize_error(%Phoenix.NotAcceptableError{}), do: :validation

  def categorize_error(%Plug.Parsers.ParseError{}), do: :validation
  def categorize_error(%Plug.BadRequestError{}), do: :validation

  def categorize_error({:error, :unauthorized}), do: :security
  def categorize_error({:error, :forbidden}), do: :security
  def categorize_error({:error, :unauthenticated}), do: :security
  def categorize_error({:error, :not_found}), do: :not_found
  def categorize_error({:error, :rate_limited}), do: :rate_limit

  def categorize_error(%{__exception__: true} = exception) do
    case exception.__struct__ do
      mod when mod in [Mint.TransportError, Finch.Error] -> :external
      _ -> :internal
    end
  end

  def categorize_error(_), do: :unknown

  # ---------------------------------------------------------------------------
  # Severity Mapping
  # ---------------------------------------------------------------------------

  @doc """
  Map an error category to its severity level.
  """
  @spec severity_for_category(CGraphWeb.ErrorTracker.error_category()) ::
          CGraphWeb.ErrorTracker.severity()
  def severity_for_category(:security), do: :error
  def severity_for_category(:database), do: :critical
  def severity_for_category(:external), do: :warning
  def severity_for_category(:internal), do: :error
  def severity_for_category(:validation), do: :info
  def severity_for_category(:not_found), do: :info
  def severity_for_category(:rate_limit), do: :info
  def severity_for_category(_), do: :warning

  # ---------------------------------------------------------------------------
  # Fingerprinting
  # ---------------------------------------------------------------------------

  @doc """
  Compute a deduplication fingerprint for an error.

  The fingerprint is based on the error type, truncated message, and
  normalized request path.
  """
  @spec compute_fingerprint(map(), keyword()) :: String.t()
  def compute_fingerprint(error_info, opts) do
    components = [
      error_info.type,
      error_info.message |> String.slice(0, 100),
      get_path(opts)
    ]

    :crypto.hash(:md5, Enum.join(components, "|"))
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  @spec extract_stacktrace() :: [String.t()]
  defp extract_stacktrace do
    case Process.info(self(), :current_stacktrace) do
      {:current_stacktrace, stacktrace} ->
        stacktrace
        |> Enum.drop(5)
        |> Enum.take(20)
        |> Enum.map(&format_stack_frame/1)
      _ ->
        []
    end
  end

  @spec format_stack_frame(tuple() | term()) :: String.t()
  defp format_stack_frame({mod, fun, arity, location}) do
    file = Keyword.get(location, :file, "unknown")
    line = Keyword.get(location, :line, 0)
    "#{inspect(mod)}.#{fun}/#{arity} at #{file}:#{line}"
  end

  defp format_stack_frame(_), do: "unknown"

  @spec format_changeset_errors(Ecto.Changeset.t()) :: map()
  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts
        |> Keyword.get(String.to_existing_atom(key), key)
        |> to_string()
      end)
    end)
  end

  @spec get_path(keyword()) :: String.t()
  defp get_path(opts) do
    case Keyword.get(opts, :conn) do
      %Plug.Conn{request_path: path} -> normalize_path(path)
      _ -> "background"
    end
  end

  # Normalize path by replacing dynamic segments
  @spec normalize_path(String.t()) :: String.t()
  defp normalize_path(path) do
    path
    |> String.replace(~r/\/[0-9a-f-]{36}/, "/:uuid")
    |> String.replace(~r/\/[0-9A-Z]{26}/, "/:ulid")
    |> String.replace(~r/\/\d+/, "/:id")
  end
end
