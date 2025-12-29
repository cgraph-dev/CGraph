defmodule CgraphWeb.API.V1.ReactionJSON do
  @moduledoc """
  JSON rendering for reaction responses.
  """

  alias CgraphWeb.API.V1.UserJSON

  def index(%{reactions: reactions}) do
    %{data: group_reactions(reactions)}
  end

  def show(%{reaction: reaction}) do
    %{data: reaction_data(reaction)}
  end

  def users(%{users: users, emoji: emoji}) do
    %{
      data: %{
        emoji: emoji,
        count: length(users),
        users: Enum.map(users, &UserJSON.user_data/1)
      }
    }
  end

  @doc """
  Group reactions by emoji with count and sample users.
  """
  def group_reactions(reactions) do
    reactions
    |> Enum.group_by(& &1.emoji)
    |> Enum.map(fn {emoji, group} ->
      %{
        emoji: emoji,
        count: length(group),
        me: Enum.any?(group, & &1.is_me),
        users: group
          |> Enum.take(3)
          |> Enum.map(fn r -> UserJSON.user_data(r.user) end)
      }
    end)
  end

  @doc """
  Render individual reaction data.
  """
  def reaction_data(reaction) do
    %{
      id: reaction.id,
      emoji: reaction.emoji,
      message_id: reaction.message_id,
      user_id: reaction.user_id,
      user: render_user(reaction.user),
      created_at: reaction.inserted_at
    }
  end

  defp render_user(nil), do: nil
  defp render_user(user), do: UserJSON.user_data(user)
end
