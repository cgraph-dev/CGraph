defmodule CGraphWeb.API.InputValidation.Constraints do
  @moduledoc """
  Constraint checks for input validation.

  Provides min/max bounds, pattern matching, inclusion/exclusion checks,
  and custom validator support for validated fields.
  """

  # ---------------------------------------------------------------------------
  # Min/Max Checks
  # ---------------------------------------------------------------------------

  @doc "Check minimum constraint (length for strings/lists, value for numbers)."
  @spec check_min(any(), number() | nil, keyword()) :: {:ok, any()} | {:error, [String.t()]}
  def check_min(value, nil, _rules), do: {:ok, value}

  def check_min(value, min, _rules) when is_binary(value) do
    if String.length(value) >= min do
      {:ok, value}
    else
      {:error, ["must be at least #{min} characters"]}
    end
  end

  def check_min(value, min, _rules) when is_number(value) do
    if value >= min do
      {:ok, value}
    else
      {:error, ["must be at least #{min}"]}
    end
  end

  def check_min(value, min, _rules) when is_list(value) do
    if length(value) >= min do
      {:ok, value}
    else
      {:error, ["must have at least #{min} items"]}
    end
  end

  def check_min(value, _min, _rules), do: {:ok, value}

  @doc "Check maximum constraint (length for strings/lists, value for numbers)."
  @spec check_max(any(), number() | nil, keyword()) :: {:ok, any()} | {:error, [String.t()]}
  def check_max(value, nil, _rules), do: {:ok, value}

  def check_max(value, max, _rules) when is_binary(value) do
    if String.length(value) <= max do
      {:ok, value}
    else
      {:error, ["must be at most #{max} characters"]}
    end
  end

  def check_max(value, max, _rules) when is_number(value) do
    if value <= max do
      {:ok, value}
    else
      {:error, ["must be at most #{max}"]}
    end
  end

  def check_max(value, max, _rules) when is_list(value) do
    if length(value) <= max do
      {:ok, value}
    else
      {:error, ["must have at most #{max} items"]}
    end
  end

  def check_max(value, _max, _rules), do: {:ok, value}

  # ---------------------------------------------------------------------------
  # Pattern & Inclusion Checks
  # ---------------------------------------------------------------------------

  @doc "Check value against a regex pattern."
  @spec check_pattern(any(), Regex.t() | nil) :: {:ok, any()} | {:error, [String.t()]}
  def check_pattern(value, nil), do: {:ok, value}

  def check_pattern(value, pattern) when is_binary(value) do
    if Regex.match?(pattern, value) do
      {:ok, value}
    else
      {:error, ["has invalid format"]}
    end
  end

  def check_pattern(value, _pattern), do: {:ok, value}

  @doc "Check value is in an allowed list."
  @spec check_inclusion(any(), list() | nil) :: {:ok, any()} | {:error, [String.t()]}
  def check_inclusion(value, nil), do: {:ok, value}

  def check_inclusion(value, allowed) when is_list(allowed) do
    if value in allowed do
      {:ok, value}
    else
      {:error, ["must be one of: #{Enum.join(allowed, ", ")}"]}
    end
  end

  @doc "Check value is not in a forbidden list."
  @spec check_exclusion(any(), list() | nil) :: {:ok, any()} | {:error, [String.t()]}
  def check_exclusion(value, nil), do: {:ok, value}

  def check_exclusion(value, forbidden) when is_list(forbidden) do
    if value in forbidden do
      {:error, ["is not allowed"]}
    else
      {:ok, value}
    end
  end

  @doc "Run a custom validator function."
  @spec check_custom(any(), fun() | nil) :: {:ok, any()} | {:error, [String.t()]}
  def check_custom(value, nil), do: {:ok, value}

  def check_custom(value, validator) when is_function(validator, 1) do
    case validator.(value) do
      true -> {:ok, value}
      false -> {:error, ["is invalid"]}
      {:error, msg} when is_binary(msg) -> {:error, [msg]}
      {:ok, transformed} -> {:ok, transformed}
    end
  end
end
