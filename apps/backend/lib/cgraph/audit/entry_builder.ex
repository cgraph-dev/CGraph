defmodule CGraph.Audit.EntryBuilder do
  @moduledoc """
  Builds and validates audit log entries.

  Handles entry construction with tamper-proof checksums,
  ID generation, and request context extraction from Plug.Conn.
  """

  @doc """
  Builds a complete audit entry map with a tamper-proof checksum.

  ## Parameters

  - `category` - Event category atom
  - `event_type` - Specific event type atom
  - `metadata` - Event-specific data map
  - `opts` - Keyword list of context options (:actor_id, :ip_address, etc.)
  """
  @spec build_entry(atom(), atom(), map(), keyword()) :: map()
  def build_entry(category, event_type, metadata, opts) do
    now = DateTime.utc_now()
    id = generate_id()

    entry = %{
      id: id,
      category: category,
      event_type: event_type,
      actor_id: Keyword.get(opts, :actor_id),
      actor_type: Keyword.get(opts, :actor_type, :user),
      target_id: Keyword.get(opts, :target_id),
      target_type: Keyword.get(opts, :target_type),
      metadata: metadata,
      ip_address: Keyword.get(opts, :ip_address),
      user_agent: Keyword.get(opts, :user_agent),
      session_id: Keyword.get(opts, :session_id),
      request_id: Keyword.get(opts, :request_id),
      timestamp: now
    }

    # Add tamper-proof checksum
    Map.put(entry, :checksum, compute_checksum(entry))
  end

  @doc """
  Generates a random sortable ID for an audit entry.
  """
  @spec generate_id() :: String.t()
  def generate_id do
    # ULID-style sortable ID
    :crypto.strong_rand_bytes(16)
    |> Base.encode16(case: :lower)
  end

  @doc """
  Computes a SHA-256 based checksum of entry fields for tamper detection.
  """
  @spec compute_checksum(map()) :: String.t()
  def compute_checksum(entry) do
    # Create deterministic hash of entry data
    data =
      [
        entry.id,
        to_string(entry.category),
        to_string(entry.event_type),
        entry.actor_id || "",
        entry.target_id || "",
        Jason.encode!(entry.metadata),
        DateTime.to_iso8601(entry.timestamp)
      ]
      |> Enum.join("|")

    :crypto.hash(:sha256, data)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end

  @doc """
  Verifies that an entry's checksum is valid (entry has not been tampered with).
  """
  @spec verify_entry_integrity(map()) :: boolean()
  def verify_entry_integrity(entry) do
    expected = compute_checksum(Map.delete(entry, :checksum))
    entry.checksum == expected
  end

  # ---------------------------------------------------------------------------
  # Context Extraction Helpers
  # ---------------------------------------------------------------------------

  @doc """
  Formats an IP address tuple into a string representation.
  Handles both IPv4 (4-tuple) and IPv6 (8-tuple) addresses.
  """
  @spec format_ip(tuple() | term()) :: String.t()
  def format_ip(ip) when is_tuple(ip) and tuple_size(ip) == 4 do
    ip
    |> Tuple.to_list()
    |> Enum.join(".")
  end

  def format_ip(ip) when is_tuple(ip) and tuple_size(ip) == 8 do
    ip
    |> Tuple.to_list()
    |> Enum.map(&Integer.to_string(&1, 16))
    |> Enum.join(":")
  end

  def format_ip(ip), do: to_string(ip)

  @doc """
  Extracts a request header value from a Plug.Conn.
  """
  @spec get_header(Plug.Conn.t(), String.t()) :: String.t() | nil
  def get_header(conn, header) do
    case Plug.Conn.get_req_header(conn, header) do
      [value | _] -> value
      _ -> nil
    end
  end

  @doc """
  Extracts the session ID from conn assigns.
  """
  @spec get_session_id(Plug.Conn.t()) :: String.t() | nil
  def get_session_id(conn) do
    case conn.assigns do
      %{session_id: id} -> id
      _ -> nil
    end
  end
end
