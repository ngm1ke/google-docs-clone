import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketGateway } from './modules/websocket/websocket.gateway';
import { PresenceService } from './modules/websocket/presence.service';
import { DocumentService } from './modules/websocket/document.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PresenceService, DocumentService, WebsocketGateway],
})
export class AppModule {}
