import { createContext } from 'react';
import type { ThemeContextType } from './socket.provider';

export const SocketContext = createContext<ThemeContextType | null>(null);
