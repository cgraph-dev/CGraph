defmodule CGraph.Forums.Core.Authorization do
  @moduledoc """
  Forum authorization, moderator checks, and moderator management.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{ForumMember, Moderator}
  alias CGraph.Repo

  @owner_only_actions [:manage, :delete]
  @member_required_actions [:vote, :comment, :create_post]
  @moderator_actions [:moderate]

  @doc "Authorize an action on a forum."
  @spec authorize_action(struct() | nil, struct(), atom()) :: :ok | {:error, atom()}
  def authorize_action(nil, forum, action) do
    if action == :view && forum.is_public, do: :ok, else: {:error, :unauthorized}
  end
  def authorize_action(user, forum, action) do
    cond do
      forum.owner_id == user.id -> :ok
      action in @owner_only_actions -> {:error, :owner_only}
      true -> authorize_non_owner_action(user, forum, action)
    end
  end

  defp authorize_non_owner_action(user, forum, action) do
    is_mod = moderator?(forum, user)
    cond do
      is_mod && action in [:view, :vote, :comment, :create_post, :moderate] -> :ok
      action == :view -> authorize_view(user, forum)
      action in @member_required_actions -> authorize_member_action(user, forum)
      action in @moderator_actions -> {:error, :insufficient_permissions}
      true -> {:error, :insufficient_permissions}
    end
  end

  defp authorize_view(_user, %{is_public: true}), do: :ok
  defp authorize_view(user, forum) do
    if member?(forum.id, user.id), do: :ok, else: {:error, :not_a_member}
  end

  defp authorize_member_action(user, forum) do
    if member?(forum.id, user.id), do: :ok, else: {:error, :must_join_first}
  end

  @doc "Check if a user is a member of a forum by IDs."
  @spec member?(binary(), binary()) :: boolean()
  def member?(forum_id, user_id) do
    query = from fm in ForumMember, where: fm.forum_id == ^forum_id, where: fm.user_id == ^user_id, limit: 1
    Repo.exists?(query)
  end

  @doc "Check if user is a moderator of a forum."
  @spec moderator?(struct(), struct()) :: boolean()
  def moderator?(forum, user) do
    forum.owner_id == user.id || in_moderators?(forum, user)
  end

  defp in_moderators?(forum, user) do
    case forum.moderators do
      %Ecto.Association.NotLoaded{} ->
        query = from m in Moderator, where: m.forum_id == ^forum.id, where: m.user_id == ^user.id, limit: 1
        Repo.exists?(query)
      moderators when is_list(moderators) ->
        Enum.any?(moderators, fn mod -> mod.user_id == user.id end)
    end
  end

  @doc "Add a moderator to a forum."
  @spec add_moderator(struct(), struct(), keyword()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def add_moderator(forum, user, opts) do
    %Moderator{}
    |> Moderator.changeset(%{
      forum_id: forum.id,
      user_id: user.id,
      permissions: Keyword.get(opts, :permissions, []),
      added_by_id: Keyword.get(opts, :added_by_id),
      notes: Keyword.get(opts, :notes)
    })
    |> Repo.insert()
  end

  @doc "Remove a moderator from a forum."
  @spec remove_moderator(struct(), struct()) :: {:ok, struct()} | {:error, :not_found}
  def remove_moderator(forum, user) do
    query = from m in Moderator, where: m.forum_id == ^forum.id, where: m.user_id == ^user.id
    case Repo.one(query) do
      nil -> {:error, :not_found}
      moderator -> Repo.delete(moderator)
    end
  end
end
