import type { Socket } from 'socket.io';

export interface SocketConnection<CustomProps> {
  id: string;
  createdAt: number;
  scope: string;
  socket: Socket;
  props?: CustomProps;
}
