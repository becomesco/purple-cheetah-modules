import { Server } from 'socket.io';
import type {
  SocketConfig,
  SocketConnection,
  Socket as SocketType,
  SocketEventHandler,
  SocketQuery,
} from './types';
import type { Module } from '@becomes/purple-cheetah/types';
import { useLogger } from '@becomes/purple-cheetah';

const connections: { [id: string]: SocketConnection<unknown> } = {};
let Socket: SocketType;

export function createSocket(config: SocketConfig): Module {
  let eventHandlers: SocketEventHandler[] = [];
  if (config.eventHandlers) {
    eventHandlers = config.eventHandlers;
  }
  const logger = useLogger({ name: 'Socket' });
  let server: Server;

  Socket = {
    findConnection<T>(query: SocketQuery<T>): SocketConnection<T> | null {
      const ids = Object.keys(connections);
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const connection = connections[id] as SocketConnection<T>;
        if (query(connection)) {
          return connection;
        }
      }
      return null;
    },
    findConnections<T>(query: SocketQuery<T>): Array<SocketConnection<T>> {
      const output: Array<SocketConnection<T>> = [];
      const ids = Object.keys(connections);
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const connection = connections[id] as SocketConnection<T>;
        if (query(connection)) {
          output.push(connection);
        }
      }
      return output;
    },
    findConnectionById(id) {
      return Socket.findConnection((e) => e.id === id);
    },
    findConnectionsByScope(scope) {
      return Socket.findConnections((e) => e.scope === scope);
    },
    disconnect<T>(query: SocketQuery<T>) {
      const ids = Object.keys(connections);
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const connection = connections[id] as SocketConnection<T>;
        if (query(connection)) {
          connection.socket.disconnect(true);
          delete connections[id];
        }
      }
    },
    disconnectScope(scope) {
      Socket.disconnect((e) => e.scope === scope);
    },
    disconnectById(id: string) {
      return Socket.disconnect((e) => e.id === id);
    },
    emit<T>(emitConfig: {
      connectionId?: string;
      socketId?: string;
      eventName: string;
      eventData: T;
    }): boolean {
      let connection: SocketConnection<T> | null;
      if (emitConfig.connectionId) {
        connection = Socket.findConnectionById(emitConfig.connectionId);
      } else if (emitConfig.socketId) {
        connection = Socket.findConnection(
          (e) => e.socket.id === emitConfig.socketId,
        );
      } else {
        logger.warn('emit', 'Neither connectionID not socketID were provided.');
        return false;
      }
      if (!connection) {
        logger.warn('emit', {
          info: 'Connection does not exist',
          emit: emitConfig,
        });
        return false;
      }
      return connection.socket.emit(emitConfig.eventName, emitConfig.eventData);
    },
    emitToScope(emitConfig) {
      const cons = Socket.findConnections((e) => e.scope === emitConfig.scope);
      for (let i = 0; i < cons.length; i++) {
        if (!cons[i].socket.emit(emitConfig.eventName, emitConfig.eventData)) {
          return false;
        }
      }
      return true;
    },
  };

  return {
    name: 'Socket',
    initialize(moduleConfig) {
      server = new Server(moduleConfig.purpleCheetah.getServer(), {
        path: config.path,
        cookie: false,
        async allowRequest(req, callback) {
          logger.info('.allowConnection', 'Incoming connection...');
          if (!config.allowConnection) {
            callback(undefined, true);
            return;
          }
          if (!(await config.allowConnection(req))) {
            callback('Unauthorized', false);
            return;
          }
          callback(undefined, true);
        },
      });
      server.use(async (socket, next) => {
        if (config.verifyConnection) {
          if (!(await config.verifyConnection(socket))) {
            next(
              new Error(
                `Failed to verify connection for socket "${socket.id}".`,
              ),
            );
            return;
          }
        }
        next();
      });
      server.on('connection', async (socket) => {
        const connection = config.onConnection(socket);
        logger.info('.connection', `"${socket.id}" ---> "${connection.scope}"`);
        connections[connection.id] = connection;
        eventHandlers.forEach((eventHandler) => {
          connection.socket.on(eventHandler.name, async (message) => {
            await eventHandler.handler(message, connection);
          });
        });
        connection.socket.on('disconnect', () => {
          logger.info('', `"${socket.id}" has been disconnected.`);
          delete connections[connection.id];
        });
      });
    },
  };
}
export function useSocket(): SocketType {
  return { ...Socket };
}
