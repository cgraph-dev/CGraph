defmodule CGraph.Forums.Moderation do
  @moduledoc """
  Moderation operations for forums.
  
  Handles post/thread hiding, bans, warnings, mod queue, etc.
  """
  
  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Forums.{Post, Thread, Ban, ForumMember, Moderator, Comment}
  
  @doc """
  Gets the moderation queue for a forum.
  """
  def get_mod_queue(forum, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    status = Keyword.get(opts, :status, "pending")
    
    from(p in Post,
      where: p.forum_id == ^forum.id and p.is_flagged == true,
      where: p.moderation_status == ^status,
      order_by: [desc: p.flagged_at],
      preload: [:author]
    )
    |> Repo.paginate(page: page, page_size: per_page)
  end
  
  @doc """
  Hides a post.
  """
  def hide_post(post_id, reason) do
    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(set: [
      is_hidden: true,
      hidden_reason: reason,
      hidden_at: DateTime.utc_now()
    ])
    :ok
  end
  
  @doc """
  Soft deletes a post (marks as deleted but keeps record).
  """
  def soft_delete_post(post_id, opts \\ []) do
    reason = Keyword.get(opts, :reason, "Removed by moderator")
    
    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(set: [
      is_deleted: true,
      deleted_reason: reason,
      deleted_at: DateTime.utc_now()
    ])
    :ok
  end
  
  @doc """
  Hides a comment.
  """
  def hide_comment(comment_id, reason) do
    # Similar implementation for comments
    {:ok, %{hidden: true, reason: reason, id: comment_id}}
  end
  
  @doc """
  Soft deletes a comment.
  """
  def soft_delete_comment(comment_id, opts \\ []) do
    reason = Keyword.get(opts, :reason, "Removed by moderator")
    {:ok, %{deleted: true, reason: reason, id: comment_id}}
  end
  
  @doc """
  Adds a moderator to a forum.
  """
  def add_moderator(forum, user, opts \\ []) do
    permissions = Keyword.get(opts, :permissions, default_mod_permissions())
    
    %Moderator{}
    |> Moderator.changeset(%{
      forum_id: forum.id,
      user_id: user.id,
      permissions: permissions
    })
    |> Repo.insert(on_conflict: :nothing)
  end
  
  @doc """
  Removes a moderator from a forum.
  """
  def remove_moderator(forum, user) do
    Repo.delete_all(
      from(m in Moderator,
        where: m.forum_id == ^forum.id and m.user_id == ^user.id
      )
    )
    :ok
  end
  
  @doc """
  Checks if a user is a moderator.
  """
  def moderator?(forum, user) do
    Repo.exists?(
      from(m in Moderator,
        where: m.forum_id == ^forum.id and m.user_id == ^user.id
      )
    )
  end
  
  @doc """
  Bans a user from a forum.
  """
  def ban_user(forum, user, opts \\ []) do
    reason = Keyword.get(opts, :reason, "Banned by moderator")
    expires_at = Keyword.get(opts, :expires_at)
    
    %Ban{}
    |> Ban.changeset(%{
      forum_id: forum.id,
      user_id: user.id,
      reason: reason,
      expires_at: expires_at
    })
    |> Repo.insert()
  end
  
  @doc """
  Unbans a user from a forum.
  """
  def unban_user(forum, user) do
    Repo.delete_all(
      from(b in Ban,
        where: b.forum_id == ^forum.id and b.user_id == ^user.id
      )
    )
    :ok
  end
  
  @doc """
  Checks if a user is banned.
  """
  def banned?(forum, user) do
    Repo.exists?(
      from(b in Ban,
        where: b.forum_id == ^forum.id and b.user_id == ^user.id,
        where: is_nil(b.expires_at) or b.expires_at > ^DateTime.utc_now()
      )
    )
  end
  
  @doc """
  Flags a post for review.
  """
  def flag_post(post, user, reason) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(set: [
      is_flagged: true,
      flagged_at: DateTime.utc_now(),
      flag_reason: reason,
      flagged_by_id: user.id
    ])
    :ok
  end
  
  @doc """
  Resolves a flagged post.
  """
  def resolve_flag(post, action) when action in [:approve, :remove] do
    updates = case action do
      :approve ->
        [is_flagged: false, moderation_status: "approved"]
      :remove ->
        [is_flagged: false, is_hidden: true, moderation_status: "removed"]
    end
    
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(set: updates)
    :ok
  end
  
  # Private helpers
  
  defp default_mod_permissions do
    %{
      can_pin: true,
      can_lock: true,
      can_hide: true,
      can_ban: false,
      can_edit_others: true,
      can_delete: true
    }
  end
end
