import { useState, type ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { generateSession } from '../utils';
import { SocketContext } from './socker.context';

interface Presence {
  username: string;
  position: number;
  clientId: string;
  lastActive: number;
}

interface PresenceEvent {
  event: 'presenceList';
  data: Presence[];
}

interface InitEvent {
  event: 'init';
  data: Document;
}

interface Document {
  content: string;
  revision: number;
}

interface Session {
  clientId: string;
  username: string;
}

export interface ThemeContextType {
  isConnected: boolean;
  presences: Presence[];
  session: Session | undefined;
  document: Document | undefined;
}

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [document, setDocument] = useState<Document | undefined>(undefined);
  const [presences, setPresences] = useState<Presence[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsEndpoint = import.meta.env.VITE_WS_ENDPOINT;
    const socket = new WebSocket(wsEndpoint);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected to backend');
      setIsConnected(true);
      const { username, clientId } = generateSession();
      socket.send(
        JSON.stringify({
          event: 'presence',
          data: {
            username,
            position: 0,
            clientId,
          },
        }),
      );
      setSession({
        username,
        clientId,
      });
    };

    socket.onmessage = (event) => {
      const eventData = JSON.parse(event.data) as PresenceEvent | InitEvent;
      console.log(event);
      switch (eventData.event) {
        case 'presenceList': {
          setPresences(eventData.data);
          break;
        }
        case 'init': {
          setDocument(event.data);
          break;
        }
        default:
      }
    };
    socket.onerror = (error) => {
      console.error('WebSocket connection error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
      setSession(undefined);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ presences, isConnected, session, document }}
    >
      {children}
    </SocketContext.Provider>
  );
};
