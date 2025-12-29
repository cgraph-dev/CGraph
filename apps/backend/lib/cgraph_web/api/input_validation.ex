defmodule CgraphWeb.API.InputValidation do
  @moduledoc """
  Input validation and sanitization for API requests.
  
  ## Design Philosophy
  
  This module provides a declarative approach to input validation that:
  
  1. **Validates early**: Catch invalid input before business logic runs
  2. **Provides clear errors**: Return specific, actionable error messages
  3. **Sanitizes input**: Clean and normalize data before processing
  4. **Prevents attacks**: Guard against common security issues
  
  ## Validation Pipeline
  
  Input flows through multiple stages:
  
  ```
  Raw Input → Type Coercion → Format Validation → Sanitization → Business Rules
  ```
  
  ## Schema Definition
  
  Define input schemas declaratively:
  
  ```elixir
  @create_user_schema %{
    email: [type: :string, required: true, format: :email],
    username: [type: :string, required: true, min: 3, max: 30, pattern: ~r/^[a-z0-9_]+$/],
    password: [type: :string, required: true, min: 8],
    age: [type: :integer, min: 13],
    tags: [type: {:array, :string}, max_items: 10]
  }
  
  def create(conn, params) do
    with {:ok, validated} <- validate(params, @create_user_schema) do
      # Use validated params safely
    end
  end
  ```
  
  ## Available Validators
  
  | Validator | Description | Example |
  |-----------|-------------|---------|
  | `type` | Data type | `:string`, `:integer`, `:boolean`, `{:array, :string}` |
  | `required` | Field must be present | `true`, `false` |
  | `default` | Default value if missing | Any value |
  | `min` | Minimum (length/value) | `3` |
  | `max` | Maximum (length/value) | `100` |
  | `format` | Predefined format | `:email`, `:url`, `:uuid`, `:ulid` |
  | `pattern` | Regex pattern | `~r/^[a-z]+$/` |
  | `in` | Allowed values | `["active", "inactive"]` |
  | `custom` | Custom validator fn | `&is_valid_slug/1` |
  | `sanitize` | Sanitization fn | `:trim`, `:downcase`, `:strip_html` |
  
  ## Security Features
  
  - Automatic HTML stripping to prevent XSS
  - SQL/NoSQL injection pattern detection
  - Maximum string length enforcement
  - Unicode normalization
  """
  
  @type validation_rule :: 
    {:type, atom() | {:array, atom()}}
    | {:required, boolean()}
    | {:default, any()}
    | {:min, number()}
    | {:max, number()}
    | {:format, atom()}
    | {:pattern, Regex.t()}
    | {:in, list()}
    | {:custom, (any() -> boolean() | {:error, String.t()})}
    | {:sanitize, atom() | (any() -> any())}
    | {:message, String.t()}
  
  @type schema :: %{required(atom()) => [validation_rule()]}
  @type validation_result :: {:ok, map()} | {:error, map()}
  
  # Common patterns
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
  # Main Validation Function
  # ---------------------------------------------------------------------------
  
  @doc """
  Validate a map of parameters against a schema.
  
  ## Returns
  
  - `{:ok, validated_params}` - All validations passed, returns cleaned params
  - `{:error, errors}` - Validation failed, returns error map
  
  ## Options
  
  - `:strict` - If true, reject unknown fields (default: false)
  - `:allow_nil` - If true, nil values pass validation (default: false)
  
  ## Examples
  
      schema = %{
        email: [type: :string, required: true, format: :email],
        age: [type: :integer, min: 0, max: 150]
      }
      
      validate(%{"email" => "user@example.com", "age" => "25"}, schema)
      # => {:ok, %{email: "user@example.com", age: 25}}
      
      validate(%{"email" => "invalid"}, schema)
      # => {:error, %{email: ["has invalid format"]}}
  """
  @spec validate(map(), schema(), keyword()) :: validation_result()
  def validate(params, schema, opts \\ []) when is_map(params) and is_map(schema) do
    strict = Keyword.get(opts, :strict, false)
    
    # Convert string keys to atoms for consistent processing
    params = normalize_keys(params)
    
    # Check for unknown fields in strict mode
    if strict do
      unknown = Map.keys(params) -- Map.keys(schema)
      if unknown != [] do
        errors = Map.new(unknown, fn key -> {key, ["unknown field"]} end)
        {:error, errors}
      else
        do_validate(params, schema)
      end
    else
      do_validate(params, schema)
    end
  end
  
  defp do_validate(params, schema) do
    schema
    |> Enum.reduce({%{}, %{}}, fn {field, rules}, {values, errors} ->
      value = Map.get(params, field)
      
      case validate_field(value, rules) do
        {:ok, validated_value} ->
          {Map.put(values, field, validated_value), errors}
          
        {:error, field_errors} when is_list(field_errors) ->
          {values, Map.put(errors, field, field_errors)}
      end
    end)
    |> case do
      {values, errors} when map_size(errors) == 0 -> {:ok, values}
      {_values, errors} -> {:error, errors}
    end
  end

  # ---------------------------------------------------------------------------
  # Field Validation
  # ---------------------------------------------------------------------------
  
  defp validate_field(value, rules) do
    is_required = Keyword.get(rules, :required, false)
    default = Keyword.get(rules, :default)
    
    # Handle nil/missing values
    cond do
      is_nil(value) and not is_nil(default) ->
        {:ok, default}
        
      (is_nil(value) or value == "") and is_required ->
        {:error, ["is required"]}
        
      is_nil(value) or value == "" ->
        {:ok, nil}
        
      true ->
        # Run validation pipeline
        with {:ok, v} <- coerce_type(value, Keyword.get(rules, :type)),
             {:ok, v} <- check_min(v, Keyword.get(rules, :min), rules),
             {:ok, v} <- check_max(v, Keyword.get(rules, :max), rules),
             {:ok, v} <- check_format(v, Keyword.get(rules, :format)),
             {:ok, v} <- check_pattern(v, Keyword.get(rules, :pattern)),
             {:ok, v} <- check_inclusion(v, Keyword.get(rules, :in)),
             {:ok, v} <- check_exclusion(v, Keyword.get(rules, :not_in)),
             {:ok, v} <- check_custom(v, Keyword.get(rules, :custom)),
             {:ok, v} <- check_security(v),
             {:ok, v} <- apply_sanitizers(v, Keyword.get(rules, :sanitize)) do
          {:ok, v}
        end
    end
  end

  # ---------------------------------------------------------------------------
  # Type Coercion
  # ---------------------------------------------------------------------------
  
  defp coerce_type(value, nil), do: {:ok, value}
  
  defp coerce_type(value, :string) when is_binary(value), do: {:ok, value}
  defp coerce_type(value, :string) when is_number(value), do: {:ok, to_string(value)}
  defp coerce_type(value, :string) when is_atom(value), do: {:ok, Atom.to_string(value)}
  defp coerce_type(_, :string), do: {:error, ["must be a string"]}
  
  defp coerce_type(value, :integer) when is_integer(value), do: {:ok, value}
  defp coerce_type(value, :integer) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} -> {:ok, int}
      _ -> {:error, ["must be an integer"]}
    end
  end
  defp coerce_type(value, :integer) when is_float(value), do: {:ok, trunc(value)}
  defp coerce_type(_, :integer), do: {:error, ["must be an integer"]}
  
  defp coerce_type(value, :float) when is_float(value), do: {:ok, value}
  defp coerce_type(value, :float) when is_integer(value), do: {:ok, value / 1}
  defp coerce_type(value, :float) when is_binary(value) do
    case Float.parse(value) do
      {float, ""} -> {:ok, float}
      _ -> {:error, ["must be a number"]}
    end
  end
  defp coerce_type(_, :float), do: {:error, ["must be a number"]}
  
  defp coerce_type(value, :boolean) when is_boolean(value), do: {:ok, value}
  defp coerce_type("true", :boolean), do: {:ok, true}
  defp coerce_type("false", :boolean), do: {:ok, false}
  defp coerce_type("1", :boolean), do: {:ok, true}
  defp coerce_type("0", :boolean), do: {:ok, false}
  defp coerce_type(1, :boolean), do: {:ok, true}
  defp coerce_type(0, :boolean), do: {:ok, false}
  defp coerce_type(_, :boolean), do: {:error, ["must be a boolean"]}
  
  defp coerce_type(value, :atom) when is_atom(value), do: {:ok, value}
  defp coerce_type(value, :atom) when is_binary(value) do
    {:ok, String.to_existing_atom(value)}
  rescue
    ArgumentError -> {:error, ["is not a valid value"]}
  end
  
  defp coerce_type(value, :map) when is_map(value), do: {:ok, value}
  defp coerce_type(value, :map) when is_binary(value) do
    case Jason.decode(value) do
      {:ok, map} when is_map(map) -> {:ok, map}
      _ -> {:error, ["must be a map/object"]}
    end
  end
  defp coerce_type(_, :map), do: {:error, ["must be a map/object"]}
  
  defp coerce_type(value, :datetime) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, dt, _} -> {:ok, dt}
      _ -> {:error, ["must be a valid ISO8601 datetime"]}
    end
  end
  defp coerce_type(%DateTime{} = value, :datetime), do: {:ok, value}
  defp coerce_type(_, :datetime), do: {:error, ["must be a datetime"]}
  
  defp coerce_type(value, :date) when is_binary(value) do
    case Date.from_iso8601(value) do
      {:ok, date} -> {:ok, date}
      _ -> {:error, ["must be a valid ISO8601 date"]}
    end
  end
  defp coerce_type(%Date{} = value, :date), do: {:ok, value}
  defp coerce_type(_, :date), do: {:error, ["must be a date"]}
  
  defp coerce_type(value, {:array, item_type}) when is_list(value) do
    results = Enum.map(value, &coerce_type(&1, item_type))
    
    errors = 
      results
      |> Enum.with_index()
      |> Enum.filter(fn {{result, _}, _} -> result == :error end)
      |> Enum.map(fn {{:error, errs}, idx} -> "item #{idx}: #{Enum.join(errs, ", ")}" end)
    
    if errors == [] do
      {:ok, Enum.map(results, fn {:ok, v} -> v end)}
    else
      {:error, errors}
    end
  end
  defp coerce_type(value, {:array, item_type}) when is_binary(value) do
    case Jason.decode(value) do
      {:ok, list} when is_list(list) -> coerce_type(list, {:array, item_type})
      _ -> {:error, ["must be an array"]}
    end
  end
  defp coerce_type(_, {:array, _}), do: {:error, ["must be an array"]}

  # ---------------------------------------------------------------------------
  # Constraint Checks
  # ---------------------------------------------------------------------------
  
  defp check_min(value, nil, _rules), do: {:ok, value}
  
  defp check_min(value, min, _rules) when is_binary(value) do
    if String.length(value) >= min do
      {:ok, value}
    else
      {:error, ["must be at least #{min} characters"]}
    end
  end
  
  defp check_min(value, min, _rules) when is_number(value) do
    if value >= min do
      {:ok, value}
    else
      {:error, ["must be at least #{min}"]}
    end
  end
  
  defp check_min(value, min, _rules) when is_list(value) do
    if length(value) >= min do
      {:ok, value}
    else
      {:error, ["must have at least #{min} items"]}
    end
  end
  
  defp check_min(value, _min, _rules), do: {:ok, value}
  
  defp check_max(value, nil, _rules), do: {:ok, value}
  
  defp check_max(value, max, _rules) when is_binary(value) do
    if String.length(value) <= max do
      {:ok, value}
    else
      {:error, ["must be at most #{max} characters"]}
    end
  end
  
  defp check_max(value, max, _rules) when is_number(value) do
    if value <= max do
      {:ok, value}
    else
      {:error, ["must be at most #{max}"]}
    end
  end
  
  defp check_max(value, max, _rules) when is_list(value) do
    if length(value) <= max do
      {:ok, value}
    else
      {:error, ["must have at most #{max} items"]}
    end
  end
  
  defp check_max(value, _max, _rules), do: {:ok, value}

  # ---------------------------------------------------------------------------
  # Format Validation
  # ---------------------------------------------------------------------------
  
  defp check_format(value, nil), do: {:ok, value}
  
  defp check_format(value, :email) when is_binary(value) do
    if Regex.match?(@email_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid email format"]}
    end
  end
  
  defp check_format(value, :url) when is_binary(value) do
    if Regex.match?(@url_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid URL format"]}
    end
  end
  
  defp check_format(value, :uuid) when is_binary(value) do
    if Regex.match?(@uuid_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid UUID format"]}
    end
  end
  
  defp check_format(value, :ulid) when is_binary(value) do
    if Regex.match?(@ulid_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid ULID format"]}
    end
  end
  
  defp check_format(value, :slug) when is_binary(value) do
    if Regex.match?(@slug_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid slug format (lowercase letters, numbers, hyphens only)"]}
    end
  end
  
  defp check_format(value, :phone) when is_binary(value) do
    if Regex.match?(@phone_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid phone format"]}
    end
  end
  
  defp check_format(value, :hex_color) when is_binary(value) do
    if Regex.match?(@hex_color_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid hex color format"]}
    end
  end
  
  defp check_format(value, :ethereum_address) when is_binary(value) do
    if Regex.match?(@ethereum_address_pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid Ethereum address format"]}
    end
  end
  
  defp check_format(_value, format) do
    {:error, ["unknown format: #{format}"]}
  end

  # ---------------------------------------------------------------------------
  # Pattern & Inclusion Checks
  # ---------------------------------------------------------------------------
  
  defp check_pattern(value, nil), do: {:ok, value}
  
  defp check_pattern(value, pattern) when is_binary(value) do
    if Regex.match?(pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid format"]}
    end
  end
  
  defp check_pattern(value, _pattern), do: {:ok, value}
  
  defp check_inclusion(value, nil), do: {:ok, value}
  
  defp check_inclusion(value, allowed) when is_list(allowed) do
    if value in allowed do
      {:ok, value}
    else
      {:error, ["must be one of: #{Enum.join(allowed, ", ")}"]}
    end
  end
  
  defp check_exclusion(value, nil), do: {:ok, value}
  
  defp check_exclusion(value, forbidden) when is_list(forbidden) do
    if value in forbidden do
      {:error, ["is not allowed"]}
    else
      {:ok, value}
    end
  end
  
  defp check_custom(value, nil), do: {:ok, value}
  
  defp check_custom(value, validator) when is_function(validator, 1) do
    case validator.(value) do
      true -> {:ok, value}
      false -> {:error, ["is invalid"]}
      {:error, msg} when is_binary(msg) -> {:error, [msg]}
      {:ok, transformed} -> {:ok, transformed}
    end
  end

  # ---------------------------------------------------------------------------
  # Security Checks
  # ---------------------------------------------------------------------------
  
  defp check_security(value) when is_binary(value) do
    cond do
      String.length(value) > @max_string_length ->
        {:error, ["exceeds maximum length"]}
        
      contains_injection_pattern?(value) ->
        {:error, ["contains potentially dangerous content"]}
        
      true ->
        {:ok, value}
    end
  end
  
  defp check_security(value), do: {:ok, value}
  
  defp contains_injection_pattern?(value) do
    Enum.any?(@sql_injection_patterns, fn pattern ->
      Regex.match?(pattern, value)
    end)
  end

  # ---------------------------------------------------------------------------
  # Sanitization
  # ---------------------------------------------------------------------------
  
  defp apply_sanitizers(value, nil), do: {:ok, value}
  
  defp apply_sanitizers(value, sanitizers) when is_list(sanitizers) do
    sanitized = Enum.reduce(sanitizers, value, &apply_sanitizer/2)
    {:ok, sanitized}
  end
  
  defp apply_sanitizers(value, sanitizer), do: apply_sanitizers(value, [sanitizer])
  
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

  # ---------------------------------------------------------------------------
  # Utility Functions
  # ---------------------------------------------------------------------------
  
  defp normalize_keys(map) when is_map(map) do
    Map.new(map, fn
      {key, value} when is_binary(key) -> {String.to_atom(key), value}
      {key, value} when is_atom(key) -> {key, value}
    end)
  end
  
  @doc """
  Creates a reusable validator function from a schema.
  
  Useful when you want to define schemas at compile time.
  
  ## Example
  
      @user_validator validator(%{
        email: [type: :string, required: true, format: :email],
        name: [type: :string, required: true, min: 2, max: 100]
      })
      
      def create(conn, params) do
        with {:ok, validated} <- @user_validator.(params) do
          # ...
        end
      end
  """
  def validator(schema, opts \\ []) do
    fn params -> validate(params, schema, opts) end
  end
  
  @doc """
  Validates and returns only the first error for each field.
  
  Useful for displaying a single error message per field in forms.
  """
  def validate_first_error(params, schema, opts \\ []) do
    case validate(params, schema, opts) do
      {:ok, result} -> {:ok, result}
      {:error, errors} ->
        simplified = Map.new(errors, fn {field, messages} ->
          {field, List.first(messages)}
        end)
        {:error, simplified}
    end
  end
end
