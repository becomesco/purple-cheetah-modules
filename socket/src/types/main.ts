import type { Socket as Soc } from 'socket.io';
import type { SocketConnection } from './connection';
import type { IncomingMessage } from 'http';
import type { SocketEventHandler } from './event-handler';

export interface SocketConfig {
  path: string;
  onConnection<CustomProps>(socket: Soc): SocketConnection<CustomProps>;
  allowConnection?(request: IncomingMessage): Promise<boolean>;
  verifyConnection?(socket: Soc): Promise<boolean>;
  eventHandlers?: SocketEventHandler[];
}

export interface SocketQuery<T> {
  (connection: SocketConnection<T>): boolean;
}
export interface Socket {
  findConnection<T>(query: SocketQuery<T>): SocketConnection<T> | null;
  findConnections<T>(query: SocketQuery<T>): Array<SocketConnection<T>>;
  findConnectionById<T>(id: string): SocketConnection<T> | null;
  findConnectionsByScope<T>(scope: string): Array<SocketConnection<T>>;
  disconnectById(id: string): void;
  disconnect<T>(query: SocketQuery<T>): void;
  disconnectScope(scope: string): void;
  emit<T>(config: {
    connectionId?: string;
    socketId?: string;
    eventName: string;
    eventData: T;
  }): boolean;
  emitToScope<T>(config: {
    scope: string;
    eventName: string;
    eventData: T;
  }): boolean;
}
