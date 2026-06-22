import { useState, useEffect, useCallback } from 'react';
import { getCaretCoordinates } from '../utils/ot';
import { getAvatarColor } from '../utils';

interface RemoteCursor {
  clientId: string;
  username: string;
  top: number;
  left: number;
  color: string;
}

interface Presence {
  clientId: string;
  username: string;
  position: number;
}

interface Session {
  clientId: string;
}

export function useRemoteCursors(
  presences: Presence[],
  session: Session | undefined,
  text: string,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
) {
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);

  const updateRemoteCursorCoordinates = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !session) return;

    const coords = presences
      .filter((p) => p.clientId !== session.clientId)
      .map((p) => {
        const pos = Math.max(0, Math.min(p.position, textarea.value.length));
        try {
          const { top, left } = getCaretCoordinates(textarea, pos);
          if (isNaN(top) || isNaN(left)) return null;

          return {
            clientId: p.clientId,
            username: p.username,
            top,
            left,
            color: getAvatarColor(p.clientId),
          };
        } catch (e) {
          console.error('Error computing cursor:', e);
          return null;
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    setRemoteCursors(coords);
  }, [presences, session, textareaRef]);

  useEffect(() => {
    updateRemoteCursorCoordinates();
  }, [presences, text]);

  useEffect(() => {
    window.addEventListener('resize', updateRemoteCursorCoordinates);
    return () => {
      window.removeEventListener('resize', updateRemoteCursorCoordinates);
    };
  }, [updateRemoteCursorCoordinates]);

  return { remoteCursors, updateRemoteCursorCoordinates };
}
