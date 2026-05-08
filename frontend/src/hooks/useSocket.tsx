import { useContext } from 'react';
import { SocketContext } from '../contexts/socker.context';

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('Must be used within a Provider');
  }
  return context;
}
