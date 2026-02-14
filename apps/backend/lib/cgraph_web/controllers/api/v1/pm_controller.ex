defmodule CGraphWeb.API.V1.PMController do
  @moduledoc """
  Controller for Private Message (PM) system.
  Implements MyBB-style private messaging with folders, drafts, and read receipts.

  ## Features
  - Message sending/receiving
  - Custom folders
  - Drafts
  - Read receipts
  - Export functionality
  """
  use CGraphWeb, :controller

  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Messaging
  alias CGraph.Messaging.{PMFolder, PrivateMessage}

  action_fallback CGraphWeb.FallbackController

  @max_per_page 50

  # ========================================
  # FOLDERS
  # ========================================

  @doc """
  List all PM folders for the current user.
  """
  def list_folders(conn, _params) do
    user = conn.assigns.current_user
    folders = Messaging.list_pm_folders(user.id)
    render(conn, :folders, folders: folders)
  end

  @doc """
  Create a new PM folder.
  """
  def create_folder(conn, %{"name" => name} = params) do
    user = conn.assigns.current_user

    attrs = %{
      user_id: user.id,
      name: name,
      icon: Map.get(params, "icon"),
      color: Map.get(params, "color")
    }

    with {:ok, %PMFolder{} = folder} <- Messaging.create_pm_folder(attrs) do
      conn
      |> put_status(:created)
      |> render(:folder, folder: folder)
    end
  end

  @doc """
  Update a PM folder.
  """
  def update_folder(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, folder} <- Messaging.get_pm_folder(id, user.id),
         {:ok, updated_folder} <- Messaging.update_pm_folder(folder, params) do
      render(conn, :folder, folder: updated_folder)
    end
  end

  @doc """
  Delete a PM folder.
  """
  def delete_folder(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, folder} <- Messaging.get_pm_folder(id, user.id),
         {:ok, _} <- Messaging.delete_pm_folder(folder) do
      send_resp(conn, :no_content, "")
    end
  end

  # ========================================
  # MESSAGES
  # ========================================

  @doc """
  List messages in a folder or all messages.
  """
  def list_messages(conn, params) do
    user = conn.assigns.current_user

    opts = [
      folder_id: Map.get(params, "folder_id"),
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page),
      unread_only: parse_bool(params["unread_only"], false),
      search: Map.get(params, "search")
    ]

    {messages, pagination} = Messaging.list_private_messages(user.id, opts)
    render(conn, :messages, messages: messages, pagination: pagination)
  end

  @doc """
  Get a single message.
  """
  def show_message(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_private_message(id, user.id) do
      # Auto-mark as read when viewing
      Messaging.mark_message_read(message, user.id)
      render(conn, :message, message: message)
    end
  end

  @doc """
  Send a new private message.
  """
  def send_message(conn, params) do
    user = conn.assigns.current_user

    attrs = %{
      sender_id: user.id,
      recipient_ids: parse_recipient_ids(params["recipient_ids"] || params["recipients"] || params["recipient_id"]),
      subject: params["subject"],
      content: params["content"],
      parent_id: Map.get(params, "parent_id"),
      icon: Map.get(params, "icon")
    }

    with {:ok, %PrivateMessage{} = message} <- Messaging.send_private_message(attrs) do
      conn
      |> put_status(:created)
      |> render(:message, message: message)
    end
  end

  @doc """
  Update a message (only allowed for drafts or before read).
  """
  def update_message(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_private_message(id, user.id),
         :ok <- authorize_update(message, user),
         {:ok, updated} <- Messaging.update_private_message(message, params) do
      render(conn, :message, message: updated)
    end
  end

  @doc """
  Delete a message (soft delete).
  """
  def delete_message(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_private_message(id, user.id),
         {:ok, _} <- Messaging.delete_private_message(message, user.id) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Mark a message as read.
  """
  def mark_read(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_private_message(id, user.id),
         {:ok, _} <- Messaging.mark_message_read(message, user.id) do
      json(conn, %{success: true, read_at: DateTime.utc_now()})
    end
  end

  @doc """
  Move a message to a different folder.
  """
  def move_to_folder(conn, %{"id" => id, "folder_id" => folder_id}) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_private_message(id, user.id),
         {:ok, _folder} <- Messaging.get_pm_folder(folder_id, user.id),
         :ok <- Messaging.move_pm_to_folder([message.id], folder_id, user.id),
         {:ok, updated} <- Messaging.get_private_message(id, user.id) do
      render(conn, :message, message: updated)
    end
  end

  # ========================================
  # DRAFTS
  # ========================================

  @doc """
  List all drafts.
  """
  def list_drafts(conn, params) do
    user = conn.assigns.current_user

    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 20), @max_per_page)
    ]

    {drafts, pagination} = Messaging.list_pm_drafts(user.id, opts)
    render(conn, :drafts, drafts: drafts, pagination: pagination)
  end

  @doc """
  Save a new draft.
  """
  def save_draft(conn, params) do
    user = conn.assigns.current_user

    attrs = %{
      user_id: user.id,
      recipient_ids: parse_recipient_ids(params["recipient_ids"]),
      subject: params["subject"],
      content: params["content"]
    }

    with {:ok, draft} <- Messaging.save_pm_draft(attrs) do
      conn
      |> put_status(:created)
      |> render(:draft, draft: draft)
    end
  end

  @doc """
  Update an existing draft.
  """
  def update_draft(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, draft} <- Messaging.get_pm_draft(id, user.id),
         {:ok, updated} <- Messaging.update_pm_draft(draft, params) do
      render(conn, :draft, draft: updated)
    end
  end

  @doc """
  Delete a draft.
  """
  def delete_draft(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, draft} <- Messaging.get_pm_draft(id, user.id),
         {:ok, _} <- Messaging.delete_pm_draft(draft) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Send a draft (convert to message).
  """
  def send_draft(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, draft} <- Messaging.get_pm_draft(id, user.id),
         {:ok, message} <- Messaging.send_pm_draft(draft) do
      conn
      |> put_status(:created)
      |> render(:message, message: message)
    end
  end

  # ========================================
  # STATS & EXPORT
  # ========================================

  @doc """
  Get PM statistics for current user.
  """
  def stats(conn, _params) do
    user = conn.assigns.current_user
    stats = Messaging.get_pm_stats(user.id)
    json(conn, %{stats: stats})
  end

  @doc """
  Export all private messages.
  """
  def export(conn, params) do
    user = conn.assigns.current_user
    format = Map.get(params, "format", "json")

    with {:ok, export_data} <- Messaging.export_pm(user.id, format) do
      case format do
        "json" ->
          json(conn, %{messages: export_data})

        "csv" ->
          conn
          |> put_resp_content_type("text/csv")
          |> put_resp_header("content-disposition", "attachment; filename=\"pm_export.csv\"")
          |> send_resp(200, export_data)

        _ ->
          json(conn, %{messages: export_data})
      end
    end
  end

  # ========================================
  # HELPERS
  # ========================================

  defp parse_recipient_ids(nil), do: []
  defp parse_recipient_ids(ids) when is_list(ids), do: ids
  defp parse_recipient_ids(ids) when is_binary(ids) do
    ids
    |> String.split(",")
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
  end

  defp authorize_update(%PrivateMessage{sender_id: sender_id}, %{id: user_id})
       when sender_id == user_id do
    :ok
  end
  defp authorize_update(_message, _user), do: {:error, :unauthorized}
end
