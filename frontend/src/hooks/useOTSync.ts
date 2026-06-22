import { useRef, useEffect, useCallback } from 'react';
import type { OTOperation } from '../types';
import { applyAll, transformLists, adjustCursor } from '../utils/ot';
import { useDebounce } from './useDebounce';

interface Document {
  content: string;
  revision: number;
}

interface Session {
  clientId: string;
}

export function useOTSync(
  document: Document | undefined,
  session: Session | undefined,
  sendOp: (version: number, operations: OTOperation[]) => void,
  setOnAckReceived: (cb: ((data: { version: number }) => void) | null) => void,
  setOnOpReceived: (
    cb:
      | ((data: {
          version: number;
          operations: OTOperation[];
          clientId: string;
        }) => void)
      | null,
  ) => void,
  setText: React.Dispatch<React.SetStateAction<string>>,
) {
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);
  const oldTextRef = useRef<string>('');
  const revisionRef = useRef<number>(0);
  const outstandingRef = useRef<OTOperation[] | null>(null);
  const bufferRef = useRef<OTOperation[] | null>(null);
  const pendingOpsRef = useRef<OTOperation[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (document && !initializedRef.current) {
      oldTextRef.current = document.content;
      revisionRef.current = document.revision;
      initializedRef.current = true;
    }
  }, [document]);

  useEffect(() => {
    if (!session) return;

    setOnAckReceived((data) => {
      revisionRef.current = data.version;
      outstandingRef.current = null;

      if (bufferRef.current) {
        outstandingRef.current = bufferRef.current;
        bufferRef.current = null;
        sendOp(revisionRef.current, outstandingRef.current);
      }
    });

    setOnOpReceived((data) => {
      if (data.clientId === session.clientId) return;

      let transformedRemote = [...data.operations];

      if (outstandingRef.current) {
        const [tRemote, tOutstanding] = transformLists(
          transformedRemote,
          outstandingRef.current,
          data.clientId,
          session.clientId,
        );
        transformedRemote = tRemote;
        outstandingRef.current = tOutstanding;
      }

      if (bufferRef.current) {
        const [tRemote, tBuffer] = transformLists(
          transformedRemote,
          bufferRef.current,
          data.clientId,
          session.clientId,
        );
        transformedRemote = tRemote;
        bufferRef.current = tBuffer;
      }

      const textarea = textareaRef.current;
      if (textarea) {
        const cursorStart = textarea.selectionStart;
        const cursorEnd = textarea.selectionEnd;

        const newText = applyAll(oldTextRef.current, transformedRemote);
        const newCursorStart = adjustCursor(cursorStart, transformedRemote);
        const newCursorEnd = adjustCursor(cursorEnd, transformedRemote);

        setText(newText);
        oldTextRef.current = newText;

        setTimeout(() => {
          textarea.setSelectionRange(newCursorStart, newCursorEnd);
        }, 0);
      } else {
        const newText = applyAll(oldTextRef.current, transformedRemote);
        setText(newText);
        oldTextRef.current = newText;
      }

      revisionRef.current = data.version;
    });

    return () => {
      setOnAckReceived(null);
      setOnOpReceived(null);
    };
  }, [session, setOnAckReceived, setOnOpReceived, sendOp]);

  const flushOps = useCallback(() => {
    if (pendingOpsRef.current.length === 0) return;
    const ops = pendingOpsRef.current;
    pendingOpsRef.current = [];

    if (outstandingRef.current === null) {
      outstandingRef.current = ops;
      sendOp(revisionRef.current, ops);
    } else {
      if (bufferRef.current === null) {
        bufferRef.current = ops;
      } else {
        bufferRef.current = [...bufferRef.current, ...ops];
      }
    }
  }, [sendOp]);

  const debouncedFlush = useDebounce(flushOps, 300);

  return {
    textareaRef,
    oldTextRef,
    pendingOpsRef,
    revisionRef,
    debouncedFlush,
  };
}
