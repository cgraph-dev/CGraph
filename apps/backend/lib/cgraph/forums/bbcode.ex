defmodule CGraph.Forums.BBCode do
  @moduledoc """
  BBCode to HTML parser for forum content.

  Supports standard BBCode tags: [b], [i], [u], [s], [url], [img], [quote],
  [code], [list], [color], [size], [center], [spoiler].

  Security:
  - HTML-escapes all input before processing BBCode
  - Validates URL schemes (http, https, mailto only)
  - Strips javascript: and data: URIs
  - Validates color values (CSS names / hex)
  - Clamps font sizes 1-7
  """

  @css_color_names ~w(
    black silver gray white maroon red purple fuchsia
    green lime olive yellow navy blue teal aqua
    orange brown coral crimson cyan darkblue darkgreen darkred
    gold hotpink indigo ivory khaki lavender lightblue lightgreen
    magenta mint orchid peach pink plum salmon tan violet wheat
  )

  @size_map %{
    1 => "0.6em",
    2 => "0.75em",
    3 => "0.9em",
    4 => "1em",
    5 => "1.2em",
    6 => "1.5em",
    7 => "2em"
  }

  # ── Public API ──────────────────────────────────────────────────────────

  @doc """
  Convert BBCode-formatted text to safe HTML.

  Input is HTML-escaped first, then BBCode tags are processed.
  Newlines are converted to `<br>` outside of `[code]` blocks.
  Unclosed or malformed tags are left as escaped text.
  """
  @spec to_html(String.t()) :: String.t()
  def to_html(nil), do: ""

  def to_html(text) when is_binary(text) do
    text
    |> escape_html()
    |> process_code_blocks()
    |> process_tags()
    |> convert_newlines()
  end

  # ── HTML escaping ───────────────────────────────────────────────────────

  defp escape_html(text) do
    text
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&#39;")
  end

  # ── Code blocks (handled first – no inner parsing) ─────────────────────

  defp process_code_blocks(text) do
    # Temporarily replace code blocks with placeholders
    regex = ~r/\[code\](.*?)\[\/code\]/si

    {result, _} =
      Regex.scan(regex, text, return: :index)
      |> Enum.reduce({text, 0}, fn [{start, len} | _], {acc, offset} ->
        [_full, {inner_start, inner_len}] =
          Regex.run(regex, String.slice(acc, (start + offset)..String.length(acc)), return: :index)

        # Just process in-place
        {acc, offset}
      end)

    # Simpler approach: direct replacement
    Regex.replace(regex, text, fn _full, inner ->
      "<pre><code>#{inner}</code></pre>"
    end)
  end

  # ── Tag processing ─────────────────────────────────────────────────────

  defp process_tags(text) do
    text
    |> process_bold()
    |> process_italic()
    |> process_underline()
    |> process_strikethrough()
    |> process_center()
    |> process_spoiler()
    |> process_color()
    |> process_size()
    |> process_url_with_href()
    |> process_url_bare()
    |> process_img()
    |> process_quote_with_author()
    |> process_quote()
    |> process_list()
  end

  # Simple paired tags
  defp process_bold(text) do
    Regex.replace(~r/\[b\](.*?)\[\/b\]/si, text, "<strong>\\1</strong>")
  end

  defp process_italic(text) do
    Regex.replace(~r/\[i\](.*?)\[\/i\]/si, text, "<em>\\1</em>")
  end

  defp process_underline(text) do
    Regex.replace(~r/\[u\](.*?)\[\/u\]/si, text, "<u>\\1</u>")
  end

  defp process_strikethrough(text) do
    Regex.replace(~r/\[s\](.*?)\[\/s\]/si, text, "<s>\\1</s>")
  end

  defp process_center(text) do
    Regex.replace(~r/\[center\](.*?)\[\/center\]/si, text, "<div style=\"text-align:center\">\\1</div>")
  end

  defp process_spoiler(text) do
    Regex.replace(
      ~r/\[spoiler\](.*?)\[\/spoiler\]/si,
      text,
      "<details><summary>Spoiler</summary>\\1</details>"
    )
  end

  # Color – validated
  defp process_color(text) do
    Regex.replace(~r/\[color=(.*?)\](.*?)\[\/color\]/si, text, fn _full, color, inner ->
      color = unescape_attr(color)
      if valid_color?(color) do
        "<span style=\"color:#{color}\">#{inner}</span>"
      else
        "[color=#{color}]#{inner}[/color]"
      end
    end)
  end

  # Size – clamped 1-7
  defp process_size(text) do
    Regex.replace(~r/\[size=(\d+)\](.*?)\[\/size\]/si, text, fn _full, size_str, inner ->
      size = size_str |> String.to_integer() |> max(1) |> min(7)
      em = Map.fetch!(@size_map, size)
      "<span style=\"font-size:#{em}\">#{inner}</span>"
    end)
  end

  # URL with explicit href: [url=http://…]text[/url]
  defp process_url_with_href(text) do
    Regex.replace(~r/\[url=(.*?)\](.*?)\[\/url\]/si, text, fn _full, href, label ->
      href = unescape_attr(href)
      if safe_url?(href) do
        "<a href=\"#{escape_attr(href)}\" rel=\"nofollow noopener\" target=\"_blank\">#{label}</a>"
      else
        "[url=#{href}]#{label}[/url]"
      end
    end)
  end

  # Bare URL: [url]http://…[/url]
  defp process_url_bare(text) do
    Regex.replace(~r/\[url\](.*?)\[\/url\]/si, text, fn _full, href ->
      href = unescape_attr(href)
      if safe_url?(href) do
        "<a href=\"#{escape_attr(href)}\" rel=\"nofollow noopener\" target=\"_blank\">#{href}</a>"
      else
        "[url]#{href}[/url]"
      end
    end)
  end

  # Image
  defp process_img(text) do
    Regex.replace(~r/\[img\](.*?)\[\/img\]/si, text, fn _full, src ->
      src = unescape_attr(src)
      if safe_url?(src) do
        "<img src=\"#{escape_attr(src)}\" alt=\"User image\" loading=\"lazy\" />"
      else
        "[img]#{src}[/img]"
      end
    end)
  end

  # Quote with author
  defp process_quote_with_author(text) do
    Regex.replace(
      ~r/\[quote=(.*?)\](.*?)\[\/quote\]/si,
      text,
      "<blockquote><cite>\\1 wrote:</cite><br>\\2</blockquote>"
    )
  end

  # Plain quote
  defp process_quote(text) do
    Regex.replace(~r/\[quote\](.*?)\[\/quote\]/si, text, "<blockquote>\\1</blockquote>")
  end

  # List with items
  defp process_list(text) do
    Regex.replace(~r/\[list\](.*?)\[\/list\]/si, text, fn _full, inner ->
      items =
        inner
        |> String.split(~r/\[\*\]/, trim: true)
        |> Enum.map(&String.trim/1)
        |> Enum.reject(&(&1 == ""))
        |> Enum.map_join("", &"<li>#{&1}</li>")

      "<ul>#{items}</ul>"
    end)
  end

  # ── Newline conversion (skip pre/code blocks) ──────────────────────────

  defp convert_newlines(text) do
    # Split around <pre>…</pre> to avoid converting newlines inside code
    parts = Regex.split(~r/(<pre><code>.*?<\/code><\/pre>)/s, text, include_captures: true)

    Enum.map_join(parts, "", fn part ->
      if String.starts_with?(part, "<pre><code>") do
        part
      else
        String.replace(part, "\n", "<br>")
      end
    end)
  end

  # ── Validation helpers ─────────────────────────────────────────────────

  @doc false
  def safe_url?(url) do
    url = String.trim(url)
    downcased = String.downcase(url)

    cond do
      String.starts_with?(downcased, "http://") -> true
      String.starts_with?(downcased, "https://") -> true
      String.starts_with?(downcased, "mailto:") -> true
      true -> false
    end
  end

  defp valid_color?(color) do
    color = String.trim(color) |> String.downcase()
    color in @css_color_names or Regex.match?(~r/^#[0-9a-f]{3}([0-9a-f]{3})?$/, color)
  end

  # Unescape HTML entities in attribute values captured from escaped text
  defp unescape_attr(text) do
    text
    |> String.replace("&amp;", "&")
    |> String.replace("&lt;", "<")
    |> String.replace("&gt;", ">")
    |> String.replace("&quot;", "\"")
    |> String.replace("&#39;", "'")
  end

  # Re-escape for safe embedding in HTML attributes
  defp escape_attr(text) do
    text
    |> String.replace("&", "&amp;")
    |> String.replace("\"", "&quot;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
  end
end
