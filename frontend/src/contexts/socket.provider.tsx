import { useCallback, useState, type ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { generateSession } from '../utils';
import { SocketContext } from './socker.context';
import type { OTOperation } from '../types';

interface Presence {
  username: string;
  position: number;
  clientId: string;
  lastActive: number;
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
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  sendOp: (version: number, operations: OTOperation[]) => void;
  setOnOpReceived: (
    callback:
      | ((data: {
          version: number;
          operations: OTOperation[];
          clientId: string;
        }) => void)
      | null,
  ) => void;
  setOnAckReceived: (
    callback: ((data: { version: number }) => void) | null,
  ) => void;
  updatePresence: (position: number) => void;
}

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [document, setDocument] = useState<Document | undefined>(undefined);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [text, setText] = useState<string>('');
  const socketRef = useRef<WebSocket | null>(null);

  const onOpReceivedRef = useRef<((data: {
    version: number;
    operations: OTOperation[];
    clientId: string;
  }) => void) | null>(null);
  const onAckReceivedRef = useRef<((data: { version: number }) => void) | null>(null);

  const setOnOpReceived = useCallback(
    (
      cb: ((data: {
        version: number;
        operations: OTOperation[];
        clientId: string;
      }) => void) | null,
    ) => {
      onOpReceivedRef.current = cb;
    },
    [],
  );

  const setOnAckReceived = useCallback(
    (cb: ((data: { version: number }) => void) | null) => {
      onAckReceivedRef.current = cb;
    },
    [],
  );

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
      const eventData = JSON.parse(event.data);
      console.log('Received WebSocket message:', eventData);
      switch (eventData.event) {
        case 'presenceList': {
          setPresences(eventData.data);
          break;
        }
        case 'init': {
          setDocument(eventData.data);
          setText(eventData.data.content);
          break;
        }
        case 'operation': {
          onOpReceivedRef.current?.(eventData.data);
          break;
        }
        case 'ack': {
          onAckReceivedRef.current?.(eventData.data);
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

  const sendOp = useCallback(
    (version: number, operations: OTOperation[]) => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN &&
        session
      ) {
        socketRef.current.send(
          JSON.stringify({
            event: 'operation',
            data: {
              version,
              operations,
              clientId: session.clientId,
            },
          }),
        );
      }
    },
    [session],
  );

  const updatePresence = useCallback(
    (position: number) => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN &&
        session
      ) {
        socketRef.current.send(
          JSON.stringify({
            event: 'presence',
            data: {
              username: session.username,
              position,
              clientId: session.clientId,
            },
          }),
        );
      }
    },
    [session],
  );

  return (
    <SocketContext.Provider
      value={{
        presences,
        isConnected,
        session,
        document,
        text,
        setText,
        sendOp,
        setOnOpReceived,
        setOnAckReceived,
        updatePresence,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
