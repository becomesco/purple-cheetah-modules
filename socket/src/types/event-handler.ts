import type { SocketConnection } from './connection';

export interface SocketEventHandler {
  name: string;
  handler<T, K>(data: T, connection: SocketConnection<K>): Promise<void>;
}
