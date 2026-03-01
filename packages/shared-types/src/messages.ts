/**
 * Message forwarding types.
 * @module
 */

/**
 * Information about a forwarded message's origin.
 */
export interface ForwardedMessageInfo {
  originalMessageId: string;
  originalSenderId: string;
  originalSenderName: string;
}

/**
 * Request body for forwarding a message.
 */
export interface ForwardMessageRequest {
  conversation_ids: string[];
}

/**
 * Response from the forward message endpoint.
 */
export interface ForwardMessageResponse {
  data: {
    forwarded_count: number;
  };
}
