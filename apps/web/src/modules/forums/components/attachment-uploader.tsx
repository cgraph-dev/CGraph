/**
 * AttachmentUploader Component
 * Drag & drop file upload with thumbnails and progress tracking
 */

import { type PostAttachment } from '@/modules/forums/store';
import {
  useAttachmentUploader,
  Dropzone,
  ErrorList,
  UploadProgressList,
  AttachmentList,
} from '@/modules/forums/components/attachment-uploader/index';

interface AttachmentUploaderProps {
  postId?: string;
  attachments?: PostAttachment[];
  onUpload?: (attachment: PostAttachment) => void;
  onDelete?: (attachmentId: string) => void;
  maxSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  className?: string;
}

/**
 * Attachment Uploader component.
 */
export default function AttachmentUploader({
  postId,
  attachments = [],
  onUpload,
  onDelete,
  maxSize,
  maxFiles,
  allowedTypes,
  className = '',
}: AttachmentUploaderProps) {
  const uploader = useAttachmentUploader({
    postId,
    attachmentsCount: attachments.length,
    maxSize,
    maxFiles,
    allowedTypes,
    onUpload,
    onDelete,
  });

  return (
    <div className={className}>
      <Dropzone
        isDragging={uploader.isDragging}
        maxFiles={uploader.maxFiles}
        maxSize={uploader.maxSize}
        allowedTypes={uploader.allowedTypes}
        fileInputRef={uploader.fileInputRef}
        onDrop={uploader.handleDrop}
        onDragOver={uploader.handleDragOver}
        onDragLeave={uploader.handleDragLeave}
        onFileSelect={uploader.handleFileSelect}
        onOpenPicker={uploader.openFilePicker}
      />

      <ErrorList errors={uploader.errors} />

      <UploadProgressList progress={uploader.uploadProgress} />

      <AttachmentList attachments={attachments} onDelete={uploader.handleDelete} />
    </div>
  );
}
