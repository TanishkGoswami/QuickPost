import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Header({ onMenuClick }) {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 h-16 fixed top-0 right-0 z-[39] left-0 lg:left-[240px] transition-all duration-300">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-50/50 border border-gray-100 shadow-sm">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black">
                {initials}
              </div>
            )}
            <span className="text-[12px] font-bold text-gray-700 max-w-[120px] truncate pr-1 hidden sm:block">
              {user.name || 'Account'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
