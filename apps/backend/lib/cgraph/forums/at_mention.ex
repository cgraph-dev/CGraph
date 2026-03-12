defmodule CGraph.Forums.AtMention do
  @moduledoc """
  @mention parsing and resolution for forum posts.

  Extracts `@username` tokens from post content, resolves them to user IDs,
  and creates notifications for mentioned users.
  """

  alias CGraph.Accounts.Users
  alias CGraph.Notifications

  @mention_regex ~r/@([A-Za-z0-9_]{1,40})\b/

  # ── Public API ───────────────────────────────────────────────────────

  @doc """
  Parse `@username` mentions from content text.

  Returns a list of unique username strings (without the `@` prefix).

  ## Examples

      iex> AtMention.parse("Hey @alice and @bob!")
      ["alice", "bob"]
  """
  @spec parse(String.t()) :: [String.t()]
  def parse(content) when is_binary(content) do
    @mention_regex
    |> Regex.scan(content)
    |> Enum.map(fn [_full, username] -> username end)
    |> Enum.uniq()
  end

  def parse(_), do: []

  @doc """
  Resolve a list of usernames to user IDs.

  Looks up each username and returns a list of `{username, user_id}` tuples
  for users that exist. Unknown usernames are silently dropped.
  """
  @spec resolve_mentions([String.t()]) :: [{String.t(), String.t()}]
  def resolve_mentions(usernames) when is_list(usernames) do
    usernames
    |> Enum.reduce([], fn username, acc ->
      case Users.get_user_by_username(username) do
        nil -> acc
        user -> [{username, user.id} | acc]
      end
    end)
    |> Enum.reverse()
  end

  @doc """
  Create a notification for each mentioned user.

  ## Parameters
  - `mentioned` — list of `{username, user_id}` tuples from `resolve_mentions/1`
  - `context` — map with `:author_id`, `:post_id` or `:thread_id`, and `:content_preview`
  """
  @spec notify_mentioned([{String.t(), String.t()}], map()) :: :ok
  def notify_mentioned(mentioned, context) when is_list(mentioned) do
    author_id = Map.get(context, :author_id)

    Enum.each(mentioned, fn {_username, user_id} ->
      # Don't notify yourself
      if user_id != author_id do
        Notifications.send(user_id, :mention, %{
          author_id: author_id,
          post_id: Map.get(context, :post_id),
          thread_id: Map.get(context, :thread_id),
          preview: Map.get(context, :content_preview, "")
        })
      end
    end)
  end

  @doc """
  Convenience: parse, resolve, and notify in one call.

  Returns the list of resolved `{username, user_id}` tuples.
  """
  @spec process_mentions(String.t(), map()) :: [{String.t(), String.t()}]
  def process_mentions(content, context) do
    mentioned =
      content
      |> parse()
      |> resolve_mentions()

    notify_mentioned(mentioned, context)
    mentioned
  end
end
