import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { PresenceService } from './presence.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import type { OperationMessage } from './types';
import { DocumentService } from './document.service';

@WebSocketGateway({ path: '/ws' })
// @UsePipes(new ValidationPipe({ whitelist: true }))
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly presenceService: PresenceService,
    private readonly documentService: DocumentService,
  ) {}

  private clientSocketMap = new Map<WebSocket, string>();

  @WebSocketServer()
  server: Server;

  handleConnection(client: WebSocket) {
    console.log('Client connected to WebSocket');
    client.send(
      JSON.stringify({
        event: 'init',
        data: this.documentService.getDocument(),
      }),
    );
  }

  handleDisconnect(client: WebSocket) {
    const clientId = this.clientSocketMap.get(client);
    console.log(`Client disconnected: ${clientId}`);
    if (clientId) {
      this.presenceService.removeClient(clientId);
      this.clientSocketMap.delete(client);
      this.broadcast('presenceList', this.presenceService.getAllPresences());
    }
  }

  @SubscribeMessage('operation')
  handleOperation(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: OperationMessage,
  ) {
    // TODO: validate operation
    console.log('Received operation:', data);

    // this.broadcast('operation', data, client);
    // TODO:
  }

  @SubscribeMessage('presence')
  handlePresence(
    @ConnectedSocket() client: WebSocket,
    @MessageBody()
    data: {
      username: string;
      position: number;
      clientId: string;
    },
  ) {
    console.log('Received presence update:', data);
    this.clientSocketMap.set(client, data.clientId);
    this.presenceService.updateCursor(
      data.clientId,
      data.username,
      data.position,
    );
    this.broadcast('presenceList', this.presenceService.getAllPresences());
  }

  private broadcast(event: string, data: any, excludeSocket?: WebSocket) {
    const payload = JSON.stringify({ event, data });
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== excludeSocket) {
        client.send(payload);
      }
    });
  }
}
