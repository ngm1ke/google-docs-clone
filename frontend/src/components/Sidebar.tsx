import type { UserPresence } from '../types';
import { getAvatarColor } from '../utils';

export const Sidebar = () => {
  const presences: UserPresence[] = [];
  const clientId = '1';
  return (
    <>
      <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden lg:flex">
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            Active Collaborators ({presences.length})
          </h2>
          <div className="space-y-3">
            {presences.map((user) => {
              const color = getAvatarColor(user.clientId);
              const isSelf = user.clientId === clientId;

              return (
                <div
                  key={user.clientId}
                  className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div
                    style={{ backgroundColor: color }}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  >
                    {user.username.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {user.username}{' '}
                      {isSelf && (
                        <span className="text-blue-500 font-bold">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      Cursor: {user.position}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};
