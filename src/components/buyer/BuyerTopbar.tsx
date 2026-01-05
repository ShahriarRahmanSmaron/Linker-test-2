import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Button } from '../ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';

export interface MenuItem {
    id: string;
    label: string;
    icon?: React.ElementType;
}

interface BuyerTopbarProps {
    activeView: string;
    onNavigate: (viewId: string) => void;
    menuItems: MenuItem[];
}

export const BuyerTopbar: React.FC<BuyerTopbarProps> = ({ activeView, onNavigate, menuItems }) => {
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="w-full bg-white border-b border-neutral-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left: Logo & Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-neutral-500"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-2xl tracking-tight">
                                <span className="text-[#2563EB]">Fab</span>
                                <span className="text-[#16A34A]">-Ai</span>
                            </span>
                        </div>
                    </div>

                    {/* Center: Navigation Links (Desktop) */}
                    <div className="hidden md:flex items-center space-x-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === item.id
                                    ? 'bg-neutral-100 text-neutral-900'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Right: User Info */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-sm font-medium text-neutral-900">
                            {user?.name || user?.email || 'Guest'}
                        </div>
                        <Button onClick={logout} className="bg-black text-white hover:bg-neutral-800">
                            Log out
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-neutral-200 bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id);
                                    setMobileMenuOpen(false);
                                }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${activeView === item.id
                                    ? 'bg-neutral-100 text-neutral-900'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {item.icon && <item.icon className="w-4 h-4" />}
                                    {item.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
