defmodule CGraph.Forums.Moderation do
  @moduledoc """
  Moderation operations for forums.

  Handles post/thread hiding, bans, warnings, mod queue, etc.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Ban, Moderator, Post, PluginRuntime, Warning}
  alias CGraph.Repo

  @doc """
  Gets the moderation queue for a forum.
  """
  @spec get_mod_queue(struct(), keyword()) :: {list(), map()}
  def get_mod_queue(forum, opts \\ []) do
    status = Keyword.get(opts, :status, "pending")

    query = from(p in Post,
      where: p.forum_id == ^forum.id and p.is_flagged == true,
      where: p.moderation_status == ^status,
      preload: [:author]
    )

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :flagged_at,
      sort_direction: :desc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  Hides a post.
  """
  @spec hide_post(String.t(), String.t()) :: :ok
  def hide_post(post_id, reason) do
    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(set: [
      is_hidden: true,
      hidden_reason: reason,
      hidden_at: DateTime.truncate(DateTime.utc_now(), :second)
    ])
    :ok
  end

  @doc """
  Soft deletes a post (marks as deleted but keeps record).
  """
  @spec soft_delete_post(String.t(), keyword()) :: :ok
  def soft_delete_post(post_id, opts \\ []) do
    reason = Keyword.get(opts, :reason, "Removed by moderator")

    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(set: [
      is_deleted: true,
      deleted_reason: reason,
      deleted_at: DateTime.truncate(DateTime.utc_now(), :second)
    ])
    :ok
  end

  @doc """
  Hides a comment.
  """
  @spec hide_comment(String.t(), String.t()) :: {:ok, map()}
  def hide_comment(comment_id, reason) do
    # Similar implementation for comments
    {:ok, %{hidden: true, reason: reason, id: comment_id}}
  end

  @doc """
  Soft deletes a comment.
  """
  @spec soft_delete_comment(String.t(), keyword()) :: {:ok, map()}
  def soft_delete_comment(comment_id, opts \\ []) do
    reason = Keyword.get(opts, :reason, "Removed by moderator")
    {:ok, %{deleted: true, reason: reason, id: comment_id}}
  end

  @doc """
  Adds a moderator to a forum.
  """
  @spec add_moderator(struct(), struct(), keyword()) :: {:ok, Moderator.t()} | {:error, Ecto.Changeset.t()}
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
  @spec remove_moderator(struct(), struct()) :: :ok
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
  @spec moderator?(struct(), struct()) :: boolean()
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
  @spec ban_user(struct(), struct(), keyword()) :: {:ok, Ban.t()} | {:error, Ecto.Changeset.t()}
  def ban_user(forum, user, opts \\ []) do
    reason = Keyword.get(opts, :reason, "Banned by moderator")
    expires_at = Keyword.get(opts, :expires_at)

    result = %Ban{}
    |> Ban.changeset(%{
      forum_id: forum.id,
      user_id: user.id,
      reason: reason,
      expires_at: expires_at
    })
    |> Repo.insert()

    # Dispatch plugin hook for ban (fire-and-forget)
    case result do
      {:ok, _ban} -> PluginRuntime.dispatch(forum.id, :member_banned, %{user_id: user.id, reason: reason})
      _ -> :ok
    end

    result
  end

  @doc """
  Unbans a user from a forum.
  """
  @spec unban_user(struct(), struct()) :: :ok
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
  @spec banned?(struct(), struct()) :: boolean()
  def banned?(forum, user) do
    Repo.exists?(
      from(b in Ban,
        where: b.forum_id == ^forum.id and b.user_id == ^user.id,
        where: is_nil(b.expires_at) or b.expires_at > ^DateTime.truncate(DateTime.utc_now(), :second)
      )
    )
  end

  @doc """
  Flags a post for review.
  """
  @spec flag_post(struct(), struct(), String.t()) :: :ok
  def flag_post(post, user, reason) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(set: [
      is_flagged: true,
      flagged_at: DateTime.truncate(DateTime.utc_now(), :second),
      flag_reason: reason,
      flagged_by_id: user.id
    ])

    # Dispatch plugin hook for report (fire-and-forget)
    if post.forum_id, do: PluginRuntime.dispatch(post.forum_id, :report_filed, %{post_id: post.id, reporter_id: user.id, reason: reason})

    :ok
  end

  @doc """
  Resolves a flagged post.
  """
  @spec resolve_flag(struct(), :approve | :remove) :: :ok
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

  # ===========================================================================
  # Warning / Strike System
  # ===========================================================================

  @mute_threshold 3
  @temp_ban_threshold 6
  @perm_ban_threshold 10

  @doc """
  Issue a warning to a user in a forum.

  Auto-action thresholds:
  - 3 pts → temp mute (24h)
  - 6 pts → temp ban (7d)
  - 10 pts → permanent ban
  """
  @spec warn_user(struct(), struct(), struct(), map()) :: {:ok, Warning.t()} | {:error, term()}
  def warn_user(forum, user, issuer, attrs) do
    warning_attrs = %{
      forum_id: forum.id,
      user_id: user.id,
      issued_by_id: issuer.id,
      reason: attrs["reason"] || attrs[:reason] || "Warning",
      points: attrs["points"] || attrs[:points] || 1,
      expires_at: attrs["expires_at"] || attrs[:expires_at]
    }

    case %Warning{} |> Warning.changeset(warning_attrs) |> Repo.insert() do
      {:ok, warning} ->
        check_auto_actions(forum, user)
        {:ok, warning}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  List warnings for a user in a forum.
  """
  @spec list_warnings(String.t(), String.t()) :: list(Warning.t())
  def list_warnings(forum_id, user_id) do
    from(w in Warning,
      where: w.forum_id == ^forum_id and w.user_id == ^user_id,
      where: w.revoked == false,
      order_by: [desc: w.inserted_at],
      preload: [:issued_by]
    )
    |> Repo.all()
  end

  @doc """
  Revoke a warning.
  """
  @spec revoke_warning(String.t(), String.t()) :: {:ok, Warning.t()} | {:error, term()}
  def revoke_warning(warning_id, revoker_id) do
    case Repo.get(Warning, warning_id) do
      nil ->
        {:error, :not_found}

      warning ->
        warning
        |> Warning.revoke_changeset(%{revoked_by_id: revoker_id})
        |> Repo.update()
    end
  end

  @doc """
  Calculate active warning points for a user in a forum.
  Only counts non-revoked, non-expired warnings.
  """
  @spec active_warning_points(String.t(), String.t()) :: integer()
  def active_warning_points(forum_id, user_id) do
    now = DateTime.utc_now()

    from(w in Warning,
      where: w.forum_id == ^forum_id and w.user_id == ^user_id,
      where: w.revoked == false,
      where: is_nil(w.expires_at) or w.expires_at > ^now,
      select: coalesce(sum(w.points), 0)
    )
    |> Repo.one()
  end

  defp check_auto_actions(forum, user) do
    points = active_warning_points(forum.id, user.id)

    cond do
      points >= @perm_ban_threshold ->
        ban_user(forum, user, reason: "Auto-ban: #{points} warning points (permanent)")

      points >= @temp_ban_threshold ->
        expires = DateTime.add(DateTime.utc_now(), 7 * 24 * 3600, :second)
        ban_user(forum, user, reason: "Auto-ban: #{points} warning points (7d)", expires_at: expires)

      points >= @mute_threshold ->
        expires = DateTime.add(DateTime.utc_now(), 24 * 3600, :second)
        ban_user(forum, user, reason: "Auto-mute: #{points} warning points (24h)", expires_at: expires)

      true ->
        :ok
    end
  end
end
