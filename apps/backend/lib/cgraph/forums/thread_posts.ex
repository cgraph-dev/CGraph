defmodule CGraph.Forums.ThreadPosts do
  @moduledoc """
  Thread post (reply) operations for MyBB-style forums.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete

  alias CGraph.Forums.{Board, Forum, ForumMember, Thread, ThreadPost, ThreadVote, PostVote}
  alias CGraph.Forums.SubscriptionService
  alias CGraph.Repo

  @doc """
  List posts in a thread.
  """
  def list_thread_posts(thread_id, opts \\ []) do
    query = from p in ThreadPost,
      where: p.thread_id == ^thread_id and not_deleted(p) and p.is_hidden == false,
      preload: [:author]

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :position,
      sort_direction: :asc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  Get a thread post by ID.
  """
  def get_thread_post(id) do
    case Repo.get(ThreadPost, id) do
      nil -> {:error, :not_found}
      post -> {:ok, Repo.preload(post, [:author, :thread])}
    end
  end

  @doc """
  Create a thread post (reply).
  """
  def create_thread_post(attrs \\ %{}) do
    Repo.transaction(fn ->
      thread_id = attrs[:thread_id] || attrs["thread_id"]

      # Get position for new post
      last_position = from(p in ThreadPost,
        where: p.thread_id == ^thread_id,
        select: max(p.position))
        |> Repo.one() || 0

      attrs = Map.put(attrs, :position, last_position + 1)

      result = %ThreadPost{}
        |> ThreadPost.changeset(attrs)
        |> Repo.insert()

      case result do
        {:ok, post} ->
          # Update thread stats
          now = DateTime.truncate(DateTime.utc_now(), :second)
          from(t in Thread, where: t.id == ^thread_id)
          |> Repo.update_all(
            inc: [reply_count: 1],
            set: [last_post_at: now, last_post_id: post.id, last_poster_id: post.author_id]
          )

          # Update board stats
          thread = Repo.get!(Thread, thread_id)
          from(b in Board, where: b.id == ^thread.board_id)
          |> Repo.update_all(
            inc: [post_count: 1],
            set: [last_post_at: now, last_post_id: post.id, last_thread_id: thread_id]
          )

          # Update forum stats
          board = Repo.get!(Board, thread.board_id)
          from(f in Forum, where: f.id == ^board.forum_id)
          |> Repo.update_all(inc: [post_count: 1])

          # Update member post count
          from(m in ForumMember,
            where: m.forum_id == ^board.forum_id and m.user_id == ^post.author_id)
          |> Repo.update_all(inc: [post_count: 1], set: [last_post_at: now])

          # Auto-subscribe author to the thread they replied to
          maybe_auto_subscribe(post.author_id, thread_id)

          Repo.preload(post, [:author])

        {:error, changeset} ->
          Repo.rollback(changeset)
      end
    end)
  end

  @doc """
  Update a thread post.
  """
  def update_thread_post(%ThreadPost{} = post, attrs, editor_id) do
    attrs = Map.merge(attrs, %{
      is_edited: true,
      edit_count: (post.edit_count || 0) + 1,
      edited_at: DateTime.truncate(DateTime.utc_now(), :second),
      edited_by_id: editor_id
    })

    post
    |> ThreadPost.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a thread post (soft delete).
  """
  def delete_thread_post(%ThreadPost{} = post) do
    post
    |> Ecto.Changeset.change(deleted_at: DateTime.truncate(DateTime.utc_now(), :second))
    |> Repo.update()
  end

  @doc """
  Vote on a thread.
  """
  def vote_thread(user_id, thread_id, value) when value in [1, -1] do
    case Repo.get_by(ThreadVote, user_id: user_id, thread_id: thread_id) do
      nil ->
        result = %ThreadVote{}
          |> ThreadVote.changeset(%{user_id: user_id, thread_id: thread_id, value: value})
          |> Repo.insert()

        case result do
          {:ok, vote} ->
            update_thread_score(thread_id, value)
            {:ok, vote}
          error -> error
        end

      existing_vote when existing_vote.value == value ->
        Repo.delete(existing_vote)
        update_thread_score(thread_id, -value)
        {:ok, :removed}

      existing_vote ->
        old_value = existing_vote.value
        result = existing_vote
          |> ThreadVote.changeset(%{value: value})
          |> Repo.update()

        case result do
          {:ok, vote} ->
            update_thread_score(thread_id, value - old_value)
            {:ok, vote}
          error -> error
        end
    end
  end

  @doc """
  Vote on a post by user_id and post_id.
  """
  def vote_post_by_id(user_id, post_id, value) when value in [1, -1] do
    case Repo.get_by(PostVote, user_id: user_id, post_id: post_id) do
      nil ->
        result = %PostVote{}
          |> PostVote.changeset(%{user_id: user_id, post_id: post_id, value: value})
          |> Repo.insert()

        case result do
          {:ok, vote} ->
            update_post_score(post_id, value)
            {:ok, vote}
          error -> error
        end

      existing_vote when existing_vote.value == value ->
        Repo.delete(existing_vote)
        update_post_score(post_id, -value)
        {:ok, :removed}

      existing_vote ->
        old_value = existing_vote.value
        result = existing_vote
          |> PostVote.changeset(%{value: value})
          |> Repo.update()

        case result do
          {:ok, vote} ->
            update_post_score(post_id, value - old_value)
            {:ok, vote}
          error -> error
        end
    end
  end

  # --- Private Helpers ---

  defp maybe_auto_subscribe(author_id, thread_id) do
    if get_user_auto_subscribe_preference(author_id) do
      case SubscriptionService.subscribed_to_thread?(author_id, thread_id) do
        false ->
          case SubscriptionService.subscribe_to_thread(author_id, thread_id) do
            {:ok, _subscription} -> :ok
            {:error, _reason} -> :ok
          end
        true -> :ok
      end
    end
  end

  defp get_user_auto_subscribe_preference(user_id) do
    case Repo.get(CGraph.Accounts.User, user_id) do
      nil -> true
      user ->
        case user do
          %{settings: %{"auto_subscribe_threads" => pref}} -> pref
          _ -> true
        end
    end
  end

  defp update_thread_score(thread_id, delta) do
    _thread = Repo.get!(Thread, thread_id)
    upvotes = if delta > 0, do: 1, else: 0
    downvotes = if delta < 0, do: 1, else: 0

    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(inc: [score: delta, upvotes: upvotes, downvotes: downvotes])
  end

  defp update_post_score(post_id, delta) do
    upvotes = if delta > 0, do: 1, else: 0
    downvotes = if delta < 0, do: 1, else: 0

    from(p in ThreadPost, where: p.id == ^post_id)
    |> Repo.update_all(inc: [score: delta, upvotes: upvotes, downvotes: downvotes])
  end
end
