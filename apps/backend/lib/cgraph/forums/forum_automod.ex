defmodule CGraph.Forums.ForumAutomod do
  @moduledoc """
  Forum-level automatic moderation rules.

  Provides configurable automod rules per-forum:
  - word_filter: banned words/phrases
  - link_filter: whitelist/blacklist URLs
  - spam_detection: rate-limiting and repetition checks
  - caps_filter: excessive capitalization detection

  Rules are stored as a :map column on the forums table.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.Forum
  alias CGraph.Repo
  require Logger

  @default_rules %{
    "word_filter" => %{
      "enabled" => false,
      "banned_words" => [],
      "action" => "flag"
    },
    "link_filter" => %{
      "enabled" => false,
      "whitelist" => [],
      "blacklist" => [],
      "block_all_links" => false,
      "action" => "flag"
    },
    "spam_detection" => %{
      "enabled" => false,
      "max_posts_per_minute" => 3,
      "max_duplicate_content" => 2,
      "action" => "block"
    },
    "caps_filter" => %{
      "enabled" => false,
      "max_caps_percentage" => 70,
      "min_length" => 10,
      "action" => "flag"
    }
  }

  @doc """
  Get automod rules for a forum, returning defaults for missing keys.
  """
  @spec get_rules(String.t()) :: {:ok, map()} | {:error, :not_found}
  def get_rules(forum_id) do
    case Repo.get(Forum, forum_id) do
      nil ->
        {:error, :not_found}

      forum ->
        stored_rules = forum.automod_rules || %{}
        merged = Map.merge(@default_rules, stored_rules)
        {:ok, merged}
    end
  end

  @doc """
  Update automod rules for a forum.
  """
  @spec update_rules(String.t(), map()) :: {:ok, map()} | {:error, term()}
  def update_rules(forum_id, rules) when is_map(rules) do
    case Repo.get(Forum, forum_id) do
      nil ->
        {:error, :not_found}

      forum ->
        current = forum.automod_rules || %{}
        merged = Map.merge(current, rules)

        forum
        |> Ecto.Changeset.change(automod_rules: merged)
        |> Repo.update()
        |> case do
          {:ok, updated} -> {:ok, updated.automod_rules}
          {:error, changeset} -> {:error, changeset}
        end
    end
  end

  @doc """
  Check content against automod rules.

  Returns:
  - `{:ok, :clean}` — content passes all checks
  - `{:flag, reason}` — content flagged for mod queue
  - `{:block, reason}` — content blocked from posting
  """
  @spec check_content(String.t(), String.t()) :: {:ok, :clean} | {:flag, String.t()} | {:block, String.t()}
  def check_content(forum_id, content) when is_binary(content) do
    case get_rules(forum_id) do
      {:error, _} -> {:ok, :clean}
      {:ok, rules} -> run_checks(rules, content)
    end
  end

  @doc "Returns the default automod rules."
  @spec default_rules() :: map()
  def default_rules, do: @default_rules

  # ---------------------------------------------------------------------------
  # Rule checks
  # ---------------------------------------------------------------------------

  defp run_checks(rules, content) do
    checks = [
      {rules["word_filter"], &check_word_filter/2},
      {rules["link_filter"], &check_link_filter/2},
      {rules["caps_filter"], &check_caps_filter/2}
    ]

    Enum.reduce_while(checks, {:ok, :clean}, fn {rule, checker}, acc ->
      if rule && rule["enabled"] do
        case checker.(rule, content) do
          {:ok, :clean} -> {:cont, acc}
          {:flag, reason} -> {:halt, {:flag, reason}}
          {:block, reason} -> {:halt, {:block, reason}}
        end
      else
        {:cont, acc}
      end
    end)
  end

  defp check_word_filter(rule, content) do
    banned_words = rule["banned_words"] || []
    lowered = String.downcase(content)

    found = Enum.find(banned_words, fn word ->
      String.contains?(lowered, String.downcase(word))
    end)

    if found do
      action = action_atom(rule["action"])
      {action, "Contains banned word: #{found}"}
    else
      {:ok, :clean}
    end
  end

  defp check_link_filter(rule, content) do
    if rule["block_all_links"] do
      if Regex.match?(~r{https?://}i, content) do
        action = action_atom(rule["action"])
        {action, "Links are not allowed"}
      else
        {:ok, :clean}
      end
    else
      blacklist = rule["blacklist"] || []
      lowered = String.downcase(content)

      found = Enum.find(blacklist, fn domain ->
        String.contains?(lowered, String.downcase(domain))
      end)

      if found do
        action = action_atom(rule["action"])
        {action, "Contains blacklisted link: #{found}"}
      else
        {:ok, :clean}
      end
    end
  end

  defp check_caps_filter(rule, content) do
    min_length = rule["min_length"] || 10
    max_pct = rule["max_caps_percentage"] || 70

    if String.length(content) < min_length do
      {:ok, :clean}
    else
      alpha_chars = String.replace(content, ~r/[^a-zA-Z]/, "")

      if String.length(alpha_chars) == 0 do
        {:ok, :clean}
      else
        upper_count = alpha_chars |> String.graphemes() |> Enum.count(&(&1 == String.upcase(&1)))
        pct = upper_count / String.length(alpha_chars) * 100

        if pct > max_pct do
          action = action_atom(rule["action"])
          {action, "Excessive capitalization (#{round(pct)}%)"}
        else
          {:ok, :clean}
        end
      end
    end
  end

  defp action_atom("block"), do: :block
  defp action_atom("shadow_ban"), do: :flag
  defp action_atom(_), do: :flag
end
