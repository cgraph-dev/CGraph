defmodule Cgraph.Security.AbuseDetection do
  @moduledoc """
  Abuse detection and prevention system.
  
  ## Overview
  
  Provides real-time detection of abuse patterns:
  
  - **Spam Detection**: Content analysis for spam patterns
  - **Flood Detection**: Rapid repeated requests
  - **Account Takeover Detection**: Suspicious login patterns
  - **Bruteforce Detection**: Password guessing attempts
  - **Scraping Detection**: Systematic data extraction
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    ABUSE DETECTION SYSTEM                       │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Request ──► Analyze ──► Score ──► Threshold ──► Action        │
  │                │            │           │            │          │
  │         ┌──────▼──────┐ ┌───▼───┐ ┌─────▼─────┐ ┌────▼────┐   │
  │         │ Detectors   │ │ Score │ │ Threshold │ │ Actions │   │
  │         │  ├── Spam   │ │  0-100│ │   Based   │ │ ├─Allow │   │
  │         │  ├── Flood  │ │       │ │   Config  │ │ ├─Warn  │   │
  │         │  ├── ATO    │ │       │ │           │ │ ├─Block │   │
  │         │  └── Brute  │ │       │ │           │ │ └─Ban   │   │
  │         └─────────────┘ └───────┘ └───────────┘ └─────────┘   │
  │                                                                  │
  │  ┌───────────────────────────────────────────────────────────┐ │
  │  │                     Pattern Storage                        │ │
  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │ │
  │  │  │   ETS   │  │ Mnesia  │  │ Metrics │                   │ │
  │  │  │(counts) │  │(history)│  │(telemetry│                  │ │
  │  │  └─────────┘  └─────────┘  └─────────┘                   │ │
  │  └───────────────────────────────────────────────────────────┘ │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Check for abuse
      case AbuseDetection.check(user_id, :message, content: message) do
        :ok -> process_message()
        {:suspicious, score, reasons} -> flag_for_review()
        {:blocked, reasons} -> reject_request()
      end
      
      # Report abuse
      AbuseDetection.report(user_id, reporter_id, :spam, details)
      
      # Get abuse score
      score = AbuseDetection.get_score(user_id)
  """
  
  use GenServer
  require Logger
  
  @ets_table :cgraph_abuse_detection
  
  # Score thresholds
  @suspicious_threshold 50
  @block_threshold 80
  @ban_threshold 95
  
  # Time windows
  @score_decay_seconds 3600  # Scores decay over 1 hour
  @pattern_window_seconds 300  # 5 minute pattern window
  
  # Spam keywords (weighted)
  @spam_keywords %{
    # High weight
    "free money" => 20,
    "click here" => 15,
    "buy now" => 15,
    "limited time" => 12,
    "act now" => 12,
    # Medium weight
    "discount" => 8,
    "offer" => 5,
    "promotion" => 5,
    "sale" => 3
  }
  
  @type check_result :: 
    :ok | 
    {:suspicious, integer(), [atom()]} | 
    {:blocked, [atom()]}
  
  @type abuse_type :: 
    :spam | 
    :flood | 
    :account_takeover | 
    :bruteforce | 
    :scraping | 
    :harassment
  
  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Check if an action should be allowed.
  
  ## Options
  
  - `:content` - Text content to analyze
  - `:ip` - Client IP address
  - `:action` - The action being performed (e.g., :send_message, :create_post)
  - `:target_id` - Target user/resource ID
  """
  @spec check(String.t(), abuse_type(), keyword()) :: check_result()
  def check(user_id, type, opts \\ []) do
    score = calculate_score(user_id, type, opts)
    reasons = collect_reasons(user_id, type, opts)
    
    # Record the check
    record_event(user_id, type, score, opts)
    
    # Emit telemetry
    emit_telemetry(:check, user_id, type, score, reasons)
    
    cond do
      score >= @ban_threshold -> 
        {:blocked, [:auto_ban | reasons]}
      score >= @block_threshold -> 
        {:blocked, reasons}
      score >= @suspicious_threshold -> 
        {:suspicious, score, reasons}
      true -> 
        :ok
    end
  end
  
  @doc """
  Report abuse by another user.
  """
  @spec report(String.t(), String.t(), abuse_type(), map()) :: :ok
  def report(user_id, reporter_id, type, details \\ %{}) do
    GenServer.cast(__MODULE__, {:report, user_id, reporter_id, type, details})
  end
  
  @doc """
  Get current abuse score for a user.
  """
  @spec get_score(String.t()) :: integer()
  def get_score(user_id) do
    case :ets.lookup(@ets_table, {:score, user_id}) do
      [{_, score, timestamp}] ->
        # Apply time decay
        elapsed = System.system_time(:second) - timestamp
        decay = min(elapsed / @score_decay_seconds * 100, 100)
        max(0, round(score - decay))
      [] ->
        0
    end
  end
  
  @doc """
  Get abuse history for a user.
  """
  @spec get_history(String.t()) :: [map()]
  def get_history(user_id) do
    GenServer.call(__MODULE__, {:get_history, user_id})
  end
  
  @doc """
  Clear abuse data for a user (admin action).
  """
  @spec clear(String.t()) :: :ok
  def clear(user_id) do
    GenServer.cast(__MODULE__, {:clear, user_id})
  end
  
  @doc """
  Analyze text content for spam indicators.
  """
  @spec analyze_content(String.t()) :: {integer(), [String.t()]}
  def analyze_content(content) when is_binary(content) do
    content_lower = String.downcase(content)
    
    # Check spam keywords
    keyword_score = Enum.reduce(@spam_keywords, 0, fn {keyword, weight}, acc ->
      if String.contains?(content_lower, keyword), do: acc + weight, else: acc
    end)
    
    # Check URL density
    url_count = length(Regex.scan(~r/https?:\/\/[^\s]+/, content))
    url_score = min(url_count * 5, 30)
    
    # Check repeated characters
    repeat_score = if Regex.match?(~r/(.)\1{5,}/, content), do: 10, else: 0
    
    # Check CAPS RATIO
    caps_ratio = String.graphemes(content) 
      |> Enum.count(fn c -> c == String.upcase(c) and c != String.downcase(c) end)
      |> Kernel./(max(String.length(content), 1))
    caps_score = if caps_ratio > 0.5 and String.length(content) > 20, do: 15, else: 0
    
    # Check emoji spam
    emoji_count = length(Regex.scan(~r/[\x{1F300}-\x{1F9FF}]/u, content))
    emoji_score = if emoji_count > 10, do: 10, else: 0
    
    total_score = keyword_score + url_score + repeat_score + caps_score + emoji_score
    
    reasons = []
    reasons = if keyword_score > 0, do: ["spam_keywords" | reasons], else: reasons
    reasons = if url_score > 10, do: ["excessive_urls" | reasons], else: reasons
    reasons = if repeat_score > 0, do: ["repeated_characters" | reasons], else: reasons
    reasons = if caps_score > 0, do: ["excessive_caps" | reasons], else: reasons
    reasons = if emoji_score > 0, do: ["emoji_spam" | reasons], else: reasons
    
    {min(total_score, 100), reasons}
  end
  
  # ---------------------------------------------------------------------------
  # Server Callbacks
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(_opts) do
    # Create ETS table for fast lookups
    :ets.new(@ets_table, [:named_table, :set, :public, read_concurrency: true])
    
    # Schedule periodic cleanup
    schedule_cleanup()
    
    {:ok, %{history: %{}}}
  end
  
  @impl true
  def handle_cast({:report, user_id, reporter_id, type, details}, state) do
    # Add to history
    event = %{
      type: type,
      reporter_id: reporter_id,
      details: details,
      timestamp: DateTime.utc_now()
    }
    
    history = Map.update(state.history, user_id, [event], fn events ->
      [event | events] |> Enum.take(100)  # Keep last 100 events
    end)
    
    # Increase abuse score based on reports
    increment_score(user_id, report_weight(type))
    
    Logger.info("Abuse reported: user=#{user_id} type=#{type} by=#{reporter_id}")
    
    {:noreply, %{state | history: history}}
  end
  
  @impl true
  def handle_cast({:clear, user_id}, state) do
    :ets.delete(@ets_table, {:score, user_id})
    :ets.match_delete(@ets_table, {{:event, user_id, :_}, :_})
    
    history = Map.delete(state.history, user_id)
    
    {:noreply, %{state | history: history}}
  end
  
  @impl true
  def handle_call({:get_history, user_id}, _from, state) do
    history = Map.get(state.history, user_id, [])
    {:reply, history, state}
  end
  
  @impl true
  def handle_info(:cleanup, state) do
    # Remove expired entries
    now = System.system_time(:second)
    cutoff = now - @score_decay_seconds * 2
    
    :ets.select_delete(@ets_table, [
      {{:score, :_, :"$1"}, [{:<, :"$1", cutoff}], [true]},
      {{{:event, :_, :"$1"}, :_}, [{:<, :"$1", cutoff}], [true]}
    ])
    
    schedule_cleanup()
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------
  
  defp calculate_score(user_id, type, opts) do
    base_score = get_score(user_id)
    
    # Add type-specific scoring
    type_score = case type do
      :spam ->
        if content = opts[:content] do
          {score, _} = analyze_content(content)
          score
        else
          0
        end
      
      :flood ->
        # Count recent events
        event_count = count_recent_events(user_id, @pattern_window_seconds)
        if event_count > 10, do: min((event_count - 10) * 5, 50), else: 0
      
      :bruteforce ->
        # Failed login attempts
        failed_count = count_failed_logins(user_id)
        if failed_count > 3, do: min((failed_count - 3) * 15, 60), else: 0
      
      :account_takeover ->
        # Check for suspicious patterns
        check_ato_patterns(user_id, opts)
      
      _ ->
        0
    end
    
    min(base_score + type_score, 100)
  end
  
  defp collect_reasons(user_id, type, opts) do
    reasons = []
    
    # Check for previous reports
    reports = case :ets.lookup(@ets_table, {:reports, user_id}) do
      [{_, count}] when count > 0 -> [:previous_reports | reasons]
      _ -> reasons
    end
    
    # Check for content issues
    reports = if type == :spam and opts[:content] do
      {_, content_reasons} = analyze_content(opts[:content])
      Enum.map(content_reasons, &reason_to_atom/1) ++ reports
    else
      reports
    end
    
    # Check for flood patterns
    reports = if count_recent_events(user_id, 60) > 30 do
      [:flood_detected | reports]
    else
      reports
    end
    
    reports
  end
  
  defp record_event(user_id, type, score, _opts) do
    now = System.system_time(:second)
    
    # Store event
    :ets.insert(@ets_table, {{:event, user_id, now}, {type, score}})
    
    # Update score
    :ets.insert(@ets_table, {{:score, user_id}, score, now})
  end
  
  defp increment_score(user_id, amount) do
    now = System.system_time(:second)
    current = get_score(user_id)
    new_score = min(current + amount, 100)
    :ets.insert(@ets_table, {{:score, user_id}, new_score, now})
  end
  
  defp count_recent_events(user_id, seconds) do
    cutoff = System.system_time(:second) - seconds
    
    :ets.select_count(@ets_table, [
      {{{:event, user_id, :"$1"}, :_}, [{:>=, :"$1", cutoff}], [true]}
    ])
  end
  
  defp count_failed_logins(user_id) do
    # This would integrate with the auth system
    case :ets.lookup(@ets_table, {:failed_logins, user_id}) do
      [{_, count, _}] -> count
      [] -> 0
    end
  end
  
  defp check_ato_patterns(_user_id, opts) do
    score = 0
    
    # New IP address
    score = if opts[:new_ip], do: score + 15, else: score
    
    # Unusual time
    score = if opts[:unusual_time], do: score + 10, else: score
    
    # Multiple sessions
    score = if opts[:multiple_sessions], do: score + 20, else: score
    
    # Password change attempt
    score = if opts[:password_change], do: score + 25, else: score
    
    score
  end
  
  defp report_weight(type) do
    case type do
      :spam -> 15
      :harassment -> 25
      :account_takeover -> 30
      :fraud -> 40
      _ -> 10
    end
  end
  
  defp schedule_cleanup do
    Process.send_after(self(), :cleanup, 60_000)  # Every minute
  end
  
  @known_reasons %{
    "excessive_caps" => :excessive_caps,
    "repetitive_chars" => :repetitive_chars,
    "potential_spam_patterns" => :potential_spam_patterns,
    "suspicious_links" => :suspicious_links,
    "gibberish_detected" => :gibberish_detected
  }

  defp reason_to_atom(reason) when is_binary(reason) do
    Map.get(@known_reasons, reason, :unknown_content_issue)
  end
  
  defp emit_telemetry(event, user_id, type, score, reasons) do
    :telemetry.execute(
      [:cgraph, :abuse_detection, event],
      %{score: score},
      %{user_id: user_id, type: type, reasons: reasons}
    )
  end
end
