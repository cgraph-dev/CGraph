defmodule CgraphWeb.API.V1.SearchJSON do
  @moduledoc """
  JSON rendering for search responses.
  """

  alias CgraphWeb.API.V1.{UserJSON, MessageJSON, PostJSON, GroupJSON}

  def index(%{results: results, query: query}) do
    %{
      data: %{
        query: query,
        users: render_users(Map.get(results, :users, [])),
        messages: render_messages(Map.get(results, :messages, [])),
        posts: render_posts(Map.get(results, :posts, [])),
        groups: render_groups(Map.get(results, :groups, []))
      }
    }
  end

  def users(%{users: users, meta: meta}) do
    %{
      data: render_users(users),
      meta: meta
    }
  end

  def messages(%{messages: messages, meta: meta}) do
    %{
      data: render_messages(messages),
      meta: meta
    }
  end

  def posts(%{posts: posts, meta: meta}) do
    %{
      data: render_posts(posts),
      meta: meta
    }
  end

  def groups(%{groups: groups, meta: meta}) do
    %{
      data: render_groups(groups),
      meta: meta
    }
  end

  def suggestions(%{suggestions: suggestions}) do
    %{data: suggestions}
  end

  def recent(%{searches: searches}) do
    %{
      data: Enum.map(searches, fn s ->
        %{
          id: s.id,
          query: s.query,
          type: s.type,
          searched_at: s.inserted_at
        }
      end)
    }
  end

  # Private helpers

  defp render_users(users) do
    Enum.map(users, fn user ->
      UserJSON.user_data(user)
      |> Map.put(:match_score, Map.get(user, :match_score))
      |> Map.put(:mutual_friends, Map.get(user, :mutual_friends_count, 0))
    end)
  end

  defp render_messages(messages) do
    Enum.map(messages, fn message ->
      MessageJSON.message_data(message)
      |> Map.put(:conversation_name, Map.get(message, :conversation_name))
      |> Map.put(:highlight, Map.get(message, :highlight))
    end)
  end

  defp render_posts(posts) do
    Enum.map(posts, fn post ->
      PostJSON.post_data(post)
      |> Map.put(:forum_name, Map.get(post, :forum_name))
      |> Map.put(:highlight, Map.get(post, :highlight))
    end)
  end

  defp render_groups(groups) do
    Enum.map(groups, fn group ->
      GroupJSON.group_data(group)
      |> Map.put(:is_member, Map.get(group, :is_member, false))
    end)
  end
end
