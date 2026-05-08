import { Injectable } from '@nestjs/common';

export interface UserPresence {
  clientId: string;
  username: string;
  position: number;
  lastActive: number;
}

@Injectable()
export class PresenceService {
  private presences: Map<string, UserPresence> = new Map();

  updateCursor(clientId: string, username: string, position: number) {
    this.presences.set(clientId, {
      clientId,
      username,
      position,
      lastActive: Date.now(),
    });
  }

  removeClient(clientId: string) {
    this.presences.delete(clientId);
  }

  getAllPresences(): UserPresence[] {
    return Array.from(this.presences.values());
  }
}
