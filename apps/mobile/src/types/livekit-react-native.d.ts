/**
 * Ambient type declarations for @livekit/react-native.
 *
 * Provides Room and E2EEOptions types used in callEncryption.ts.
 */
declare module '@livekit/react-native' {
  export function registerGlobals(): void;

  /** Room class. */
  export class Room {
    name: string;
    /** Description. */
    connect(url: string, token: string): Promise<void>;
    /** Description. */
    disconnect(stopTracks?: boolean): Promise<void>;
  }

  export interface E2EEOptions {
    keyProvider?: unknown;
    encryptionKey?: Uint8Array;
  }
}
