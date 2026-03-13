/**
 * Ambient type declarations for @livekit/react-native.
 *
 * Provides Room and E2EEOptions types used in callEncryption.ts.
 */
declare module '@livekit/react-native' {
  export function registerGlobals(): void;

  export class Room {
    name: string;
    connect(url: string, token: string): Promise<void>;
    disconnect(stopTracks?: boolean): Promise<void>;
  }

  export interface E2EEOptions {
    keyProvider?: unknown;
    encryptionKey?: Uint8Array;
  }
}
