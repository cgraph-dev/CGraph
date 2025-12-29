defmodule Cgraph.Repo.Migrations.CreateFiles do
  @moduledoc """
  Creates the files table for storing upload metadata.
  
  This table tracks all uploaded files including:
  - Images, videos, and documents attached to messages
  - Profile pictures and avatars
  - Forum/group attachments
  
  Key design decisions:
  - Uses binary_id (UUID) for primary key for consistency with other schemas
  - Stores both generated filename and original filename for user display
  - Includes dimensions (width/height) for media files
  - Includes duration for audio/video files
  - SHA256 checksum for integrity verification
  - Soft-linkable to users via user_id foreign key
  - context field allows categorizing files (message, avatar, post, etc.)
  """
  use Ecto.Migration

  def change do
    create table(:files, primary_key: false) do
      add :id, :binary_id, primary_key: true
      
      # File identification
      add :filename, :string, null: false, comment: "Generated unique filename on disk"
      add :original_filename, :string, comment: "Original filename from upload"
      add :content_type, :string, null: false, comment: "MIME type"
      add :size, :bigint, null: false, comment: "File size in bytes"
      
      # Storage location
      add :url, :string, null: false, comment: "Public URL to access file"
      add :thumbnail_url, :string, comment: "URL for thumbnail (images/videos)"
      
      # Media metadata
      add :width, :integer, comment: "Width in pixels (images/videos)"
      add :height, :integer, comment: "Height in pixels (images/videos)"
      add :duration, :float, comment: "Duration in seconds (audio/video)"
      
      # Integrity and security
      add :checksum, :string, comment: "SHA256 hash of file content"
      add :is_public, :boolean, default: false, null: false, comment: "Public accessibility"
      
      # Organization
      add :context, :string, comment: "Upload context: message, avatar, post, etc."
      add :user_id, references(:users, type: :binary_id, on_delete: :nilify_all),
          comment: "Owning user"

      timestamps(type: :utc_datetime)
    end

    # Index for user file lookups (quota calculation, file listing)
    create index(:files, [:user_id])
    
    # Index for context-based queries
    create index(:files, [:context])
    
    # Index for duplicate detection via checksum
    create index(:files, [:checksum])
    
    # Composite index for user + context queries (e.g., "all avatars for user X")
    create index(:files, [:user_id, :context])
  end
end
