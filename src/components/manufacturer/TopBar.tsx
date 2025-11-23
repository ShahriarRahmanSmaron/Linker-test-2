import React from 'react';
import { Layers, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-accent-50 p-1.5 rounded-lg mr-2">
                <Layers className="h-5 w-5 text-accent-600" />
            </div>
            <span className="text-lg font-extrabold text-neutral-900 tracking-tight">
              <span className="text-primary-600">Link</span><span className="text-accent-500">ER</span>
              <span className="font-medium text-neutral-400 text-sm ml-1">| Manufacturer Console</span>
            </span>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-100">
                <div className="h-6 w-6 bg-accent-100 rounded-full flex items-center justify-center text-accent-700">
                    <User size={14} />
                </div>
                <span className="text-sm font-medium text-neutral-700">{user?.name || 'Masco Knits Ltd.'}</span>
            </div>
            <button 
                onClick={logout}
                className="text-neutral-400 hover:text-red-500 transition-colors p-2"
                title="Logout"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};