defmodule CgraphWeb.Plugs.SecurityHeaders do
  @moduledoc """
  Security headers plug implementing OWASP security best practices.

  ## Headers Applied

  | Header | Purpose |
  |--------|---------|
  | `Strict-Transport-Security` | Force HTTPS (HSTS) |
  | `Content-Security-Policy` | Prevent XSS and data injection |
  | `X-Content-Type-Options` | Prevent MIME sniffing |
  | `X-Frame-Options` | Prevent clickjacking |
  | `X-XSS-Protection` | Legacy XSS protection |
  | `Referrer-Policy` | Control referrer information |
  | `Permissions-Policy` | Restrict browser features |
  | `Cross-Origin-Opener-Policy` | Isolate browsing context |
  | `Cross-Origin-Resource-Policy` | Control resource loading |

  ## Configuration

  Configure in your config files:

      config :cgraph, CgraphWeb.Plugs.SecurityHeaders,
        hsts: true,
        hsts_max_age: 31_536_000,
        csp_report_uri: "/api/csp-report",
        frame_ancestors: "'none'",
        content_security_policy: :strict

  ## Usage

      # In router.ex
      pipeline :api do
        plug CgraphWeb.Plugs.SecurityHeaders, mode: :api
      end

      pipeline :browser do
        plug CgraphWeb.Plugs.SecurityHeaders, mode: :browser
      end

  ## CSP Modes

  - `:strict` - Restrictive CSP for APIs
  - `:standard` - Balanced CSP for web apps
  - `:relaxed` - Permissive CSP (development)
  - `:report_only` - Only report violations

  ## Telemetry

  - `[:cgraph, :security, :headers_applied]` - Headers set on response
  """

  @behaviour Plug

  import Plug.Conn

  require Logger

  # HSTS max age: 1 year in seconds
  @default_hsts_max_age 31_536_000
  
  # Preload HSTS to submit to browser preload lists
  @hsts_preload true

  @impl true
  def init(opts) do
    mode = Keyword.get(opts, :mode, :api)
    config = Application.get_env(:cgraph, __MODULE__, [])
    
    %{
      mode: mode,
      hsts_enabled: Keyword.get(config, :hsts, true),
      hsts_max_age: Keyword.get(config, :hsts_max_age, @default_hsts_max_age),
      hsts_preload: Keyword.get(config, :hsts_preload, @hsts_preload),
      csp_mode: Keyword.get(config, :content_security_policy, :strict),
      csp_report_uri: Keyword.get(config, :csp_report_uri),
      frame_ancestors: Keyword.get(config, :frame_ancestors, "'none'"),
      report_only: Keyword.get(config, :report_only, false)
    }
  end

  @impl true
  def call(conn, opts) do
    conn
    |> apply_hsts(opts)
    |> apply_csp(opts)
    |> apply_xss_protection()
    |> apply_content_type_options()
    |> apply_frame_options(opts)
    |> apply_referrer_policy()
    |> apply_permissions_policy(opts)
    |> apply_cross_origin_policies()
    |> emit_telemetry(opts)
  end

  # HSTS - HTTP Strict Transport Security
  defp apply_hsts(conn, %{hsts_enabled: true, hsts_max_age: max_age, hsts_preload: preload}) do
    value = build_hsts_value(max_age, preload)
    put_resp_header(conn, "strict-transport-security", value)
  end
  defp apply_hsts(conn, _opts), do: conn

  defp build_hsts_value(max_age, true) do
    "max-age=#{max_age}; includeSubDomains; preload"
  end
  defp build_hsts_value(max_age, false) do
    "max-age=#{max_age}; includeSubDomains"
  end

  # Content Security Policy
  defp apply_csp(conn, %{mode: mode, csp_mode: csp_mode, csp_report_uri: report_uri, report_only: report_only}) do
    csp_value = build_csp(mode, csp_mode, report_uri)
    
    header_name = if report_only do
      "content-security-policy-report-only"
    else
      "content-security-policy"
    end
    
    put_resp_header(conn, header_name, csp_value)
  end

  defp build_csp(:api, :strict, report_uri) do
    directives = [
      "default-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'",
      "base-uri 'none'",
      "upgrade-insecure-requests"
    ]
    
    directives = if report_uri do
      directives ++ ["report-uri #{report_uri}"]
    else
      directives
    end
    
    Enum.join(directives, "; ")
  end

  defp build_csp(:browser, :strict, report_uri) do
    directives = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' wss: https:",
      "media-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests"
    ]
    
    directives = if report_uri do
      directives ++ ["report-uri #{report_uri}"]
    else
      directives
    end
    
    Enum.join(directives, "; ")
  end

  defp build_csp(:browser, :standard, report_uri) do
    directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https:",
      "connect-src 'self' wss: https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'"
    ]
    
    directives = if report_uri do
      directives ++ ["report-uri #{report_uri}"]
    else
      directives
    end
    
    Enum.join(directives, "; ")
  end

  defp build_csp(_, :relaxed, _report_uri) do
    # Development mode - very permissive
    [
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
      "frame-ancestors *"
    ]
    |> Enum.join("; ")
  end

  defp build_csp(mode, :report_only, report_uri) do
    # Same as strict but for reporting
    build_csp(mode, :strict, report_uri)
  end

  defp build_csp(mode, _, report_uri) do
    build_csp(mode, :strict, report_uri)
  end

  # X-XSS-Protection (legacy but still useful)
  defp apply_xss_protection(conn) do
    put_resp_header(conn, "x-xss-protection", "1; mode=block")
  end

  # X-Content-Type-Options - prevent MIME sniffing
  defp apply_content_type_options(conn) do
    put_resp_header(conn, "x-content-type-options", "nosniff")
  end

  # X-Frame-Options - prevent clickjacking
  defp apply_frame_options(conn, %{frame_ancestors: "'self'"}) do
    put_resp_header(conn, "x-frame-options", "SAMEORIGIN")
  end
  defp apply_frame_options(conn, _opts) do
    put_resp_header(conn, "x-frame-options", "DENY")
  end

  # Referrer-Policy - control referrer information
  defp apply_referrer_policy(conn) do
    put_resp_header(conn, "referrer-policy", "strict-origin-when-cross-origin")
  end

  # Permissions-Policy (formerly Feature-Policy)
  defp apply_permissions_policy(conn, %{mode: :api}) do
    policy = [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()"  # Opt out of FLoC
    ]
    |> Enum.join(", ")
    
    put_resp_header(conn, "permissions-policy", policy)
  end

  defp apply_permissions_policy(conn, %{mode: :browser}) do
    policy = [
      "accelerometer=(self)",
      "camera=(self)",
      "geolocation=(self)",
      "gyroscope=(self)",
      "magnetometer=(self)",
      "microphone=(self)",
      "payment=(self)",
      "usb=(self)",
      "interest-cohort=()"  # Opt out of FLoC
    ]
    |> Enum.join(", ")
    
    put_resp_header(conn, "permissions-policy", policy)
  end

  # Cross-Origin policies
  defp apply_cross_origin_policies(conn) do
    conn
    |> put_resp_header("cross-origin-opener-policy", "same-origin")
    |> put_resp_header("cross-origin-resource-policy", "same-origin")
    |> put_resp_header("cross-origin-embedder-policy", "require-corp")
  end

  # Telemetry
  defp emit_telemetry(conn, opts) do
    :telemetry.execute(
      [:cgraph, :security, :headers_applied],
      %{count: 1},
      %{mode: opts.mode, path: conn.request_path}
    )
    
    conn
  end
end
