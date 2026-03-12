defmodule CGraph.Forums.PostCreationFlow do
  @moduledoc """
  Orchestrates post creation with identity card integration and rule enforcement.

  Responsibilities:
  - Snapshots the author's current identity card onto post metadata
  - Validates forum-level rules (minimum reputation, required badges)
  - Checks permissions via `ForumPermission.can?/4`
  """

  alias CGraph.Forums.{ForumPermission, IdentityCard}
  alias CGraph.Repo

  import Ecto.Query

  @doc """
  Creates a post with the author's identity card snapshot attached.

  Snapshots the current identity card onto the post's `user_nameplate_snapshot`
  metadata field, validates forum-level posting rules, and checks permissions.

  ## Parameters

    - `user` — the `%User{}` creating the post
    - `forum` — the `%Forum{}` where the post is being created
    - `post_attrs` — map of post attributes (content, thread_id, etc.)

  ## Returns

    - `{:ok, post_attrs_with_snapshot}` — enriched attrs ready for insertion
    - `{:error, reason}` — if validation or permission checks fail
  """
  @spec create_post_with_identity(struct(), struct(), map()) ::
          {:ok, map()} | {:error, atom() | String.t()}
  def create_post_with_identity(user, forum, post_attrs) do
    with :ok <- check_permissions(user, forum),
         :ok <- validate_forum_rules(user, forum),
         {:ok, snapshot} <- get_identity_snapshot(user) do
      enriched_attrs =
        Map.put(post_attrs, :user_nameplate_snapshot, snapshot)

      {:ok, enriched_attrs}
    end
  end

  # ---------------------------------------------------------------------------
  # Private helpers
  # ---------------------------------------------------------------------------

  defp check_permissions(user, forum) do
    case ForumPermission.can?(:can_reply, user, forum, Repo) do
      true -> :ok
      false -> {:error, :insufficient_permissions}
    end
  end

  defp validate_forum_rules(user, forum) do
    with :ok <- check_min_reputation(user, forum),
         :ok <- check_required_badges(user, forum) do
      :ok
    end
  end

  defp check_min_reputation(_user, %{settings: nil}), do: :ok

  defp check_min_reputation(user, forum) do
    min_rep = get_in_settings(forum, :min_reputation_to_post)

    if is_nil(min_rep) or min_rep <= 0 do
      :ok
    else
      card = get_identity_card(user.id)
      reputation = if card, do: card.reputation_score, else: 0

      if reputation >= min_rep do
        :ok
      else
        {:error, :insufficient_reputation}
      end
    end
  end

  defp check_required_badges(_user, %{settings: nil}), do: :ok

  defp check_required_badges(user, forum) do
    required = get_in_settings(forum, :required_badge_ids)

    if is_nil(required) or required == [] do
      :ok
    else
      card = get_identity_card(user.id)
      user_badges = if card, do: card.badge_ids || [], else: []

      missing = Enum.reject(required, &(&1 in user_badges))

      if missing == [] do
        :ok
      else
        {:error, :missing_required_badges}
      end
    end
  end

  defp get_identity_snapshot(user) do
    case get_identity_card(user.id) do
      nil ->
        # Return a default snapshot if no identity card exists
        {:ok,
         %{
           display_name: user.display_name || user.username,
           avatar_frame_id: nil,
           badge_ids: [],
           title_id: nil,
           bio_snippet: nil,
           reputation_score: 0,
           custom_css: %{}
         }}

      card ->
        {:ok, IdentityCard.to_snapshot(card)}
    end
  end

  defp get_identity_card(user_id) do
    Repo.one(from(ic in IdentityCard, where: ic.user_id == ^user_id))
  end

  defp get_in_settings(%{settings: settings}, key) when is_map(settings) do
    Map.get(settings, key) || Map.get(settings, to_string(key))
  end

  defp get_in_settings(_, _), do: nil
end
