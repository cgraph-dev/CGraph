defmodule CGraphWeb.Validation do
  @moduledoc """
  Common validation utilities and base module for parameter validation.

  Provides shared validation functions, sanitization helpers, and a base module
  for creating consistent parameter validators across endpoints.

  ## Usage

  Create endpoint-specific validators:

      defmodule CGraphWeb.Validation.MyParams do
        use CGraphWeb.Validation

        embedded_schema do
          field :name, :string
          field :count, :integer
        end

        def validate_create(params) do
          %__MODULE__{}
          |> cast(params, [:name, :count])
          |> validate_required([:name])
          |> sanitize_string(:name)
          |> to_result()
        end
      end

  ## Security

  All validators include:
  - String sanitization (trim, normalize)
  - HTML entity encoding
  - Length limits
  - Type coercion with safe defaults
  """

  defmacro __using__(_opts) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset
      import CGraphWeb.Validation.Helpers
    end
  end

  defmodule Helpers do
    @moduledoc """
    Shared validation helper functions.
    """

    import Ecto.Changeset

    # ============================================================================
    # String Sanitization
    # ============================================================================

    @doc """
    Sanitize a string field by trimming whitespace and normalizing.
    """
    def sanitize_string(changeset, field) do
      update_change(changeset, field, fn value ->
        if is_binary(value) do
          value
          |> String.trim()
          |> String.replace(~r/\s+/, " ")  # Normalize whitespace
        else
          value
        end
      end)
    end

    @doc """
    Sanitize HTML by encoding dangerous characters.
    """
    def sanitize_html(changeset, field) do
      update_change(changeset, field, fn value ->
        if is_binary(value) do
          value
          |> String.replace("&", "&amp;")
          |> String.replace("<", "&lt;")
          |> String.replace(">", "&gt;")
          |> String.replace("\"", "&quot;")
          |> String.replace("'", "&#39;")
        else
          value
        end
      end)
    end

    @doc """
    Downcase a string field.
    """
    def downcase(changeset, field) do
      update_change(changeset, field, fn value ->
        if is_binary(value), do: String.downcase(value), else: value
      end)
    end

    # ============================================================================
    # URL Validation
    # ============================================================================

    @doc """
    Validate that a field contains a valid HTTP(S) URL.
    """
    def validate_url(changeset, field, opts \\ []) do
      validate_change(changeset, field, fn _, url ->
        if is_binary(url) and byte_size(url) > 0 do
          case URI.parse(url) do
            %URI{scheme: scheme, host: host} when scheme in ["http", "https"] and is_binary(host) ->
              []

            _ ->
              [{field, Keyword.get(opts, :message, "must be a valid HTTP or HTTPS URL")}]
          end
        else
          []
        end
      end)
    end

    @doc """
    Validate that a field contains a valid URL with specific allowed domains.
    """
    def validate_url_domain(changeset, field, allowed_domains, opts \\ []) do
      validate_change(changeset, field, fn _, url ->
        if is_binary(url) and byte_size(url) > 0 do
          case URI.parse(url) do
            %URI{host: host} when is_binary(host) ->
              if host in allowed_domains or Enum.any?(allowed_domains, &String.ends_with?(host, &1)) do
                []
              else
                [{field, Keyword.get(opts, :message, "must be from an allowed domain")}]
              end

            _ ->
              [{field, Keyword.get(opts, :message, "must be a valid URL")}]
          end
        else
          []
        end
      end)
    end

    # ============================================================================
    # UUID Validation
    # ============================================================================

    @doc """
    Validate that a field contains a valid UUID.
    """
    def validate_uuid(changeset, field) do
      validate_change(changeset, field, fn _, value ->
        case Ecto.UUID.cast(value) do
          {:ok, _} -> []
          :error -> [{field, "must be a valid UUID"}]
        end
      end)
    end

    @doc """
    Validate that all items in an array field are valid UUIDs.
    """
    def validate_uuid_array(changeset, field) do
      validate_change(changeset, field, fn _, values ->
        if is_list(values) do
          invalid = Enum.filter(values, fn v ->
            case Ecto.UUID.cast(v) do
              {:ok, _} -> false
              :error -> true
            end
          end)

          if length(invalid) > 0 do
            [{field, "contains invalid UUIDs"}]
          else
            []
          end
        else
          [{field, "must be an array"}]
        end
      end)
    end

    # ============================================================================
    # Pagination Validation
    # ============================================================================

    @doc """
    Add and validate pagination fields with defaults.
    """
    def validate_pagination(changeset, opts \\ []) do
      max_per_page = Keyword.get(opts, :max_per_page, 100)
      default_per_page = Keyword.get(opts, :default_per_page, 20)

      changeset
      |> put_default(:page, 1)
      |> put_default(:per_page, default_per_page)
      |> validate_number(:page, greater_than: 0)
      |> validate_number(:per_page, greater_than: 0, less_than_or_equal_to: max_per_page)
    end

    # ============================================================================
    # Date/Time Validation
    # ============================================================================

    @doc """
    Validate that a datetime is in the future.
    """
    def validate_future_datetime(changeset, field) do
      validate_change(changeset, field, fn _, datetime ->
        now = DateTime.utc_now()

        if DateTime.compare(datetime, now) == :gt do
          []
        else
          [{field, "must be in the future"}]
        end
      end)
    end

    @doc """
    Validate that a datetime is in the past.
    """
    def validate_past_datetime(changeset, field) do
      validate_change(changeset, field, fn _, datetime ->
        now = DateTime.utc_now()

        if DateTime.compare(datetime, now) == :lt do
          []
        else
          [{field, "must be in the past"}]
        end
      end)
    end

    # ============================================================================
    # Result Helpers
    # ============================================================================

    @doc """
    Apply a default value if field is not set.
    """
    def put_default(changeset, field, default) do
      if get_field(changeset, field) do
        changeset
      else
        put_change(changeset, field, default)
      end
    end

    @doc """
    Convert changeset to result tuple {:ok, map} or {:error, changeset}.
    """
    def to_result(%Ecto.Changeset{} = changeset) do
      case apply_action(changeset, :validate) do
        {:ok, struct} -> {:ok, struct_to_map(struct)}
        {:error, cs} -> {:error, cs}
      end
    end

    defp struct_to_map(struct) when is_struct(struct) do
      struct
      |> Map.from_struct()
      |> Map.delete(:__meta__)
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> Map.new()
    end

    # ============================================================================
    # Error Formatting
    # ============================================================================

    @doc """
    Format changeset errors for API response.
    """
    def format_errors(%Ecto.Changeset{} = changeset) do
      Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
        Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
          opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
        end)
      end)
    end
  end
end
