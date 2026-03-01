defmodule CGraph.Forums.ThreadAttachments do
  @moduledoc """
  Context module for thread attachment operations.

  Handles creating, listing, retrieving, and deleting
  file attachments on threads and posts.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.ThreadAttachment
  alias CGraph.Repo

  @doc """
  Creates a new attachment.
  """
  @spec create_attachment(struct(), map()) :: {:ok, ThreadAttachment.t()} | {:error, Ecto.Changeset.t()}
  def create_attachment(user, attrs) do
    %ThreadAttachment{}
    |> ThreadAttachment.changeset(Map.put(attrs, :uploader_id, user.id))
    |> Repo.insert()
  end

  @doc """
  Lists attachments for a thread.
  """
  @spec list_attachments(String.t()) :: [ThreadAttachment.t()]
  def list_attachments(thread_id) do
    from(a in ThreadAttachment,
      where: a.thread_id == ^thread_id,
      order_by: [asc: a.inserted_at],
      preload: [:uploader]
    )
    |> Repo.all()
  end

  @doc """
  Gets a single attachment by ID.
  """
  @spec get_attachment(String.t()) :: {:ok, ThreadAttachment.t()} | {:error, :not_found}
  def get_attachment(id) do
    case Repo.get(ThreadAttachment, id) do
      nil -> {:error, :not_found}
      attachment -> {:ok, attachment}
    end
  end

  @doc """
  Deletes an attachment if the user is the uploader.
  """
  @spec delete_attachment(String.t(), String.t()) :: {:ok, ThreadAttachment.t()} | {:error, :not_found | :unauthorized}
  def delete_attachment(id, user_id) do
    case Repo.get(ThreadAttachment, id) do
      nil ->
        {:error, :not_found}

      %{uploader_id: ^user_id} = attachment ->
        Repo.delete(attachment)

      _other ->
        {:error, :unauthorized}
    end
  end
end
