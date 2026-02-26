/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Ethereum/Web3 types for wallet integration
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(eventName: string, callback: (...args: unknown[]) => void): void;
  removeListener?(eventName: string, callback: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Phoenix WebSocket types
declare module 'phoenix' {
  /**
   * Socket class.
   */
  export class Socket {
    constructor(endPoint: string, opts?: {
      params?: Record<string, unknown> | (() => Record<string, unknown>)
      transport?: unknown
      timeout?: number
      heartbeatIntervalMs?: number
      longpollerTimeout?: number
      binaryType?: string
      logger?: (kind: string, msg: string, data: unknown) => void
      reconnectAfterMs?: (tries: number) => number
      rejoinAfterMs?: (tries: number) => number
      vsn?: string
    })
    /**
     * connect.
     * @returns The result.
     */
    connect(): void
    /**
     * disconnect.
     *
     * @param callback - Callback function.
     * @returns The result.
     */
    disconnect(callback?: () => void, code?: number, reason?: string): void
    /**
     * Checks whether connected.
     * @returns True if the condition is met.
     */
    isConnected(): boolean
    /**
     * connection State.
     * @returns The result.
     */
    connectionState(): string
    /**
     * channel.
     *
     * @param topic - The topic.
     * @param chanParams - The chan params.
     * @param unknown - The unknown.
     * @returns The result.
     */
    channel(topic: string, chanParams?: Record<string, unknown>): Channel
    /**
     * Handles open.
     *
     * @param callback - Callback function.
     * @returns The result.
     */
    onOpen(callback: () => void): number
    /**
     * Handles close.
     *
     * @param callback - Callback function.
     * @returns The result.
     */
    onClose(callback: () => void): number
    /**
     * Handles error.
     *
     * @param callback - Callback function.
     * @returns The result.
     */
    onError(callback: (error: unknown) => void): number
    /**
     * Handles message.
     *
     * @param callback - Callback function.
     * @param unknown - The unknown.
     * @returns The result.
     */
    onMessage(callback: (msg: Record<string, unknown>) => void): number
    /**
     * Removes the specified item.
     *
     * @param channel - The channel.
     * @returns The result.
     */
    remove(channel: Channel): void
    /**
     * push.
     *
     * @param data - Input data.
     * @returns The result.
     */
    push(data: unknown): void
    /**
     * protocol.
     * @returns The result.
     */
    protocol(): string
    /**
     * end Point U R L.
     * @returns The result.
     */
    endPointURL(): string
  }

  /**
   * Channel class.
   */
  export class Channel {
    constructor(topic: string, params?: Record<string, unknown>, socket?: Socket)
    /**
     * join.
     *
     * @param timeout - The timeout.
     * @returns The result.
     */
    join(timeout?: number): Push
    /**
     * leave.
     *
     * @param timeout - The timeout.
     * @returns The result.
     */
    leave(timeout?: number): Push
    /**
     * push.
     *
     * @param event - The event object.
     * @param payload - The payload.
     * @param unknown - The unknown.
     * @param timeout - The timeout.
     * @returns The result.
     */
    push(event: string, payload?: Record<string, unknown>, timeout?: number): Push
    /**
     * Handles the event.
     *
     * @param event - The event object.
     * @param callback - Callback function.
     * @param joinRef - The join ref.
     * @returns The result.
     */
    on(event: string, callback: (payload?: unknown, ref?: string, joinRef?: string) => void): number
    /**
     * off.
     *
     * @param event - The event object.
     * @returns The result.
     */
    off(event: string, ref?: number): void
    /**
     * Handles close.
     *
     * @param callback - Callback function.
     * @param joinRef - The join ref.
     * @returns The result.
     */
    onClose(callback: (payload?: unknown, ref?: string, joinRef?: string) => void): void
    /**
     * Handles error.
     *
     * @param callback - Callback function.
     * @returns The result.
     */
    onError(callback: (reason?: string) => void): void
    /**
     * rejoin.
     *
     * @param timeout - The timeout.
     * @returns The result.
     */
    rejoin(timeout?: number): void
    /**
     * Checks whether member.
     *
     * @param topic - The topic.
     * @param event - The event object.
     * @param payload - The payload.
     * @param joinRef - The join ref.
     * @returns True if the condition is met.
     */
    isMember(topic: string, event: string, payload?: unknown, joinRef?: string): boolean
    topic: string
    state: string
  }

  /**
   * Push class.
   */
  export class Push {
    constructor(channel: Channel, event: string, payload?: Record<string, unknown>, timeout?: number)
    /**
     * resend.
     *
     * @param timeout - The timeout.
     * @returns The result.
     */
    resend(timeout: number): void
    /**
     * Dispatches the event.
     * @returns The result.
     */
    send(): void
    /**
     * receive.
     *
     * @param status - The status.
     * @param callback - Callback function.
     * @returns The result.
     */
    receive(status: string, callback: (response?: unknown) => void): Push
  }

  /**
   * Presence class.
   */
  export class Presence {
    constructor(channel: Channel, opts?: {
      events?: {
        state: string
        diff: string
      }
    })
    /**
     * Handles join.
     *
     * @param callback - Callback function.
     * @param current - The current.
     * @param newPres - The new pres.
     * @returns The result.
     */
    onJoin(callback: (key: string, current: unknown, newPres: unknown) => void): void
    /**
     * Handles leave.
     *
     * @param callback - Callback function.
     * @param current - The current.
     * @param leftPres - The left pres.
     * @returns The result.
     */
    onLeave(callback: (key: string, current: unknown, leftPres: unknown) => void): void
    /**
     * Handles sync.
     *
     * @param callback - Callback function.
     * @returns The result.
     */
    onSync(callback: () => void): void
    /**
     * unknown.
     *
     * @param chooser - The chooser.
     * @param pres - The pres.
     * @returns The result.
     */
    list<T>(chooser?: (key: string, pres: unknown) => T): T[]
    /**
     * in Pending Sync State.
     * @returns The result.
     */
    inPendingSyncState(): boolean
    /**
     * sync State.
     *
     * @param currentState - The current state.
     * @param T - The t.
     * @param newState - The new state.
     * @param unknown - The unknown.
     * @param onJoin - The on join.
     * @param current - The current.
     * @param newPres - The new pres.
     */
    static syncState<T>(
      currentState: Record<string, T>,
      newState: Record<string, unknown>,
      onJoin?: (key: string, current: T | undefined, newPres: unknown) => void,
      onLeave?: (key: string, current: T | undefined, leftPres: unknown) => void
    ): Record<string, T>
    /**
     * sync Diff.
     *
     * @param currentState - The current state.
     * @param T - The t.
     * @param diff - The diff.
     * @param unknown - The unknown.
     * @param unknown - The unknown.
     * @param onJoin - The on join.
     * @param current - The current.
     * @param newPres - The new pres.
     */
    static syncDiff<T>(
      currentState: Record<string, T>,
      diff: { joins?: Record<string, unknown>; leaves?: Record<string, unknown> },
      onJoin?: (key: string, current: T | undefined, newPres: unknown) => void,
      onLeave?: (key: string, current: T | undefined, leftPres: unknown) => void
    ): Record<string, T>
    /**
     * list.
     *
     * @param presences - The presences.
     * @param unknown - The unknown.
     * @param chooser - The chooser.
     * @param pres - The pres.
     */
    static list<T>(
      presences: Record<string, unknown>,
      chooser?: (key: string, pres: unknown) => T
    ): T[]
  }

  export const Serializer: {
    encode(msg: unknown, callback: (encoded: string) => void): void
    decode(rawPayload: string, callback: (decoded: unknown) => void): void
  }

  /**
   * Long Poll class.
   */
  export class LongPoll {
    constructor(endPoint: string)
    /**
     * normalize Endpoint.
     *
     * @param endPoint - The end point.
     * @returns The result.
     */
    normalizeEndpoint(endPoint: string): string
    /**
     * endpoint U R L.
     * @returns The result.
     */
    endpointURL(): string
    /**
     * close And Retry.
     * @returns The result.
     */
    closeAndRetry(): void
    /**
     * Handles timeout.
     * @returns The result.
     */
    ontimeout(): void
    /**
     * poll.
     * @returns The result.
     */
    poll(): void
    /**
     * Dispatches the event.
     *
     * @param body - The body.
     * @returns The result.
     */
    send(body: string): void
    /**
     * close.
     *
     * @param code - The code.
     * @param reason - The reason.
     * @returns The result.
     */
    close(code?: number, reason?: string): void
  }

  export const Ajax: {
    request(
      method: string,
      endPoint: string,
      accept: string,
      body: string,
      timeout: number,
      ontimeout: () => void,
      callback: (response: unknown) => void
    ): void
    xdomainRequest(
      req: unknown,
      method: string,
      endPoint: string,
      body: string,
      timeout: number,
      ontimeout: () => void,
      callback: (response: unknown) => void
    ): void
    xhrRequest(
      req: unknown,
      method: string,
      endPoint: string,
      accept: string,
      body: string,
      timeout: number,
      ontimeout: () => void,
      callback: (response: unknown) => void
    ): void
    parseJSON(resp: string): unknown
    serialize(obj: Record<string, unknown>, parentKey?: string): string
    appendParams(url: string, params: Record<string, unknown>): string
  }
}
