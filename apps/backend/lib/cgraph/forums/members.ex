defmodule CGraph.Forums.Members do
  @moduledoc """
  Forum membership operations.
  
  Handles members, subscriptions, roles, and bans.
  """
  
  import Ecto.Query, warn: false
  
  alias CGraph.Repo
  alias CGraph.Forums.{Forum, ForumMember, Subscription, Moderator, Ban}
  
  @doc """
  Lists members of a forum.
  """
  def list_members(forum_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    role = Keyword.get(opts, :role)
    search = Keyword.get(opts, :search)
    
    base_query = from(m in ForumMember,
      where: m.forum_id == ^forum_id,
      preload: [:user]
    )
    
    query = base_query
    |> maybe_filter_by_role(role)
    |> maybe_search(search)
    |> order_by([m], desc: m.joined_at)
    
    total = Repo.aggregate(query, :count, :id)
    
    members = query
    |> limit(^per_page)
    |> offset(^((page - 1) * per_page))
    |> Repo.all()
    
    meta = %{page: page, per_page: per_page, total: total}
    {members, meta}
  end
  
  @doc """
  Gets a forum member.
  """
  def get_member(forum_id, user_id) do
    Repo.get_by(ForumMember, forum_id: forum_id, user_id: user_id)
  end
  
  @doc """
  Gets or creates a forum member.
  """
  def get_or_create_member(forum_id, user_id) do
    case get_member(forum_id, user_id) do
      nil ->
        %ForumMember{}
        |> ForumMember.changeset(%{
          forum_id: forum_id,
          user_id: user_id,
          role: "member",
          joined_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })
        |> Repo.insert()
      
      member -> {:ok, member}
    end
  end
  
  @doc """
  Checks if a user is a member of a forum.
  """
  def member?(forum_id, user_id) do
    Repo.exists?(
      from(m in ForumMember,
        where: m.forum_id == ^forum_id and m.user_id == ^user_id
      )
    )
  end
  
  @doc """
  Updates a member's role.
  """
  def update_role(forum_id, user_id, role) when role in ["member", "moderator", "admin"] do
    case get_member(forum_id, user_id) do
      nil -> {:error, :not_found}
      member ->
        member
        |> Ecto.Changeset.change(%{role: role})
        |> Repo.update()
    end
  end
  
  @doc """
  Checks if a user is a moderator of a forum.
  """
  def moderator?(forum, user) do
    forum.owner_id == user.id || in_moderators?(forum, user)
  end
  
  defp in_moderators?(forum, user) do
    case forum.moderators do
      %Ecto.Association.NotLoaded{} ->
        Repo.exists?(
          from(m in Moderator,
            where: m.forum_id == ^forum.id and m.user_id == ^user.id
          )
        )
      moderators when is_list(moderators) ->
        Enum.any?(moderators, fn mod -> mod.user_id == user.id end)
    end
  end
  
  @doc """
  Adds a moderator to a forum.
  """
  def add_moderator(forum, user, opts \\ []) do
    permissions = Keyword.get(opts, :permissions, [])
    added_by_id = Keyword.get(opts, :added_by_id)
    notes = Keyword.get(opts, :notes)
    
    %Moderator{}
    |> Moderator.changeset(%{
      forum_id: forum.id,
      user_id: user.id,
      permissions: permissions,
      added_by_id: added_by_id,
      notes: notes
    })
    |> Repo.insert()
  end
  
  @doc """
  Removes a moderator from a forum.
  """
  def remove_moderator(forum, user) do
    query = from(m in Moderator,
      where: m.forum_id == ^forum.id and m.user_id == ^user.id
    )
    
    case Repo.one(query) do
      nil -> {:error, :not_found}
      moderator -> Repo.delete(moderator)
    end
  end
  
  # === Subscriptions ===
  
  @doc """
  Subscribes a user to a forum (join).
  """
  def subscribe(user, forum) do
    Repo.transaction(fn ->
      # Create subscription
      subscription_result = %Subscription{}
      |> Subscription.changeset(%{forum_id: forum.id, user_id: user.id})
      |> Repo.insert(on_conflict: :nothing, conflict_target: [:forum_id, :user_id])
      
      # Ensure membership
      member_created = ensure_membership(user.id, forum.id)
      
      # Increment count if new member
      if member_created do
        increment_member_count(forum.id)
      end
      
      case subscription_result do
        {:ok, sub} -> sub
        {:error, changeset} -> Repo.rollback(changeset)
      end
    end)
  end
  
  @doc """
  Unsubscribes a user from a forum (leave).
  """
  def unsubscribe(user, forum) do
    if forum.owner_id == user.id do
      {:error, :cannot_leave_own_forum}
    else
      Repo.transaction(fn ->
        # Delete subscription
        sub_deleted = delete_subscription(user.id, forum.id)
        
        # Delete membership
        delete_membership(user.id, forum.id)
        
        # Decrement count if subscription existed
        if sub_deleted do
          decrement_member_count(forum.id)
        end
        
        :unsubscribed
      end)
    end
  end
  
  @doc """
  Checks if a user is subscribed to a forum.
  """
  def subscribed?(user, forum) do
    Repo.exists?(
      from(s in Subscription,
        where: s.forum_id == ^forum.id and s.user_id == ^user.id
      )
    )
  end
  
  # === Bans ===
  
  @doc """
  Bans a user from a forum.
  """
  def ban_member(forum_id, user_id, reason, banned_by_id, expires_at \\ nil) do
    %Ban{}
    |> Ban.changeset(%{
      forum_id: forum_id,
      user_id: user_id,
      reason: reason,
      banned_by_id: banned_by_id,
      expires_at: expires_at
    })
    |> Repo.insert()
  end
  
  @doc """
  Unbans a user from a forum.
  """
  def unban_member(forum_id, user_id) do
    from(b in Ban,
      where: b.forum_id == ^forum_id and b.user_id == ^user_id
    )
    |> Repo.delete_all()
    :ok
  end
  
  @doc """
  Checks if a user is banned from a forum.
  """
  def banned?(forum_id, user_id) do
    now = DateTime.utc_now()
    
    Repo.exists?(
      from(b in Ban,
        where: b.forum_id == ^forum_id and b.user_id == ^user_id,
        where: is_nil(b.expires_at) or b.expires_at > ^now
      )
    )
  end
  
  # Private helpers
  
  defp maybe_filter_by_role(query, nil), do: query
  defp maybe_filter_by_role(query, role) do
    from(m in query, where: m.role == ^role)
  end
  
  defp maybe_search(query, nil), do: query
  defp maybe_search(query, search) do
    search_term = "%#{search}%"
    from(m in query,
      join: u in assoc(m, :user),
      where: ilike(u.username, ^search_term) or ilike(u.display_name, ^search_term)
    )
  end
  
  defp ensure_membership(user_id, forum_id) do
    case Repo.get_by(ForumMember, forum_id: forum_id, user_id: user_id) do
      nil ->
        %ForumMember{}
        |> ForumMember.changeset(%{
          forum_id: forum_id,
          user_id: user_id,
          joined_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })
        |> Repo.insert()
        true
      _member -> false
    end
  end
  
  defp delete_subscription(user_id, forum_id) do
    {count, _} = from(s in Subscription,
      where: s.forum_id == ^forum_id and s.user_id == ^user_id
    )
    |> Repo.delete_all()
    count > 0
  end
  
  defp delete_membership(user_id, forum_id) do
    from(m in ForumMember,
      where: m.forum_id == ^forum_id and m.user_id == ^user_id
    )
    |> Repo.delete_all()
  end
  
  defp increment_member_count(forum_id) do
    from(f in Forum, where: f.id == ^forum_id)
    |> Repo.update_all(inc: [member_count: 1])
  end
  
  defp decrement_member_count(forum_id) do
    from(f in Forum, where: f.id == ^forum_id)
    |> Repo.update_all(inc: [member_count: -1])
  end
end
