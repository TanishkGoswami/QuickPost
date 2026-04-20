import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';

function Header() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-64 right-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Page title or breadcrumb could go here */}
        <div></div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user.name}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
