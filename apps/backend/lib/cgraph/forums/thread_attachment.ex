defmodule Cgraph.Forums.ThreadAttachment do
  @moduledoc """
  Thread attachment schema - file uploads attached to threads or posts.
  Supports images, documents, and other file types with size limits.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @allowed_extensions ~w(.jpg .jpeg .png .gif .webp .pdf .doc .docx .xls .xlsx .zip .txt .md)
  @max_file_size 10 * 1024 * 1024  # 10MB default

  schema "thread_attachments" do
    field :filename, :string
    field :original_filename, :string
    field :content_type, :string
    field :file_size, :integer
    field :file_path, :string  # S3 path or local storage path
    field :file_url, :string   # public URL
    
    # Image-specific
    field :is_image, :boolean, default: false
    field :width, :integer
    field :height, :integer
    field :thumbnail_url, :string
    
    # Stats
    field :download_count, :integer, default: 0
    
    # Inline display in post
    field :is_inline, :boolean, default: false
    
    belongs_to :thread, Cgraph.Forums.Thread
    belongs_to :post, Cgraph.Forums.ThreadPost
    belongs_to :uploader, Cgraph.Accounts.User

    timestamps()
  end

  def changeset(attachment, attrs) do
    attachment
    |> cast(attrs, [
      :filename, :original_filename, :content_type, :file_size,
      :file_path, :file_url, :is_image, :width, :height, :thumbnail_url,
      :download_count, :is_inline,
      :thread_id, :post_id, :uploader_id
    ])
    |> validate_required([:filename, :original_filename, :content_type, :file_size, :file_path, :uploader_id])
    |> validate_file_size()
    |> validate_extension()
    |> detect_image()
    |> foreign_key_constraint(:thread_id)
    |> foreign_key_constraint(:post_id)
    |> foreign_key_constraint(:uploader_id)
  end

  defp validate_file_size(changeset) do
    case get_change(changeset, :file_size) do
      nil -> changeset
      size when size > @max_file_size ->
        add_error(changeset, :file_size, "file too large (max #{div(@max_file_size, 1024 * 1024)}MB)")
      _ -> changeset
    end
  end

  defp validate_extension(changeset) do
    case get_change(changeset, :original_filename) do
      nil -> changeset
      filename ->
        ext = filename |> Path.extname() |> String.downcase()
        if ext in @allowed_extensions do
          changeset
        else
          add_error(changeset, :original_filename, "file type not allowed")
        end
    end
  end

  defp detect_image(changeset) do
    case get_change(changeset, :content_type) do
      nil -> changeset
      content_type ->
        is_image = String.starts_with?(content_type, "image/")
        put_change(changeset, :is_image, is_image)
    end
  end

  def allowed_extensions, do: @allowed_extensions
  def max_file_size, do: @max_file_size
end
