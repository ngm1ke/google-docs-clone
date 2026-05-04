import { useRef } from 'react';
import { Sidebar } from '../components/Sidebar';

export const Editor = () => {
  const text = '';
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);
  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 overflow-y-auto flex justify-center bg-slate-100">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-md border border-slate-200 flex flex-col p-8 md:p-12 min-h-[500px]">
            <textarea
              ref={textareaRef}
              value={text}
              className="w-full flex-1 resize-none outline-none border-none font-mono text-base text-slate-800 leading-relaxed placeholder-slate-300"
              placeholder="Start typing your collaborative masterpiece here..."
              spellCheck={false}
            />
          </div>
        </main>
      </div>
    </>
  );
};
