defmodule CGraph.Forums.BBCodeTest do
  use ExUnit.Case, async: true

  alias CGraph.Forums.BBCode

  describe "to_html/1" do
    test "returns empty string for nil" do
      assert BBCode.to_html(nil) == ""
    end

    test "escapes HTML entities before processing" do
      assert BBCode.to_html("<script>alert('xss')</script>") =~
               "&lt;script&gt;"
    end

    test "converts newlines to <br>" do
      assert BBCode.to_html("line1\nline2") == "line1<br>line2"
    end
  end

  describe "simple formatting tags" do
    test "[b] bold" do
      assert BBCode.to_html("[b]text[/b]") == "<strong>text</strong>"
    end

    test "[i] italic" do
      assert BBCode.to_html("[i]text[/i]") == "<em>text</em>"
    end

    test "[u] underline" do
      assert BBCode.to_html("[u]text[/u]") == "<u>text</u>"
    end

    test "[s] strikethrough" do
      assert BBCode.to_html("[s]text[/s]") == "<s>text</s>"
    end

    test "nested tags" do
      result = BBCode.to_html("[b][i]bold italic[/i][/b]")
      assert result == "<strong><em>bold italic</em></strong>"
    end
  end

  describe "[url] tag" do
    test "bare url" do
      result = BBCode.to_html("[url]https://example.com[/url]")
      assert result =~ ~s(href="https://example.com")
      assert result =~ "rel=\"nofollow noopener\""
    end

    test "url with label" do
      result = BBCode.to_html("[url=https://example.com]Click here[/url]")
      assert result =~ ~s(href="https://example.com")
      assert result =~ "Click here</a>"
    end

    test "rejects javascript: URLs" do
      result = BBCode.to_html("[url=javascript:alert(1)]click[/url]")
      refute result =~ "<a"
      refute result =~ "javascript:"
    end

    test "rejects data: URLs" do
      result = BBCode.to_html("[url=data:text/html,<script>]click[/url]")
      refute result =~ "<a"
    end

    test "allows mailto: URLs" do
      result = BBCode.to_html("[url=mailto:user@example.com]email[/url]")
      assert result =~ "mailto:user@example.com"
    end
  end

  describe "[img] tag" do
    test "renders image with safe URL" do
      result = BBCode.to_html("[img]https://example.com/photo.jpg[/img]")
      assert result =~ "<img"
      assert result =~ ~s(src="https://example.com/photo.jpg")
      assert result =~ "loading=\"lazy\""
    end

    test "rejects javascript: in img src" do
      result = BBCode.to_html("[img]javascript:alert(1)[/img]")
      refute result =~ "<img"
    end
  end

  describe "[quote] tag" do
    test "plain quote" do
      result = BBCode.to_html("[quote]Some text[/quote]")
      assert result == "<blockquote>Some text</blockquote>"
    end

    test "quote with author" do
      result = BBCode.to_html("[quote=JohnDoe]Some text[/quote]")
      assert result =~ "<blockquote>"
      assert result =~ "JohnDoe wrote:"
      assert result =~ "Some text"
    end
  end

  describe "[code] tag" do
    test "renders code block" do
      result = BBCode.to_html("[code]def foo; end[/code]")
      assert result =~ "<pre><code>"
      assert result =~ "def foo; end"
    end

    test "does not convert newlines inside code" do
      result = BBCode.to_html("[code]line1\nline2[/code]")
      assert result =~ "line1\nline2"
      refute result =~ "line1<br>line2"
    end
  end

  describe "[list] tag" do
    test "renders unordered list" do
      input = "[list][*]Item 1[*]Item 2[*]Item 3[/list]"
      result = BBCode.to_html(input)
      assert result =~ "<ul>"
      assert result =~ "<li>Item 1</li>"
      assert result =~ "<li>Item 2</li>"
      assert result =~ "<li>Item 3</li>"
      assert result =~ "</ul>"
    end
  end

  describe "[color] tag" do
    test "valid CSS color name" do
      result = BBCode.to_html("[color=red]text[/color]")
      assert result =~ "color:red"
      assert result =~ "<span"
    end

    test "valid hex color" do
      result = BBCode.to_html("[color=#ff0000]text[/color]")
      assert result =~ "color:#ff0000"
    end

    test "rejects invalid color value" do
      result = BBCode.to_html("[color=expression(alert())]text[/color]")
      refute result =~ "<span"
    end
  end

  describe "[size] tag" do
    test "maps size 1-7 to em values" do
      result = BBCode.to_html("[size=1]tiny[/size]")
      assert result =~ "font-size:0.6em"

      result = BBCode.to_html("[size=7]huge[/size]")
      assert result =~ "font-size:2em"
    end

    test "clamps oversized value to 7" do
      result = BBCode.to_html("[size=99]big[/size]")
      assert result =~ "font-size:2em"
    end
  end

  describe "[center] tag" do
    test "renders centered text" do
      result = BBCode.to_html("[center]centered[/center]")
      assert result =~ "text-align:center"
    end
  end

  describe "[spoiler] tag" do
    test "renders spoiler with details/summary" do
      result = BBCode.to_html("[spoiler]hidden[/spoiler]")
      assert result =~ "<details>"
      assert result =~ "<summary>Spoiler</summary>"
      assert result =~ "hidden"
    end
  end

  describe "XSS prevention" do
    test "script tag injection" do
      result = BBCode.to_html("<script>alert('xss')</script>")
      refute result =~ "<script>"
      assert result =~ "&lt;script&gt;"
    end

    test "event handler injection in bbcode" do
      result = BBCode.to_html("[url=https://x.com\" onmouseover=\"alert(1)]click[/url]")
      refute result =~ "onmouseover"
    end

    test "nested XSS in img" do
      result = BBCode.to_html("[img]https://x.com/a.jpg\" onerror=\"alert(1)[/img]")
      # Quotes are escaped in attributes
      refute result =~ "onerror"
    end

    test "javascript: protocol is blocked" do
      assert BBCode.safe_url?("javascript:alert(1)") == false
      assert BBCode.safe_url?("JAVASCRIPT:alert(1)") == false
      assert BBCode.safe_url?("data:text/html,<script>") == false
    end

    test "valid protocols are allowed" do
      assert BBCode.safe_url?("http://example.com") == true
      assert BBCode.safe_url?("https://example.com") == true
      assert BBCode.safe_url?("mailto:user@example.com") == true
    end
  end

  describe "edge cases" do
    test "unclosed tags left as text" do
      result = BBCode.to_html("[b]no closing tag")
      assert result == "[b]no closing tag"
    end

    test "empty input" do
      assert BBCode.to_html("") == ""
    end

    test "plain text without tags" do
      assert BBCode.to_html("Hello world") == "Hello world"
    end

    test "case-insensitive tags" do
      assert BBCode.to_html("[B]bold[/B]") == "<strong>bold</strong>"
    end
  end
end
