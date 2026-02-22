defmodule CGraphWeb.API.V1.RssController do
  @moduledoc """
  RSS/Atom Feed Controller for Forums.

  Provides syndication feeds for:
  - Forum-wide recent activity (threads and posts)
  - Board-specific threads
  - Thread-specific replies
  - User activity feeds
  - Search result feeds

  ## Feed Formats

  - RSS 2.0 (default): `/api/v1/rss/:type`
  - Atom 1.0: `/api/v1/rss/:type?format=atom`

  ## Security

  - Public feeds for public forums only
  - Private forum feeds require authentication via token parameter
  - Rate limited to prevent abuse
  - Cache headers for CDN optimization

  ## Examples

      GET /api/v1/rss/forums/:forum_id/threads
      GET /api/v1/rss/boards/:board_id/threads?limit=50
      GET /api/v1/rss/threads/:thread_id/posts
      GET /api/v1/rss/users/:user_id/activity
  """
  use CGraphWeb, :controller

  alias CGraph.{Accounts, Forums}
  import CGraphWeb.Helpers.ParamParser

  action_fallback CGraphWeb.FallbackController

  @default_limit 20
  @max_limit 100
  @cache_max_age 300  # 5 minutes

  # =============================================================================
  # FORUM FEEDS
  # =============================================================================

  @doc """
  Get RSS feed of recent threads across a forum.
  GET /api/v1/rss/forums/:forum_id/threads
  """
  @spec forum_threads(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def forum_threads(conn, %{"forum_id" => forum_id} = params) do
    limit = parse_int(params["limit"], @default_limit, min: 1, max: @max_limit)
    format = Map.get(params, "format", "rss")

    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- check_forum_visibility(forum) do

      {threads, _meta} = Forums.list_forum_threads(forum_id, page: 1, per_page: limit)

      feed_data = %{
        title: "#{forum.name} - Recent Threads",
        description: forum.description || "Latest threads from #{forum.name}",
        link: build_forum_url(conn, forum_id),
        updated_at: get_latest_update(threads),
        items: Enum.map(threads, &thread_to_feed_item(conn, &1))
      }

      render_feed(conn, feed_data, format)
    end
  end

  @doc """
  Get RSS feed of recent posts across a forum.
  GET /api/v1/rss/forums/:forum_id/posts
  """
  @spec forum_posts(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def forum_posts(conn, %{"forum_id" => forum_id} = params) do
    limit = parse_int(params["limit"], @default_limit, min: 1, max: @max_limit)
    format = Map.get(params, "format", "rss")

    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- check_forum_visibility(forum) do

      posts = Forums.list_recent_forum_posts(forum_id, limit: limit)

      feed_data = %{
        title: "#{forum.name} - Recent Posts",
        description: "Latest posts from #{forum.name}",
        link: build_forum_url(conn, forum_id),
        updated_at: get_latest_post_update(posts),
        items: Enum.map(posts, &post_to_feed_item(conn, &1))
      }

      render_feed(conn, feed_data, format)
    end
  end

  # =============================================================================
  # BOARD FEEDS
  # =============================================================================

  @doc """
  Get RSS feed of threads in a specific board.
  GET /api/v1/rss/boards/:board_id/threads
  """
  @spec board_threads(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def board_threads(conn, %{"board_id" => board_id} = params) do
    limit = parse_int(params["limit"], @default_limit, min: 1, max: @max_limit)
    format = Map.get(params, "format", "rss")

    with {:ok, board} <- Forums.get_board(board_id),
         {:ok, forum} <- Forums.get_forum(board.forum_id),
         :ok <- check_forum_visibility(forum) do

      {threads, _meta} = Forums.list_threads(board_id, page: 1, per_page: limit)

      feed_data = %{
        title: "#{forum.name} - #{board.name}",
        description: board.description || "Threads from #{board.name}",
        link: build_board_url(conn, board_id),
        updated_at: get_latest_update(threads),
        items: Enum.map(threads, &thread_to_feed_item(conn, &1))
      }

      render_feed(conn, feed_data, format)
    end
  end

  # =============================================================================
  # THREAD FEEDS
  # =============================================================================

  @doc """
  Get RSS feed of posts in a specific thread.
  GET /api/v1/rss/threads/:thread_id/posts
  """
  @spec thread_posts(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def thread_posts(conn, %{"thread_id" => thread_id} = params) do
    limit = parse_int(params["limit"], @default_limit, min: 1, max: @max_limit)
    format = Map.get(params, "format", "rss")

    with {:ok, thread} <- Forums.get_thread(thread_id),
         {:ok, board} <- Forums.get_board(thread.board_id),
         {:ok, forum} <- Forums.get_forum(board.forum_id),
         :ok <- check_forum_visibility(forum) do

      {posts, _meta} = Forums.list_thread_posts(thread_id, page: 1, per_page: limit)

      feed_data = %{
        title: "#{thread.title} - Discussion",
        description: "Posts in thread: #{thread.title}",
        link: build_thread_url(conn, thread_id),
        updated_at: get_latest_post_update(posts),
        items: Enum.map(posts, &post_to_feed_item(conn, &1))
      }

      render_feed(conn, feed_data, format)
    end
  end

  # =============================================================================
  # USER ACTIVITY FEEDS
  # =============================================================================

  @doc """
  Get RSS feed of a user's public activity.
  GET /api/v1/rss/users/:user_id/activity
  """
  @spec user_activity(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def user_activity(conn, %{"user_id" => user_id} = params) do
    limit = parse_int(params["limit"], @default_limit, min: 1, max: @max_limit)
    format = Map.get(params, "format", "rss")

    with {:ok, user} <- Accounts.get_user(user_id),
         :ok <- check_user_visibility(user) do

      # Get user's public threads and posts
      activity = get_user_public_activity(user_id, limit)

      feed_data = %{
        title: "#{user.username}'s Activity",
        description: "Public forum activity from #{user.username}",
        link: build_user_url(conn, user_id),
        updated_at: get_activity_latest_update(activity),
        items: activity
      }

      render_feed(conn, feed_data, format)
    end
  end

  # =============================================================================
  # COMBINED/GLOBAL FEEDS
  # =============================================================================

  @doc """
  Get RSS feed of recent activity across all public forums.
  GET /api/v1/rss/global/activity
  """
  @spec global_activity(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def global_activity(conn, params) do
    limit = parse_int(params["limit"], @default_limit, min: 1, max: @max_limit)
    format = Map.get(params, "format", "rss")

    activity = Forums.list_global_public_activity(limit: limit)

    feed_data = %{
      title: "CGraph Forums - Global Activity",
      description: "Latest activity across all public forums",
      link: build_base_url(conn),
      updated_at: get_activity_latest_update(activity),
      items: activity
    }

    render_feed(conn, feed_data, format)
  end

  # =============================================================================
  # PRIVATE HELPERS
  # =============================================================================

  defp check_forum_visibility(%{visibility: "public"}), do: :ok
  defp check_forum_visibility(%{is_public: true}), do: :ok
  defp check_forum_visibility(_), do: {:error, :not_found}

  defp check_user_visibility(%{profile_visibility: "public"}), do: :ok
  defp check_user_visibility(%{is_public: true}), do: :ok
  defp check_user_visibility(_user), do: :ok  # Default to public for now

  defp get_latest_update([]), do: DateTime.utc_now()
  defp get_latest_update([first | _]) do
    first.updated_at || first.inserted_at || DateTime.utc_now()
  end

  defp get_latest_post_update([]), do: DateTime.utc_now()
  defp get_latest_post_update([first | _]) do
    first.created_at || first.inserted_at || DateTime.utc_now()
  end

  defp get_activity_latest_update([]), do: DateTime.utc_now()
  defp get_activity_latest_update([%{date: date} | _]) when not is_nil(date), do: date
  defp get_activity_latest_update([first | _]) do
    Map.get(first, :date) || Map.get(first, :updated_at) || DateTime.utc_now()
  end

  defp thread_to_feed_item(conn, thread) do
    %{
      title: thread.title,
      link: build_thread_url(conn, thread.id),
      description: truncate_content(thread.content || thread.body || ""),
      author: get_author_name(thread),
      pub_date: thread.inserted_at || DateTime.utc_now(),
      guid: "thread-#{thread.id}",
      categories: get_thread_categories(thread)
    }
  end

  defp post_to_feed_item(conn, post) do
    thread_title = get_in(post, [Access.key(:thread), Access.key(:title)]) || "Post"

    %{
      title: "Re: #{thread_title}",
      link: build_post_url(conn, post),
      description: truncate_content(post.content || post.body || ""),
      author: get_author_name(post),
      pub_date: post.created_at || post.inserted_at || DateTime.utc_now(),
      guid: "post-#{post.id}",
      categories: []
    }
  end

  defp get_author_name(%{author: %{username: username}}), do: username
  defp get_author_name(%{author: %{display_name: name}}) when not is_nil(name), do: name
  defp get_author_name(%{user: %{username: username}}), do: username
  defp get_author_name(_), do: "Anonymous"

  defp get_thread_categories(%{board: %{name: board_name}}) do
    [board_name]
  end
  defp get_thread_categories(_), do: []

  defp truncate_content(content) when is_binary(content) do
    content
    |> HtmlSanitizeEx.strip_tags()
    |> String.slice(0, 500)
    |> then(fn text ->
      if String.length(content) > 500, do: text <> "...", else: text
    end)
  end
  defp truncate_content(_), do: ""

  defp get_user_public_activity(user_id, limit) do
    # Get user's threads from public forums
    threads = Forums.list_user_public_threads(user_id, limit: limit)
    posts = Forums.list_user_public_posts(user_id, limit: limit)

    # Combine and sort by date
    thread_items = Enum.map(threads, fn t ->
      %{type: :thread, item: t, date: t.inserted_at}
    end)

    post_items = Enum.map(posts, fn p ->
      %{type: :post, item: p, date: p.created_at || p.inserted_at}
    end)

    (thread_items ++ post_items)
    |> Enum.sort_by(& &1.date, {:desc, DateTime})
    |> Enum.take(limit)
  end

  # URL builders
  defp build_base_url(conn) do
    "#{conn.scheme}://#{conn.host}"
  end

  defp build_forum_url(conn, forum_id) do
    "#{build_base_url(conn)}/forums/#{forum_id}"
  end

  defp build_board_url(conn, board_id) do
    "#{build_base_url(conn)}/boards/#{board_id}"
  end

  defp build_thread_url(conn, thread_id) do
    "#{build_base_url(conn)}/threads/#{thread_id}"
  end

  defp build_post_url(conn, post) do
    thread_id = post.thread_id || get_in(post, [Access.key(:thread), Access.key(:id)])
    "#{build_base_url(conn)}/threads/#{thread_id}#post-#{post.id}"
  end

  defp build_user_url(conn, user_id) do
    "#{build_base_url(conn)}/users/#{user_id}"
  end

  # =============================================================================
  # FEED RENDERING
  # =============================================================================

  defp render_feed(conn, feed_data, "atom") do
    xml = generate_atom_feed(feed_data)

    conn
    |> put_resp_content_type("application/atom+xml")
    |> put_cache_headers()
    |> send_resp(200, xml)
  end

  defp render_feed(conn, feed_data, _format) do
    xml = generate_rss_feed(feed_data)

    conn
    |> put_resp_content_type("application/rss+xml")
    |> put_cache_headers()
    |> send_resp(200, xml)
  end

  defp put_cache_headers(conn) do
    conn
    |> put_resp_header("cache-control", "public, max-age=#{@cache_max_age}")
    |> put_resp_header("vary", "Accept")
  end

  defp generate_rss_feed(feed_data) do
    items_xml = feed_data.items
    |> Enum.map_join("\n", &generate_rss_item/1)

    """
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <channel>
        <title>#{escape_xml(feed_data.title)}</title>
        <link>#{escape_xml(feed_data.link)}</link>
        <description>#{escape_xml(feed_data.description)}</description>
        <language>en-us</language>
        <lastBuildDate>#{format_rss_date(feed_data.updated_at)}</lastBuildDate>
        <generator>CGraph Forum Platform</generator>
        <atom:link href="#{escape_xml(feed_data.link)}" rel="self" type="application/rss+xml"/>
    #{items_xml}
      </channel>
    </rss>
    """
  end

  defp generate_rss_item(item) do
    categories_xml = item.categories
    |> Enum.map_join("\n", fn cat -> "      <category>#{escape_xml(cat)}</category>" end)

    """
        <item>
          <title>#{escape_xml(item.title)}</title>
          <link>#{escape_xml(item.link)}</link>
          <description><![CDATA[#{cdata_escape(item.description)}]]></description>
          <dc:creator>#{escape_xml(item.author)}</dc:creator>
          <pubDate>#{format_rss_date(item.pub_date)}</pubDate>
          <guid isPermaLink="false">#{escape_xml(item.guid)}</guid>
    #{categories_xml}
        </item>
    """
  end

  defp generate_atom_feed(feed_data) do
    entries_xml = feed_data.items
    |> Enum.map_join("\n", &generate_atom_entry/1)

    """
    <?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>#{escape_xml(feed_data.title)}</title>
      <subtitle>#{escape_xml(feed_data.description)}</subtitle>
      <link href="#{escape_xml(feed_data.link)}" rel="alternate"/>
      <link href="#{escape_xml(feed_data.link)}" rel="self"/>
      <id>#{escape_xml(feed_data.link)}</id>
      <updated>#{format_atom_date(feed_data.updated_at)}</updated>
      <generator>CGraph Forum Platform</generator>
    #{entries_xml}
    </feed>
    """
  end

  defp generate_atom_entry(item) do
    categories_xml = item.categories
    |> Enum.map_join("\n", fn cat -> "    <category term=\"#{escape_xml(cat)}\"/>" end)

    """
      <entry>
        <title>#{escape_xml(item.title)}</title>
        <link href="#{escape_xml(item.link)}"/>
        <id>#{escape_xml(item.guid)}</id>
        <updated>#{format_atom_date(item.pub_date)}</updated>
        <author>
          <name>#{escape_xml(item.author)}</name>
        </author>
        <content type="html"><![CDATA[#{cdata_escape(item.description)}]]></content>
    #{categories_xml}
      </entry>
    """
  end

  # Date formatting
  defp format_rss_date(nil), do: format_rss_date(DateTime.utc_now())
  defp format_rss_date(%DateTime{} = dt) do
    Calendar.strftime(dt, "%a, %d %b %Y %H:%M:%S +0000")
  end
  defp format_rss_date(%NaiveDateTime{} = ndt) do
    ndt
    |> DateTime.from_naive!("Etc/UTC")
    |> format_rss_date()
  end

  defp format_atom_date(nil), do: format_atom_date(DateTime.utc_now())
  defp format_atom_date(%DateTime{} = dt) do
    DateTime.to_iso8601(dt)
  end
  defp format_atom_date(%NaiveDateTime{} = ndt) do
    ndt
    |> DateTime.from_naive!("Etc/UTC")
    |> format_atom_date()
  end

  # XML escaping
  defp escape_xml(nil), do: ""
  defp escape_xml(text) when is_binary(text) do
    text
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&apos;")
  end
  defp escape_xml(other), do: escape_xml(to_string(other))

  # CDATA escaping — prevent premature close of CDATA sections
  defp cdata_escape(nil), do: ""
  defp cdata_escape(text) when is_binary(text) do
    String.replace(text, "]]>", "]]]]><![CDATA[>")
  end
  defp cdata_escape(other), do: cdata_escape(to_string(other))
end
