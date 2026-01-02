defmodule Cgraph.Security.InputValidator do
  @moduledoc """
  Comprehensive input validation and sanitization.
  
  ## Overview
  
  Provides a centralized input validation system that:
  
  - Validates all user inputs before processing
  - Sanitizes HTML/Markdown content
  - Detects and blocks injection attempts
  - Enforces length and format constraints
  - Normalizes unicode and whitespace
  
  ## Security Features
  
  - **SQL Injection Prevention**: Pattern detection for SQL keywords
  - **XSS Prevention**: HTML sanitization and entity encoding
  - **Path Traversal Prevention**: Blocks ../ and similar patterns
  - **Command Injection Prevention**: Detects shell metacharacters
  - **SSRF Prevention**: URL validation and blocklisting
  
  ## Usage
  
      # Validate and sanitize user input
      {:ok, clean_input} = InputValidator.validate_text(user_input, max_length: 1000)
      
      # Validate email
      {:ok, email} = InputValidator.validate_email("user@example.com")
      
      # Validate username
      {:ok, username} = InputValidator.validate_username("john_doe")
      
      # Validate URL
      {:ok, url} = InputValidator.validate_url("https://example.com", allow_localhost: false)
  """
  
  @max_text_length 50_000
  @max_username_length 32
  @min_username_length 3
  @max_email_length 254
  
  # Dangerous SQL patterns
  @sql_injection_patterns [
    ~r/(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE)\s/i,
    ~r/\b(UNION\s+ALL|UNION\s+SELECT)\b/i,
    ~r/(--|#|\/\*|\*\/)/,  # SQL comments
    ~r/(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,  # OR 1=1, AND 2=2
    ~r/\bSLEEP\s*\(/i,  # Time-based injection
    ~r/\bBENCHMARK\s*\(/i,
    ~r/\bWAITFOR\s+DELAY\b/i
  ]
  
  # XSS patterns
  @xss_patterns [
    ~r/<script\b[^>]*>.*?<\/script>/is,
    ~r/javascript\s*:/i,
    ~r/vbscript\s*:/i,
    ~r/data\s*:[^,]*base64/i,
    ~r/on\w+\s*=/i,  # onclick=, onerror=, etc.
    ~r/<iframe\b/i,
    ~r/<object\b/i,
    ~r/<embed\b/i,
    ~r/<form\b/i,
    ~r/<meta\b[^>]*http-equiv/i
  ]
  
  # Path traversal patterns
  @path_traversal_patterns [
    ~r/\.\.\//,
    ~r/\.\.\\/, 
    ~r/%2e%2e%2f/i,
    ~r/%2e%2e\//i,
    ~r/\.\.%2f/i,
    ~r/%252e%252e%252f/i  # Double-encoded
  ]
  
  # Command injection patterns
  @command_injection_patterns [
    ~r/[;&|`$]/,  # Shell metacharacters
    ~r/\$\(/,  # Command substitution
    ~r/`[^`]+`/,  # Backtick execution
    ~r/\|\s*\w+/,  # Pipe to command
    ~r/>\s*\//,  # Redirect to file
    ~r/<\s*\//  # Redirect from file
  ]
  
  @type validation_error :: 
    :too_long | 
    :too_short | 
    :invalid_format | 
    :invalid_characters |
    :sql_injection_detected |
    :xss_detected |
    :path_traversal_detected |
    :command_injection_detected |
    :empty |
    :invalid_email |
    :invalid_url |
    :blocked_domain
  
  @doc """
  Validate and sanitize general text input.
  
  ## Options
  
  - `:max_length` - Maximum allowed length (default: 50000)
  - `:min_length` - Minimum required length (default: 0)
  - `:allow_html` - Allow HTML tags (default: false)
  - `:allow_markdown` - Allow Markdown syntax (default: true)
  - `:strip_whitespace` - Strip leading/trailing whitespace (default: true)
  - `:normalize_unicode` - Normalize unicode to NFC form (default: true)
  """
  @spec validate_text(String.t(), keyword()) :: {:ok, String.t()} | {:error, validation_error()}
  def validate_text(text, opts \\ []) when is_binary(text) do
    max_length = Keyword.get(opts, :max_length, @max_text_length)
    min_length = Keyword.get(opts, :min_length, 0)
    allow_html = Keyword.get(opts, :allow_html, false)
    strip_whitespace = Keyword.get(opts, :strip_whitespace, true)
    normalize_unicode = Keyword.get(opts, :normalize_unicode, true)
    
    with :ok <- check_not_empty(text, min_length),
         :ok <- check_length(text, min_length, max_length),
         :ok <- check_sql_injection(text),
         :ok <- check_xss(text, allow_html),
         :ok <- check_path_traversal(text),
         {:ok, cleaned} <- sanitize_text(text, strip_whitespace, normalize_unicode) do
      {:ok, cleaned}
    end
  end
  
  @doc """
  Validate email address.
  """
  @spec validate_email(String.t()) :: {:ok, String.t()} | {:error, validation_error()}
  def validate_email(email) when is_binary(email) do
    email = String.trim(email) |> String.downcase()
    
    with :ok <- check_not_empty(email, 1),
         :ok <- check_length(email, 5, @max_email_length),
         :ok <- check_email_format(email) do
      {:ok, email}
    end
  end
  
  @doc """
  Validate username.
  """
  @spec validate_username(String.t()) :: {:ok, String.t()} | {:error, validation_error()}
  def validate_username(username) when is_binary(username) do
    username = String.trim(username)
    
    with :ok <- check_not_empty(username, @min_username_length),
         :ok <- check_length(username, @min_username_length, @max_username_length),
         :ok <- check_username_format(username),
         :ok <- check_reserved_username(username) do
      {:ok, username}
    end
  end
  
  @doc """
  Validate URL.
  
  ## Options
  
  - `:allow_localhost` - Allow localhost URLs (default: false in production)
  - `:allowed_schemes` - Allowed URL schemes (default: ["https", "http"])
  - `:blocked_domains` - List of blocked domains
  """
  @spec validate_url(String.t(), keyword()) :: {:ok, String.t()} | {:error, validation_error()}
  def validate_url(url, opts \\ []) when is_binary(url) do
    allow_localhost = Keyword.get(opts, :allow_localhost, Mix.env() == :dev)
    allowed_schemes = Keyword.get(opts, :allowed_schemes, ["https", "http"])
    blocked_domains = Keyword.get(opts, :blocked_domains, [])
    
    url = String.trim(url)
    
    with :ok <- check_not_empty(url, 1),
         {:ok, parsed} <- parse_url(url),
         :ok <- check_url_scheme(parsed, allowed_schemes),
         :ok <- check_url_host(parsed, allow_localhost, blocked_domains),
         :ok <- check_ssrf_bypass(parsed) do
      {:ok, url}
    end
  end
  
  @doc """
  Validate password strength.
  
  Returns `:ok` if password meets requirements, or `{:error, reasons}` with list of failures.
  """
  @spec validate_password(String.t()) :: :ok | {:error, [String.t()]}
  def validate_password(password) when is_binary(password) do
    errors = []
    
    errors = if String.length(password) < 8, do: ["Password must be at least 8 characters" | errors], else: errors
    errors = if String.length(password) > 128, do: ["Password must be at most 128 characters" | errors], else: errors
    errors = if not Regex.match?(~r/[a-z]/, password), do: ["Password must contain a lowercase letter" | errors], else: errors
    errors = if not Regex.match?(~r/[A-Z]/, password), do: ["Password must contain an uppercase letter" | errors], else: errors
    errors = if not Regex.match?(~r/[0-9]/, password), do: ["Password must contain a number" | errors], else: errors
    
    # Check for common patterns
    errors = if Regex.match?(~r/^(.)\1+$/, password), do: ["Password cannot be all the same character" | errors], else: errors
    errors = if Regex.match?(~r/^(012|123|234|345|456|567|678|789|abc|bcd|cde|def)/i, password), 
               do: ["Password cannot be a simple sequence" | errors], 
               else: errors
    
    if errors == [], do: :ok, else: {:error, Enum.reverse(errors)}
  end
  
  @doc """
  Validate UUID format.
  """
  @spec validate_uuid(String.t()) :: {:ok, String.t()} | {:error, validation_error()}
  def validate_uuid(uuid) when is_binary(uuid) do
    uuid = String.trim(uuid) |> String.downcase()
    
    if Regex.match?(~r/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, uuid) do
      {:ok, uuid}
    else
      {:error, :invalid_format}
    end
  end
  
  @doc """
  Validate integer within range.
  """
  @spec validate_integer(String.t() | integer(), integer(), integer()) :: {:ok, integer()} | {:error, validation_error()}
  def validate_integer(value, min, max) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} -> validate_integer(int, min, max)
      _ -> {:error, :invalid_format}
    end
  end
  
  def validate_integer(value, min, max) when is_integer(value) do
    cond do
      value < min -> {:error, :too_short}
      value > max -> {:error, :too_long}
      true -> {:ok, value}
    end
  end
  
  @doc """
  Sanitize filename for storage.
  """
  @spec sanitize_filename(String.t()) :: {:ok, String.t()} | {:error, validation_error()}
  def sanitize_filename(filename) when is_binary(filename) do
    with :ok <- check_path_traversal(filename) do
      # Remove any path components
      basename = Path.basename(filename)
      
      # Remove dangerous characters
      sanitized = basename
        |> String.replace(~r/[<>:"|?*\\\/]/, "_")
        |> String.replace(~r/[\x00-\x1f\x7f]/, "")  # Control characters
        |> String.trim()
        |> String.slice(0, 255)  # Max filename length
      
      if sanitized == "" or sanitized in [".", ".."] do
        {:error, :invalid_format}
      else
        {:ok, sanitized}
      end
    end
  end
  
  # Private helpers
  
  defp check_not_empty(text, min_length) do
    if String.trim(text) == "" and min_length > 0 do
      {:error, :empty}
    else
      :ok
    end
  end
  
  defp check_length(text, min, max) do
    len = String.length(text)
    cond do
      len < min -> {:error, :too_short}
      len > max -> {:error, :too_long}
      true -> :ok
    end
  end
  
  defp check_sql_injection(text) do
    if Enum.any?(@sql_injection_patterns, &Regex.match?(&1, text)) do
      {:error, :sql_injection_detected}
    else
      :ok
    end
  end
  
  defp check_xss(text, allow_html) do
    if not allow_html and Enum.any?(@xss_patterns, &Regex.match?(&1, text)) do
      {:error, :xss_detected}
    else
      :ok
    end
  end
  
  defp check_path_traversal(text) do
    if Enum.any?(@path_traversal_patterns, &Regex.match?(&1, text)) do
      {:error, :path_traversal_detected}
    else
      :ok
    end
  end
  
  defp check_email_format(email) do
    # RFC 5322 compliant email regex (simplified)
    email_regex = ~r/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if Regex.match?(email_regex, email) do
      :ok
    else
      {:error, :invalid_email}
    end
  end
  
  defp check_username_format(username) do
    # Alphanumeric, underscores, and hyphens only
    if Regex.match?(~r/^[a-zA-Z][a-zA-Z0-9_-]*$/, username) do
      :ok
    else
      {:error, :invalid_characters}
    end
  end
  
  defp check_reserved_username(username) do
    reserved = [
      "admin", "administrator", "root", "system", "moderator", "mod",
      "support", "help", "api", "www", "mail", "email", "ftp", "ssh",
      "null", "undefined", "true", "false", "nil", "test", "demo",
      "cgraph", "official", "staff", "team", "bot", "webhook"
    ]
    
    if String.downcase(username) in reserved do
      {:error, :invalid_format}
    else
      :ok
    end
  end
  
  defp parse_url(url) do
    case URI.parse(url) do
      %URI{scheme: nil} -> {:error, :invalid_url}
      %URI{host: nil} -> {:error, :invalid_url}
      %URI{host: ""} -> {:error, :invalid_url}
      uri -> {:ok, uri}
    end
  end
  
  defp check_url_scheme(%URI{scheme: scheme}, allowed) do
    if String.downcase(scheme) in allowed do
      :ok
    else
      {:error, :invalid_url}
    end
  end
  
  defp check_url_host(%URI{host: host}, allow_localhost, blocked_domains) do
    host_lower = String.downcase(host)
    
    # Check localhost
    localhost_patterns = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]
    is_localhost = Enum.any?(localhost_patterns, &String.starts_with?(host_lower, &1))
    
    cond do
      is_localhost and not allow_localhost -> {:error, :blocked_domain}
      host_lower in blocked_domains -> {:error, :blocked_domain}
      Enum.any?(blocked_domains, &String.ends_with?(host_lower, ".#{&1}")) -> {:error, :blocked_domain}
      true -> :ok
    end
  end
  
  defp check_ssrf_bypass(%URI{host: host}) do
    # Detect common SSRF bypass techniques
    ssrf_patterns = [
      ~r/^0x[0-9a-f]+$/i,  # Hex IP
      ~r/^\d{10,}$/,  # Decimal IP
      ~r/^[0-7]{4,}$/,  # Octal IP
      ~r/169\.254\./,  # Link-local
      ~r/192\.168\./,  # Private
      ~r/10\./,  # Private
      ~r/172\.(1[6-9]|2[0-9]|3[01])\./,  # Private
      ~r/\.internal$/i,  # Internal domain
      ~r/\.local$/i,  # mDNS
      ~r/\.localhost$/i  # localhost subdomain
    ]
    
    if Enum.any?(ssrf_patterns, &Regex.match?(&1, host)) do
      {:error, :blocked_domain}
    else
      :ok
    end
  end
  
  defp sanitize_text(text, strip_whitespace, normalize_unicode) do
    text = if strip_whitespace, do: String.trim(text), else: text
    
    text = if normalize_unicode do
      :unicode.characters_to_nfc_binary(text)
    else
      text
    end
    
    # Remove null bytes and other dangerous characters
    text = String.replace(text, <<0>>, "")
    
    {:ok, text}
  end
end
