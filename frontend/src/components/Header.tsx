import { useSocket } from '../hooks/useSocket';

export const Header = () => {
  const { document, isConnected } = useSocket();
  const revision = document?.revision || 0;
  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Collaborative OT Document
            </h1>
            <div className="flex items-center space-x-2 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
              />
              <span className="text-slate-500 font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                Rev {revision}
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
