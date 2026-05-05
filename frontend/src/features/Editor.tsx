import { useRef, useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';

// Define the normal operation structures
export interface InsertOperation {
  type: 'insert';
  position: number;
  text: string;
}

export interface DeleteOperation {
  type: 'delete';
  position: number;
  length: number;
}

export type OTOperation = InsertOperation | DeleteOperation;

interface LoggedOperation {
  id: string;
  timestamp: string;
  type: string;
  op: OTOperation[];
}

export const Editor = () => {
  const [text, setText] = useState('');
  const [opHistories, setOpHistories] = useState<LoggedOperation[]>([]);
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);
  const oldTextRef = useRef<string>('');

  // Store selection state before change occurs
  const selectionBeforeChange = useRef({ start: 0, end: 0 });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    selectionBeforeChange.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  };

  const handleInput = (e: React.InputEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent;
    const textarea = e.currentTarget;

    const newText = textarea.value;
    const currentCursor = textarea.selectionStart;
    const inputType = nativeEvent.inputType;
    const oldText = oldTextRef.current;

    const { start: startSelection, end: endSelection } =
      selectionBeforeChange.current;
    const isSelection = startSelection != endSelection;
    const deletedTextWhenSelection = oldText.slice(
      startSelection,
      endSelection,
    );
    
    console.log({
      newValue: newText,
      currentCursor,
      inputType,
      oldText,
      isSelection,
      deletedTextWhenSelection,
    });
    let op: OTOperation[] = [];
    switch (inputType) {
      case 'insertText': {
        const addedText = newText.charAt(currentCursor - 1);
        if (isSelection) {
          op = [
            {
              type: 'delete',
              position: startSelection,
              length: endSelection - startSelection,
            },
            {
              type: 'insert',
              position: currentCursor - 1,
              text: addedText,
            },
          ];
        } else {
          op = [
            {
              type: 'insert',
              position: currentCursor - 1,
              text: addedText,
            },
          ];
        }

        break;
      }
      case 'insertLineBreak': {
        const addedText = newText.charAt(currentCursor - 1);
        if (isSelection) {
          op = [
            {
              type: 'delete',
              position: startSelection,
              length: endSelection - startSelection,
            },
            {
              type: 'insert',
              position: currentCursor - 1,
              text: addedText,
            },
          ];
        } else {
          op = [
            {
              type: 'insert',
              position: currentCursor - 1,
              text: addedText,
            },
          ];
        }
        break;
      }
      case 'insertFromPaste': {
        const addedLength = newText.length - oldText.length;
        const addedText = newText.slice(
          currentCursor - addedLength,
          currentCursor,
        );
        if (isSelection) {
          op = [
            {
              type: 'delete',
              position: startSelection,
              length: endSelection - startSelection,
            },
            {
              type: 'insert',
              position: currentCursor - addedLength,
              text: addedText,
            },
          ];
        } else {
          op = [
            {
              type: 'insert',
              position: currentCursor - addedLength,
              text: addedText,
            },
          ];
        }

        break;
      }
      case 'deleteContentBackward': {
        if (isSelection) {
          op = [
            {
              type: 'delete',
              position: startSelection,
              length: endSelection - startSelection,
            },
          ];
        } else {
          op = [
            {
              type: 'delete',
              position: currentCursor + 1,
              length: 1,
            },
          ];
        }

        break;
      }
      case 'historyUndo': {
        window.alert(inputType + ' is not supported');
        break;
      }
      default:
        window.alert(inputType + ' is not supported');
        return;
    }
    console.log(op);
    setText(e.currentTarget.value);
    oldTextRef.current = e.currentTarget.value;
    if (op.length > 0) {
      const newLog: LoggedOperation = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: inputType,
        op,
      };
      setOpHistories((prev) => [newLog, ...prev].slice(0, 100));
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 bg-slate-100">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col p-8 min-h-[500px]">
          <textarea
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            value={text}
            className="w-full flex-1 resize-none outline-none border-none font-mono text-base text-slate-800 leading-relaxed placeholder-slate-300"
            placeholder="Start typing your collaborative masterpiece here..."
            spellCheck={false}
          />
        </div>

        <section className="w-full md:w-96 bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-sm max-h-[600px] overflow-hidden">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <span className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
              OT Operations
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {opHistories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mb-2 stroke-current opacity-70"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <p className="text-xs font-semibold text-center">
                  Type in the editor to see
                </p>
                <p className="text-[10px] text-center">
                  OT operations generated in real-time
                </p>
              </div>
            ) : (
              opHistories.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.timestamp}
                    </span>
                  </div>
                  <pre className="font-mono bg-slate-900 text-emerald-400 p-2.5 rounded overflow-x-auto select-all text-[11px] shadow-inner max-h-36">
                    {JSON.stringify(item.op, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
