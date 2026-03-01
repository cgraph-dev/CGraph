defmodule CGraph.Notifications.Preferences do
  @moduledoc """
  Context module for per-conversation/channel/group notification preferences.

  Handles CRUD operations and delivery checks for granular notification settings.
  A nil preference record means "all" notifications are delivered (the default).
  """

  import Ecto.Query

  alias CGraph.Notifications.NotificationPreference
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Queries
  # ---------------------------------------------------------------------------

  @doc "Returns the notification preference for a target, or nil (nil = default :all)."
  @spec get_preference(String.t(), String.t(), String.t()) :: NotificationPreference.t() | nil
  def get_preference(user_id, target_type, target_id) do
    NotificationPreference
    |> where([p], p.user_id == ^user_id and p.target_type == ^target_type and p.target_id == ^target_id)
    |> Repo.one()
  end

  @doc "Upserts a notification preference (insert or replace on conflict)."
  @spec set_preference(String.t(), String.t(), String.t(), map()) ::
          {:ok, NotificationPreference.t()} | {:error, Ecto.Changeset.t()}
  def set_preference(user_id, target_type, target_id, attrs) do
    merged =
      Map.merge(attrs, %{
        "user_id" => user_id,
        "target_type" => target_type,
        "target_id" => target_id
      })

    %NotificationPreference{}
    |> NotificationPreference.changeset(merged)
    |> Repo.insert(
      on_conflict: {:replace, [:mode, :muted_until, :updated_at]},
      conflict_target: [:user_id, :target_type, :target_id],
      returning: true
    )
  end

  @doc "Mutes a target (mode=none). Optionally pass `:until` for timed mutes."
  @spec mute(String.t(), String.t(), String.t(), keyword()) ::
          {:ok, NotificationPreference.t()} | {:error, Ecto.Changeset.t()}
  def mute(user_id, target_type, target_id, opts \\ []) do
    muted_until = Keyword.get(opts, :until)

    set_preference(user_id, target_type, target_id, %{
      "mode" => "none",
      "muted_until" => muted_until
    })
  end

  @doc "Unmutes a target by deleting the preference record."
  @spec unmute(String.t(), String.t(), String.t()) :: :ok
  def unmute(user_id, target_type, target_id) do
    NotificationPreference
    |> where([p], p.user_id == ^user_id and p.target_type == ^target_type and p.target_id == ^target_id)
    |> Repo.delete_all()

    :ok
  end

  @doc """
  Checks whether a notification should be delivered for a given target.

  Returns `true` if:
  - No preference exists (default: deliver all)
  - Mode is "all"
  - Mode is "mentions_only" and notification_type is a mention
  - Mode is "none" but muted_until has expired

  Returns `false` otherwise.
  """
  @spec should_deliver?(String.t(), String.t(), String.t(), atom()) :: boolean()
  def should_deliver?(user_id, target_type, target_id, notification_type) do
    case get_preference(user_id, target_type, target_id) do
      nil ->
        true

      %NotificationPreference{mode: "all"} ->
        true

      %NotificationPreference{mode: "mentions_only"} ->
        notification_type in [:message_mention, :channel_mention, :post_mention]

      %NotificationPreference{mode: "none", muted_until: nil} ->
        false

      %NotificationPreference{mode: "none", muted_until: muted_until} ->
        DateTime.compare(DateTime.utc_now(), muted_until) == :gt
    end
  end

  @doc "Lists all non-default preferences for a user (mode != 'all' or with muted_until)."
  @spec list_muted(String.t()) :: [NotificationPreference.t()]
  def list_muted(user_id) do
    NotificationPreference
    |> where([p], p.user_id == ^user_id and p.mode != "all")
    |> order_by([p], desc: p.updated_at)
    |> Repo.all()
  end

  @doc "Lists all preferences for a user."
  @spec list_all(String.t()) :: [NotificationPreference.t()]
  def list_all(user_id) do
    NotificationPreference
    |> where([p], p.user_id == ^user_id)
    |> order_by([p], desc: p.updated_at)
    |> Repo.all()
  end

  @doc "Bulk-fetches preferences for multiple targets (e.g. conversation list)."
  @spec bulk_get_preferences(String.t(), [{String.t(), String.t()}]) :: [NotificationPreference.t()]
  def bulk_get_preferences(user_id, targets) when is_list(targets) do
    conditions =
      Enum.reduce(targets, dynamic(false), fn {target_type, target_id}, acc ->
        dynamic([p], ^acc or (p.target_type == ^target_type and p.target_id == ^target_id))
      end)

    NotificationPreference
    |> where([p], p.user_id == ^user_id)
    |> where(^conditions)
    |> Repo.all()
  end
end
