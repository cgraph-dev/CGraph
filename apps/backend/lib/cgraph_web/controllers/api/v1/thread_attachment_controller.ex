defmodule CGraphWeb.API.V1.ThreadAttachmentController do
  @moduledoc """
  API controller for thread attachments (file uploads).
  """
  use CGraphWeb, :controller

  alias CGraph.Forums.ThreadAttachments

  action_fallback CGraphWeb.FallbackController

  @doc """
  Upload an attachment to a thread.
  POST /api/v1/threads/:thread_id/attachments
  """
  @spec upload(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def upload(conn, %{"thread_id" => thread_id} = params) do
    user = conn.assigns.current_user

    attachment_attrs = %{
      thread_id: thread_id,
      post_id: params["post_id"],
      filename: params["filename"],
      original_filename: params["original_filename"],
      content_type: params["content_type"],
      file_size: params["file_size"],
      file_path: params["file_path"],
      file_url: params["file_url"],
      is_inline: params["is_inline"] || false
    }

    case ThreadAttachments.create_attachment(user, attachment_attrs) do
      {:ok, attachment} ->
        conn
        |> put_status(:created)
        |> render(:show, attachment: attachment)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  List attachments for a thread.
  GET /api/v1/threads/:thread_id/attachments
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"thread_id" => thread_id}) do
    attachments = ThreadAttachments.list_attachments(thread_id)
    render(conn, :index, attachments: attachments)
  end

  @doc """
  Delete an attachment.
  DELETE /api/v1/threads/:thread_id/attachments/:id
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    case ThreadAttachments.delete_attachment(id, user_id) do
      {:ok, _attachment} ->
        send_resp(conn, :no_content, "")

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Attachment not found"})

      {:error, :unauthorized} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Not authorized to delete this attachment"})
    end
  end
end
