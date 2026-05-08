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
import type { OperationMessage } from './types';
import { DocumentService } from './document.service';
import { transformLists } from './ot';

@WebSocketGateway({ path: '/ws' })
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
    console.log('Received operation:', data);
    const { version, operations, clientId } = data;

    // Transform incoming operations
    let transformedOps = [...operations];
    const concurrentHistory = this.documentService.getHistorySince(version);

    for (const historyItem of concurrentHistory) {
      if (historyItem.clientId === clientId) {
        continue;
      }
      [transformedOps] = transformLists(
        transformedOps,
        historyItem.operations,
        clientId,
        historyItem.clientId,
      );
    }

    this.documentService.applyOperations(transformedOps);
    const newVersion = this.documentService.incrementRevision();

    this.documentService.addHistory(newVersion, transformedOps, clientId);

    client.send(
      JSON.stringify({
        event: 'ack',
        data: {
          version: newVersion,
        },
      }),
    );

    this.broadcast(
      'operation',
      {
        version: newVersion,
        operations: transformedOps,
        clientId,
      },
      client,
    );
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

  private broadcast(event: string, data: unknown, excludeSocket?: WebSocket) {
    const payload = JSON.stringify({ event, data });
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== excludeSocket) {
        client.send(payload);
      }
    });
  }
}
