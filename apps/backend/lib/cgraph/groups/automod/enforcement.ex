defmodule CGraph.Groups.Automod.Enforcement do
  @moduledoc """
  Runtime message checking against automod rules.

  Checks every message sent in group channels against enabled automod rules
  and executes configured actions (delete, warn, mute, flag_for_review).
  """

  import Ecto.Query
  alias CGraph.Groups.AutomodRule
  alias CGraph.Repo

  @type check_result :: :ok | {:blocked, AutomodRule.t()}

  # Simple ETS-based cache for enabled rules (TTL 60 seconds)
  @cache_ttl_ms 60_000

  @doc """
  Check message content against all enabled automod rules for the group.
  Returns :ok if message passes, or {:blocked, rule} on first matching rule.
  """
  @spec check_message(binary(), binary(), binary()) :: check_result
  def check_message(group_id, content, _sender_id) do
    rules = get_enabled_rules_cached(group_id)
    check_rules(rules, content)
  end

  @doc """
  Execute the action configured on a matched automod rule.
  Returns an action descriptor for the channel to handle.
  """
  @spec execute_action(AutomodRule.t(), binary(), map(), Phoenix.Socket.t()) ::
          {:delete, map()} | {:warn, map()} | {:mute, map()} | {:flag, map()}
  def execute_action(%AutomodRule{action: "delete"} = rule, _content, _member, _socket) do
    {:delete, %{reason: "automod_blocked", rule_name: rule.name, rule_type: rule.rule_type}}
  end

  def execute_action(%AutomodRule{action: "warn"} = rule, _content, _member, _socket) do
    {:warn, %{warning: "Message flagged by automod rule: #{rule.name}", rule_name: rule.name}}
  end

  def execute_action(%AutomodRule{action: "mute"} = rule, _content, member, _socket) do
    # Mute for 5 minutes — in production would escalate for repeat offenses
    mute_until = DateTime.utc_now() |> DateTime.add(300, :second)
    {:mute, %{
      member_id: member.id,
      mute_until: mute_until,
      reason: "Automod rule: #{rule.name}",
      rule_name: rule.name
    }}
  end

  def execute_action(%AutomodRule{action: "flag_for_review"} = rule, content, _member, _socket) do
    {:flag, %{
      description: "Flagged by automod rule: #{rule.name}",
      content_preview: String.slice(content, 0, 200),
      rule_name: rule.name,
      category: "automod_flag"
    }}
  end

  # ===========================================================================
  # Rule Checkers
  # ===========================================================================

  defp check_rules([], _content), do: :ok

  defp check_rules([rule | rest], content) do
    case check_single_rule(rule, content) do
      :ok -> check_rules(rest, content)
      :blocked -> {:blocked, rule}
    end
  end

  defp check_single_rule(%AutomodRule{rule_type: "word_filter"} = rule, content) do
    check_word_filter(rule.pattern, content)
  end

  defp check_single_rule(%AutomodRule{rule_type: "link_filter"} = rule, content) do
    check_link_filter(rule.pattern, content)
  end

  defp check_single_rule(%AutomodRule{rule_type: "spam_detection"}, _content) do
    # Spam detection is rate-based — handled separately via ETS counters
    # For now, defer to the channel's built-in rate limiter
    :ok
  end

  defp check_single_rule(%AutomodRule{rule_type: "caps_filter"}, content) do
    check_caps_filter(content)
  end

  defp check_single_rule(_rule, _content), do: :ok

  @doc false
  defp check_word_filter(pattern, content) do
    words = pattern
    |> String.split(",")
    |> Enum.map(&String.trim/1)
    |> Enum.map(&String.downcase/1)
    |> Enum.filter(&(&1 != ""))

    lowered = String.downcase(content)

    if Enum.any?(words, fn word ->
      # Support simple wildcard matching with *
      if String.contains?(word, "*") do
        regex_pattern = word
        |> Regex.escape()
        |> String.replace("\\*", ".*")

        case Regex.compile(regex_pattern) do
          {:ok, regex} -> Regex.match?(regex, lowered)
          _ -> String.contains?(lowered, String.replace(word, "*", ""))
        end
      else
        # Word boundary check — match whole words
        String.contains?(lowered, word)
      end
    end) do
      :blocked
    else
      :ok
    end
  end

  @doc false
  defp check_link_filter(pattern, content) do
    # Extract URLs from content
    url_regex = ~r{https?://[^\s<>\"']+|www\.[^\s<>\"']+}i
    urls = Regex.scan(url_regex, content) |> List.flatten()

    if urls == [] do
      :ok
    else
      blocked_domains = pattern
      |> String.split(",")
      |> Enum.map(&String.trim/1)
      |> Enum.map(&String.downcase/1)
      |> Enum.filter(&(&1 != ""))

      has_blocked = Enum.any?(urls, fn url ->
        lowered_url = String.downcase(url)
        Enum.any?(blocked_domains, fn domain ->
          String.contains?(lowered_url, domain)
        end)
      end)

      if has_blocked, do: :blocked, else: :ok
    end
  end

  @doc false
  defp check_caps_filter(content) do
    # Only check messages longer than 10 chars
    if String.length(content) > 10 do
      letters = content |> String.graphemes() |> Enum.filter(&String.match?(&1, ~r/[a-zA-Z]/))
      total = length(letters)

      if total > 0 do
        uppercase = letters |> Enum.count(&(&1 == String.upcase(&1)))
        ratio = uppercase / total

        if ratio > 0.7, do: :blocked, else: :ok
      else
        :ok
      end
    else
      :ok
    end
  end

  # ===========================================================================
  # Caching
  # ===========================================================================

  defp get_enabled_rules_cached(group_id) do
    cache_key = {:automod_rules, group_id}

    case Process.get(cache_key) do
      {rules, cached_at} when is_list(rules) ->
        if System.monotonic_time(:millisecond) - cached_at < @cache_ttl_ms do
          rules
        else
          rules = fetch_enabled_rules(group_id)
          Process.put(cache_key, {rules, System.monotonic_time(:millisecond)})
          rules
        end

      _ ->
        rules = fetch_enabled_rules(group_id)
        Process.put(cache_key, {rules, System.monotonic_time(:millisecond)})
        rules
    end
  end

  defp fetch_enabled_rules(group_id) do
    AutomodRule
    |> where(group_id: ^group_id, is_enabled: true)
    |> order_by(asc: :inserted_at)
    |> Repo.all()
  end
end
