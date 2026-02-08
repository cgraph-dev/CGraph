/**
 * Message and media handler factories — barrel re-export
 * Implementations split into message-handlers.ts and media-handlers.ts
 */

export {
  createSendHandler,
  createE2EERetryHandler,
  createUnencryptedSendHandler,
} from './message-handlers';
export {
  createStickerSelectHandler,
  createGifSelectHandler,
  createVoiceCompleteHandler,
  createFileSelectHandler,
} from './media-handlers';
