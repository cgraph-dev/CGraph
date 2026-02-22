defmodule CGraphWeb.API.InputValidation.Sanitization do
  @moduledoc """
  Format validation, security checks, and sanitization for input values.

  Provides predefined format validators (email, URL, UUID, etc.),
  injection pattern detection, and data sanitization functions.
  """

  # ---------------------------------------------------------------------------
  # Format Patterns
  # ---------------------------------------------------------------------------

  @email_pattern ~r/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  @url_pattern ~r/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/
  @uuid_pattern ~r/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  @ulid_pattern ~r/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/
  @slug_pattern ~r/^[a-z0-9]+(?:-[a-z0-9]+)*$/
  @phone_pattern ~r/^\+?[1-9]\d{1,14}$/
  @hex_color_pattern ~r/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  @ethereum_address_pattern ~r/^0x[a-fA-F0-9]{40}$/

  # Dangerous patterns for injection detection
  @sql_injection_patterns [
    ~r/(\b(select|insert|update|delete|drop|union|exec|execute)\b.*\b(from|into|where|table)\b)/i,
    ~r/(;|--|\|\||\/\*|\*\/)/
  ]

  @max_string_length 10_000

  # ---------------------------------------------------------------------------
  # Format Validation
  # ---------------------------------------------------------------------------

  @doc "Validate a value against a predefined format."
  @spec check_format(any(), atom() | nil) :: {:ok, any()} | {:error, [String.t()]}
  def check_format(value, nil), do: {:ok, value}

  def check_format(value, :email) when is_binary(value) do
    if Regex.match?(@email_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid email format"]}
    end
  end

  def check_format(value, :url) when is_binary(value) do
    if Regex.match?(@url_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid URL format"]}
    end
  end

  def check_format(value, :uuid) when is_binary(value) do
    if Regex.match?(@uuid_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid UUID format"]}
    end
  end

  def check_format(value, :ulid) when is_binary(value) do
    if Regex.match?(@ulid_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid ULID format"]}
    end
  end

  def check_format(value, :slug) when is_binary(value) do
    if Regex.match?(@slug_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid slug format (lowercase letters, numbers, hyphens only)"]}
    end
  end

  def check_format(value, :phone) when is_binary(value) do
    if Regex.match?(@phone_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid phone format"]}
    end
  end

  def check_format(value, :hex_color) when is_binary(value) do
    if Regex.match?(@hex_color_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid hex color format"]}
    end
  end

  def check_format(value, :ethereum_address) when is_binary(value) do
    if Regex.match?(@ethereum_address_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid Ethereum address format"]}
    end
  end

  def check_format(_value, format) do
    {:error, ["unknown format: #{format}"]}
  end

  # ---------------------------------------------------------------------------
  # Security Checks
  # ---------------------------------------------------------------------------

  @doc "Check a value for security issues (max length, injection patterns)."
  @spec check_security(any()) :: {:ok, any()} | {:error, [String.t()]}
  def check_security(value) when is_binary(value) do
    cond do
      String.length(value) > @max_string_length ->
        {:error, ["exceeds maximum length"]}

      contains_injection_pattern?(value) ->
        {:error, ["contains potentially dangerous content"]}

      true ->
        {:ok, value}
    end
  end

  def check_security(value), do: {:ok, value}

  @spec contains_injection_pattern?(String.t()) :: boolean()
  defp contains_injection_pattern?(value) do
    Enum.any?(@sql_injection_patterns, fn pattern ->
      Regex.match?(pattern, value)
    end)
  end

  # ---------------------------------------------------------------------------
  # Sanitization
  # ---------------------------------------------------------------------------

  @doc "Apply sanitization functions to a value."
  @spec apply_sanitizers(any(), atom() | list() | nil) :: {:ok, any()}
  def apply_sanitizers(value, nil), do: {:ok, value}

  def apply_sanitizers(value, sanitizers) when is_list(sanitizers) do
    sanitized = Enum.reduce(sanitizers, value, &apply_sanitizer/2)
    {:ok, sanitized}
  end

  def apply_sanitizers(value, sanitizer), do: apply_sanitizers(value, [sanitizer])

  @spec apply_sanitizer(atom() | (any() -> any()), any()) :: any()
  defp apply_sanitizer(:trim, value) when is_binary(value), do: String.trim(value)
  defp apply_sanitizer(:downcase, value) when is_binary(value), do: String.downcase(value)
  defp apply_sanitizer(:upcase, value) when is_binary(value), do: String.upcase(value)

  defp apply_sanitizer(:strip_html, value) when is_binary(value) do
    value
    |> String.replace(~r/<[^>]*>/, "")
    |> String.replace(~r/&[a-z]+;/, "")
  end

  defp apply_sanitizer(:normalize_unicode, value) when is_binary(value) do
    :unicode.characters_to_nfc_binary(value)
  end

  defp apply_sanitizer(:collapse_whitespace, value) when is_binary(value) do
    String.replace(value, ~r/\s+/, " ")
  end

  defp apply_sanitizer(:escape_html, value) when is_binary(value) do
    Phoenix.HTML.html_escape(value) |> Phoenix.HTML.safe_to_string()
  end

  defp apply_sanitizer(func, value) when is_function(func, 1), do: func.(value)
  defp apply_sanitizer(_, value), do: value
end
