defmodule CGraphWeb.API.InputValidation do
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

  @doc "Creates a new input validation schema."
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

  alias CGraphWeb.API.InputValidation.{TypeCoercion, Constraints, Sanitization}

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
    params = normalize_keys(params)

    case validate_strict_mode(params, schema, strict) do
      :ok -> do_validate(params, schema)
      {:error, _} = error -> error
    end
  end

  defp validate_strict_mode(params, schema, true) do
    unknown = Map.keys(params) -- Map.keys(schema)
    if unknown == [] do
      :ok
    else
      errors = Map.new(unknown, fn key -> {key, ["unknown field"]} end)
      {:error, errors}
    end
  end
  defp validate_strict_mode(_params, _schema, false), do: :ok

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
        with {:ok, v} <- TypeCoercion.coerce(value, Keyword.get(rules, :type)),
             {:ok, v} <- Constraints.check_min(v, Keyword.get(rules, :min), rules),
             {:ok, v} <- Constraints.check_max(v, Keyword.get(rules, :max), rules),
             {:ok, v} <- Sanitization.check_format(v, Keyword.get(rules, :format)),
             {:ok, v} <- Constraints.check_pattern(v, Keyword.get(rules, :pattern)),
             {:ok, v} <- Constraints.check_inclusion(v, Keyword.get(rules, :in)),
             {:ok, v} <- Constraints.check_exclusion(v, Keyword.get(rules, :not_in)),
             {:ok, v} <- Constraints.check_custom(v, Keyword.get(rules, :custom)),
             {:ok, v} <- Sanitization.check_security(v) do
          Sanitization.apply_sanitizers(v, Keyword.get(rules, :sanitize))
        end
    end
  end

  # ---------------------------------------------------------------------------
  # Utility Functions
  # ---------------------------------------------------------------------------

  @allowed_param_keys ~w(email username password password_confirmation content title
    body name description limit offset page per_page type status query q
    conversation_id message_id user_id group_id channel_id thread_id post_id
    comment_id friend_id sender_id recipient_id emoji reaction reply_to_id
    is_public is_private is_encrypted typing sort order direction filter
    bio avatar_url banner_url display_name custom_status slug topic
    content_type file_url file_name file_size pin_hash wallet_address
    parent_id category_id role_id permission permissions color position
    start_at end_at expires_at inserted_at updated_at created_at)a

  defp normalize_keys(map) when is_map(map) do
    Map.new(map, fn
      {key, value} when is_binary(key) ->
        atom_key = if key in @allowed_param_keys, do: String.to_existing_atom(key), else: key
        {atom_key, value}
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
  @spec validator(schema(), keyword()) :: (map() -> validation_result())
  def validator(schema, opts \\ []) do
    fn params -> validate(params, schema, opts) end
  end

  @doc """
  Validates and returns only the first error for each field.

  Useful for displaying a single error message per field in forms.
  """
  @spec validate_first_error(map(), schema(), keyword()) :: {:ok, map()} | {:error, map()}
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
