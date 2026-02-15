defmodule CGraph.Notifications.Queries do
  @moduledoc "Notification listing, filtering, marking, and deletion operations."

  import Ecto.Query

  alias CGraph.Accounts.User
  alias CGraph.Notifications.Notification
  alias CGraph.Repo

  @doc "Lists notifications for a user with filtering and pagination."
  @spec list_notifications(User.t(), keyword()) :: {[Notification.t()], map()}
  def list_notifications(%User{} = user, opts \\ []) do
    filter = Keyword.get(opts, :filter, "all")
    unread_only = Keyword.get(opts, :unread_only, filter == "unread")
    types = Keyword.get(opts, :types, [])
    type = Keyword.get(opts, :type)
    types = if type && types == [], do: [type], else: types

    query =
      Notification
      |> where([n], n.user_id == ^user.id)
      |> preload(:actor)

    query = if unread_only, do: where(query, [n], is_nil(n.read_at)), else: query
    query = if types != [], do: where(query, [n], n.type in ^types), else: query

    pagination_opts =
      CGraph.Pagination.parse_params(
        Enum.into(opts, %{}),
        sort_field: :inserted_at,
        sort_direction: :desc,
        default_limit: 20
      )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Gets the count of unread notifications for a user."
  @spec unread_count(User.t()) :: non_neg_integer()
  def unread_count(%User{} = user) do
    Notification
    |> where([n], n.user_id == ^user.id)
    |> where([n], is_nil(n.read_at))
    |> Repo.aggregate(:count)
  end

  @doc "Marks a single notification as read."
  @spec mark_read(Notification.t()) :: {:ok, Notification.t()} | {:error, Ecto.Changeset.t()}
  def mark_read(%Notification{} = notification) do
    notification
    |> Notification.mark_read_changeset()
    |> Repo.update()
  end

  @doc "Marks a notification as read. Accepts struct or ID."
  @spec mark_as_read(Notification.t() | String.t()) :: {:ok, Notification.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def mark_as_read(%Notification{} = notification), do: mark_read(notification)

  def mark_as_read(notification_id) when is_binary(notification_id) do
    case Repo.get(Notification, notification_id) do
      nil -> {:error, :not_found}
      notification -> mark_read(notification)
    end
  end

  @doc "Marks a notification as unread. Accepts struct or ID."
  @spec mark_as_unread(Notification.t() | String.t()) :: {:ok, Notification.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def mark_as_unread(%Notification{} = notification) do
    notification
    |> Ecto.Changeset.change(read_at: nil)
    |> Repo.update()
  end

  def mark_as_unread(notification_id) when is_binary(notification_id) do
    case Repo.get(Notification, notification_id) do
      nil -> {:error, :not_found}
      notification ->
        notification
        |> Ecto.Changeset.change(read_at: nil)
        |> Repo.update()
    end
  end

  @doc "Marks all notifications as read for a user."
  @spec mark_all_read(User.t()) :: {non_neg_integer(), nil | [term()]}
  def mark_all_read(%User{} = user) do
    Notification
    |> where([n], n.user_id == ^user.id)
    |> where([n], is_nil(n.read_at))
    |> Repo.update_all(set: [read_at: DateTime.utc_now()])
  end

  @doc "Marks notifications as read up to a certain notification ID."
  @spec mark_read_up_to(User.t(), String.t()) :: {:error, :not_found} | {non_neg_integer(), nil | [term()]}
  def mark_read_up_to(%User{} = user, notification_id) do
    case Repo.get(Notification, notification_id) do
      nil ->
        {:error, :not_found}

      notification ->
        Notification
        |> where([n], n.user_id == ^user.id)
        |> where([n], is_nil(n.read_at))
        |> where([n], n.inserted_at <= ^notification.inserted_at)
        |> Repo.update_all(set: [read_at: DateTime.utc_now()])
    end
  end

  @doc "Marks a notification as clicked (for analytics)."
  @spec mark_clicked(Notification.t()) :: {:ok, Notification.t()} | {:error, Ecto.Changeset.t()}
  def mark_clicked(%Notification{} = notification) do
    notification
    |> Notification.mark_clicked_changeset()
    |> Repo.update()
  end

  @doc "Mark all notifications as read, with optional type filter."
  @spec mark_all_as_read(User.t(), keyword()) :: {:ok, non_neg_integer()}
  def mark_all_as_read(%User{} = user, opts \\ []) do
    type = Keyword.get(opts, :type)

    query =
      Notification
      |> where([n], n.user_id == ^user.id)
      |> where([n], is_nil(n.read_at))

    query = if type, do: where(query, [n], n.type == ^type), else: query

    {count, _} = Repo.update_all(query, set: [read_at: DateTime.utc_now()])
    {:ok, count}
  end

  @doc "Gets a single notification by ID."
  @spec get_notification(String.t()) :: {:ok, Notification.t()} | {:error, :not_found}
  def get_notification(id) do
    case Repo.get(Notification, id) do
      nil -> {:error, :not_found}
      notification -> {:ok, Repo.preload(notification, :actor)}
    end
  end

  @doc "Gets a notification by ID, ensuring it belongs to the user."
  @spec get_notification(User.t(), String.t()) :: {:ok, Notification.t()} | {:error, :not_found}
  def get_notification(%User{} = user, id) do
    Notification
    |> where([n], n.id == ^id and n.user_id == ^user.id)
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      notification -> {:ok, Repo.preload(notification, :actor)}
    end
  end

  @doc "Get unread counts by category."
  @spec get_unread_counts(User.t()) :: %{total: non_neg_integer(), by_type: map()}
  def get_unread_counts(%User{} = user) do
    counts =
      Notification
      |> where([n], n.user_id == ^user.id)
      |> where([n], is_nil(n.read_at))
      |> group_by([n], n.type)
      |> select([n], {n.type, count(n.id)})
      |> Repo.all()
      |> Map.new()

    %{total: counts |> Map.values() |> Enum.sum(), by_type: counts}
  end

  @doc "Deletes a notification."
  @spec delete_notification(Notification.t()) :: {:ok, Notification.t()} | {:error, Ecto.Changeset.t()}
  def delete_notification(%Notification{} = notification) do
    Repo.delete(notification)
  end

  @doc "Deletes all notifications for a user."
  @spec delete_all(User.t()) :: {non_neg_integer(), nil | [term()]}
  def delete_all(%User{} = user) do
    Notification
    |> where([n], n.user_id == ^user.id)
    |> Repo.delete_all()
  end

  @doc "Delete all notifications for a user, with optional type filter."
  @spec delete_all_notifications(User.t(), keyword()) :: {:ok, non_neg_integer()}
  def delete_all_notifications(%User{} = user, opts \\ []) do
    type = Keyword.get(opts, :type)

    query =
      Notification
      |> where([n], n.user_id == ^user.id)

    query = if type, do: where(query, [n], n.type == ^type), else: query

    {count, _} = Repo.delete_all(query)
    {:ok, count}
  end

  @doc "Cleans up old read notifications (older than specified days)."
  @spec cleanup_old_notifications(pos_integer()) :: {non_neg_integer(), nil | [term()]}
  def cleanup_old_notifications(days \\ 30) do
    cutoff = DateTime.utc_now() |> DateTime.add(-days * 24 * 60 * 60, :second)

    Notification
    |> where([n], n.inserted_at < ^cutoff)
    |> where([n], not is_nil(n.read_at))
    |> Repo.delete_all()
  end
end
