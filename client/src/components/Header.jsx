import React from 'react';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-60 right-0 z-10">
      <div className="h-full px-6 flex items-center justify-end">
        {/* User avatar + name — read only, sign out is in sidebar */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
          <span className="text-sm font-semibold text-gray-800 max-w-[120px] truncate">
            {user.name || 'Account'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
