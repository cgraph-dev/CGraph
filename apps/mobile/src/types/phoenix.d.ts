// Phoenix WebSocket types
declare module 'phoenix' {
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
    connect(): void
    disconnect(callback?: () => void, code?: number, reason?: string): void
    isConnected(): boolean
    connectionState(): string
    channel(topic: string, chanParams?: Record<string, unknown>): Channel
    onOpen(callback: () => void): number
    onClose(callback: () => void): number
    onError(callback: (error: unknown) => void): number
    onMessage(callback: (msg: Record<string, unknown>) => void): number
    remove(channel: Channel): void
    push(data: unknown): void
    protocol(): string
    endPointURL(): string
  }

  export class Channel {
    constructor(topic: string, params?: Record<string, unknown>, socket?: Socket)
    join(timeout?: number): Push
    leave(timeout?: number): Push
    push(event: string, payload?: Record<string, unknown>, timeout?: number): Push
    on(event: string, callback: (payload?: unknown, ref?: string, joinRef?: string) => void): number
    off(event: string, ref?: number): void
    onClose(callback: (payload?: unknown, ref?: string, joinRef?: string) => void): void
    onError(callback: (reason?: string) => void): void
    rejoin(timeout?: number): void
    isMember(topic: string, event: string, payload?: unknown, joinRef?: string): boolean
    topic: string
    state: string
  }

  export class Push {
    constructor(channel: Channel, event: string, payload?: Record<string, unknown>, timeout?: number)
    resend(timeout: number): void
    send(): void
    receive(status: string, callback: (response?: unknown) => void): Push
  }

  export class Presence {
    constructor(channel: Channel, opts?: {
      events?: {
        state: string
        diff: string
      }
    })
    onJoin(callback: (key: string, current: unknown, newPres: unknown) => void): void
    onLeave(callback: (key: string, current: unknown, leftPres: unknown) => void): void
    onSync(callback: () => void): void
    list<T>(chooser?: (key: string, pres: unknown) => T): T[]
    inPendingSyncState(): boolean
    static syncState<T>(
      currentState: Record<string, T>,
      newState: Record<string, unknown>,
      onJoin?: (key: string, current: T | undefined, newPres: unknown) => void,
      onLeave?: (key: string, current: T | undefined, leftPres: unknown) => void
    ): Record<string, T>
    static syncDiff<T>(
      currentState: Record<string, T>,
      diff: { joins?: Record<string, unknown>; leaves?: Record<string, unknown> },
      onJoin?: (key: string, current: T | undefined, newPres: unknown) => void,
      onLeave?: (key: string, current: T | undefined, leftPres: unknown) => void
    ): Record<string, T>
    static list<T>(
      presences: Record<string, unknown>,
      chooser?: (key: string, pres: unknown) => T
    ): T[]
  }
}
