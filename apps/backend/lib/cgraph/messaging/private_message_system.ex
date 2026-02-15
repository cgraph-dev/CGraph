defmodule CGraph.Messaging.PrivateMessageSystem do
  @moduledoc """
  MyBB-style private message system: folders, messages, drafts, stats, export.
  """

  import Ecto.Query, warn: false
  alias CGraph.Messaging.{PMDraft, PMFolder, PrivateMessage}
  alias CGraph.Repo

  @default_pm_folders ["Inbox", "Sent", "Drafts", "Trash"]

  # ==================== FOLDERS ====================

  @doc "List PM folders for a user, creating defaults if none exist."
  def list_pm_folders(user_id) do
    query =
      from f in PMFolder,
        where: f.user_id == ^user_id,
        order_by: [asc: f.is_system, asc: f.order, asc: f.name]

    folders = Repo.all(query)
    if Enum.empty?(folders), do: create_default_pm_folders(user_id), else: folders
  end

  @doc "Create a PM folder."
  def create_pm_folder(attrs) do
    %PMFolder{} |> PMFolder.changeset(attrs) |> Repo.insert()
  end

  @doc "Get a PM folder, optionally scoped to a user."
  def get_pm_folder(folder_id, user_id \\ nil) do
    query =
      if user_id do
        from f in PMFolder, where: f.id == ^folder_id and f.user_id == ^user_id
      else
        from f in PMFolder, where: f.id == ^folder_id
      end

    case Repo.one(query) do
      nil -> {:error, :not_found}
      folder -> {:ok, folder}
    end
  end

  @doc "Get a PM folder by name for a user."
  def get_pm_folder_by_name(user_id, name) do
    Repo.get_by(PMFolder, user_id: user_id, name: name)
  end

  @doc "Update a PM folder (system folders cannot be modified)."
  def update_pm_folder(%PMFolder{is_system: true}, _attrs), do: {:error, :cannot_modify_system_folder}
  def update_pm_folder(%PMFolder{} = folder, attrs) do
    folder |> PMFolder.changeset(attrs) |> Repo.update()
  end

  @doc "Delete a PM folder (system folders cannot be deleted). Moves messages to Inbox."
  def delete_pm_folder(%PMFolder{is_system: true}), do: {:error, :cannot_delete_system_folder}
  def delete_pm_folder(%PMFolder{} = folder) do
    inbox = get_pm_folder_by_name(folder.user_id, "Inbox")
    from(m in PrivateMessage, where: m.folder_id == ^folder.id)
    |> Repo.update_all(set: [folder_id: inbox.id])
    Repo.delete(folder)
  end

  # ==================== MESSAGES ====================

  @doc """
  List private messages using cursor-based pagination.

  ## Options
    * `:cursor` - Opaque cursor string
    * `:limit` - Number of messages (default: 20, max: 100)
    * `:folder_id` - Filter by folder
    * `:unread_only` - Only unread (default: false)
    * `:search` - Search subject/content (min 2 chars)
    * `:include_total` - Include total count (default: false)
  """
  def list_private_messages(user_id, opts) when is_list(opts) do
    alias CGraph.Pagination

    cursor = Keyword.get(opts, :cursor)
    limit = Keyword.get(opts, :limit, Keyword.get(opts, :per_page, 20))
    folder_id = Keyword.get(opts, :folder_id)
    unread_only = Keyword.get(opts, :unread_only, false)
    search = Keyword.get(opts, :search)
    include_total = Keyword.get(opts, :include_total, false)

    base_query = from m in PrivateMessage,
      where: m.recipient_id == ^user_id,
      preload: [:sender]

    base_query = if folder_id, do: from(m in base_query, where: m.folder_id == ^folder_id), else: base_query
    base_query = if unread_only, do: from(m in base_query, where: m.is_read == false), else: base_query

    base_query = if search && String.length(search) >= 2 do
      pattern = "%#{search}%"
      from m in base_query, where: ilike(m.subject, ^pattern) or ilike(m.content, ^pattern)
    else
      base_query
    end

    pagination_opts = %{
      cursor: cursor, after_cursor: nil, before_cursor: nil,
      limit: min(limit, 100), sort_field: :inserted_at, sort_direction: :desc,
      include_total: include_total
    }

    {messages, page_info} = Pagination.paginate(base_query, pagination_opts)

    pagination = %{
      has_more: page_info.has_next_page, end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor, has_next_page: page_info.has_next_page,
      has_previous_page: page_info.has_previous_page
    }

    pagination = if include_total do
      total = Repo.aggregate(base_query, :count, :id)
      Map.merge(pagination, %{total_count: total, total_pages: ceil(total / limit)})
    else
      pagination
    end

    {messages, pagination}
  end

  def list_private_messages(user_id, folder_id, opts) when is_binary(folder_id) do
    list_private_messages(user_id, Keyword.put(opts, :folder_id, folder_id))
  end

  @doc "Get a private message by ID, accessible by sender or recipient."
  def get_private_message(message_id, user_id) do
    query = from m in PrivateMessage,
      where: m.id == ^message_id,
      where: m.sender_id == ^user_id or m.recipient_id == ^user_id,
      preload: [:sender, :recipient]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
  end

  @doc "Send a private message (creates copies in recipient inbox and sender sent folder)."
  def send_private_message(attrs) do
    recipient_id = Map.get(attrs, :recipient_id) || List.first(Map.get(attrs, :recipient_ids, []))

    if is_nil(recipient_id) do
      {:error, :recipient_required}
    else
      case Repo.get(CGraph.Accounts.User, recipient_id) do
        nil -> {:error, :recipient_not_found}
        _user ->
          recipient_inbox = get_pm_folder_by_name(recipient_id, "Inbox") ||
            ensure_default_folders_and_get(recipient_id, "Inbox")
          sender_sent = get_pm_folder_by_name(attrs.sender_id, "Sent") ||
            ensure_default_folders_and_get(attrs.sender_id, "Sent")

          recipient_attrs = attrs
            |> Map.put(:recipient_id, recipient_id)
            |> Map.put(:folder_id, recipient_inbox.id)
            |> Map.put(:is_read, false)

          with {:ok, message} <- create_private_message(recipient_attrs) do
            sender_attrs = attrs
              |> Map.put(:recipient_id, recipient_id)
              |> Map.put(:folder_id, sender_sent.id)
              |> Map.put(:is_read, true)
            create_private_message(sender_attrs)

            {:ok, Repo.preload(message, [:sender, :recipient])}
          end
      end
    end
  end

  @doc "Update a private message."
  def update_private_message(%PrivateMessage{} = message, attrs) do
    message |> PrivateMessage.changeset(attrs) |> Repo.update()
  end

  @doc "Delete a private message (moves to Trash first, then hard-deletes from Trash)."
  def delete_private_message(%PrivateMessage{} = message, user_id) do
    trash = get_pm_folder_by_name(user_id, "Trash")
    if message.folder_id == trash.id do
      Repo.delete(message)
    else
      update_private_message(message, %{folder_id: trash.id})
    end
  end

  @doc "Mark private messages as read."
  def mark_pm_as_read(message_ids, user_id) when is_list(message_ids) do
    from(m in PrivateMessage,
      where: m.id in ^message_ids and m.recipient_id == ^user_id)
    |> Repo.update_all(set: [is_read: true, read_at: DateTime.truncate(DateTime.utc_now(), :second)])
    :ok
  end

  @doc "Move private messages to a folder."
  def move_pm_to_folder(message_ids, folder_id, user_id) when is_list(message_ids) do
    from(m in PrivateMessage,
      where: m.id in ^message_ids and m.recipient_id == ^user_id)
    |> Repo.update_all(set: [folder_id: folder_id])
    :ok
  end

  # ==================== DRAFTS ====================

  @doc "List PM drafts with cursor-based pagination."
  def list_pm_drafts(user_id, opts \\ []) do
    alias CGraph.Pagination

    cursor = Keyword.get(opts, :cursor)
    limit = Keyword.get(opts, :limit, Keyword.get(opts, :per_page, 20))
    include_total = Keyword.get(opts, :include_total, false)

    base_query = from d in PMDraft,
      where: d.sender_id == ^user_id,
      preload: [:recipient]

    pagination_opts = %{
      cursor: cursor, after_cursor: nil, before_cursor: nil,
      limit: min(limit, 100), sort_field: :updated_at, sort_direction: :desc,
      include_total: include_total
    }

    {drafts, page_info} = Pagination.paginate(base_query, pagination_opts)

    pagination = %{
      has_more: page_info.has_next_page, end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor, has_next_page: page_info.has_next_page,
      has_previous_page: page_info.has_previous_page
    }

    pagination = if include_total do
      total = Repo.aggregate(base_query, :count, :id)
      Map.merge(pagination, %{total_count: total, total_pages: ceil(total / limit)})
    else
      pagination
    end

    {drafts, pagination}
  end

  @doc "Save a PM draft."
  def save_pm_draft(attrs), do: %PMDraft{} |> PMDraft.changeset(attrs) |> Repo.insert()

  @doc "Get a PM draft by ID."
  def get_pm_draft(draft_id, user_id) do
    query = from d in PMDraft,
      where: d.id == ^draft_id and d.sender_id == ^user_id,
      preload: [:recipient]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      draft -> {:ok, draft}
    end
  end

  @doc "Update a PM draft."
  def update_pm_draft(%PMDraft{} = draft, attrs), do: draft |> PMDraft.changeset(attrs) |> Repo.update()

  @doc "Delete a PM draft."
  def delete_pm_draft(%PMDraft{} = draft), do: Repo.delete(draft)

  @doc "Send a PM draft (creates message and deletes draft)."
  def send_pm_draft(%PMDraft{} = draft) do
    with {:ok, message} <- send_private_message(%{
           sender_id: draft.sender_id, recipient_id: draft.recipient_id,
           subject: draft.subject, content: draft.content
         }),
         {:ok, _} <- delete_pm_draft(draft) do
      {:ok, message}
    end
  end

  # ==================== STATS & EXPORT ====================

  @doc "Get PM statistics for a user."
  def get_pm_stats(user_id) do
    inbox = get_pm_folder_by_name(user_id, "Inbox")
    sent = get_pm_folder_by_name(user_id, "Sent")
    inbox_id = if inbox, do: inbox.id, else: nil
    sent_id = if sent, do: sent.id, else: nil

    total_received = from(m in PrivateMessage, where: m.recipient_id == ^user_id) |> Repo.aggregate(:count, :id)

    unread_count = if inbox_id do
      from(m in PrivateMessage,
        where: m.recipient_id == ^user_id and m.is_read == false and m.folder_id == ^inbox_id)
      |> Repo.aggregate(:count, :id)
    else
      0
    end

    total_sent = if sent_id do
      from(m in PrivateMessage, where: m.sender_id == ^user_id and m.folder_id == ^sent_id)
      |> Repo.aggregate(:count, :id)
    else
      0
    end

    drafts_count = from(d in PMDraft, where: d.sender_id == ^user_id) |> Repo.aggregate(:count, :id)

    %{total_received: total_received, unread_count: unread_count, total_sent: total_sent, drafts_count: drafts_count}
  end

  @doc "Export all private messages for a user."
  def export_pm(user_id, _opts \\ []) do
    messages =
      from(m in PrivateMessage,
        where: m.sender_id == ^user_id or m.recipient_id == ^user_id,
        order_by: [desc: m.inserted_at],
        preload: [:sender, :recipient, :folder])
      |> Repo.all()

    {:ok, messages}
  end

  # ==================== PRIVATE HELPERS ====================

  defp create_default_pm_folders(user_id) do
    now = DateTime.truncate(DateTime.utc_now(), :second)

    entries =
      @default_pm_folders
      |> Enum.with_index()
      |> Enum.map(fn {name, idx} ->
        %{id: Ecto.UUID.generate(), user_id: user_id, name: name,
          is_system: true, order: idx, inserted_at: now, updated_at: now}
      end)

    Repo.insert_all(PMFolder, entries, on_conflict: :nothing)
    list_pm_folders(user_id)
  end

  defp ensure_default_folders_and_get(user_id, folder_name) do
    create_default_pm_folders(user_id)
    get_pm_folder_by_name(user_id, folder_name)
  end

  defp create_private_message(attrs) do
    %PrivateMessage{} |> PrivateMessage.changeset(attrs) |> Repo.insert()
  end
end
