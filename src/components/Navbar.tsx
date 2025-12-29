import React, { useState, useEffect } from 'react';
import { Menu, X, Layers, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Switch } from './ui/switch';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'How it works', id: 'how-it-works' },
    { label: 'Features', id: 'features' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'Comparison', id: 'benefits' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${isScrolled
        ? 'bg-white/80 backdrop-blur-lg shadow-sm py-3 border-b border-neutral-200/50'
        : 'bg-transparent py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className={`backdrop-blur-sm p-1.5 rounded-lg mr-2 transition-colors ${isScrolled
              ? 'bg-primary-50/80 dark:bg-primary-50/80 group-hover:bg-primary-100 dark:group-hover:bg-primary-100'
              : 'bg-primary-50/80 dark:bg-white/10 group-hover:bg-primary-100 dark:group-hover:bg-white/20'
              }`}>
              <Layers className={`h-6 w-6 transition-colors ${isScrolled ? 'text-primary-600' : 'text-primary-600 dark:text-white'
                }`} />
            </div>
            <span className={`font-display text-xl font-bold tracking-tight transition-colors ${isScrolled ? 'text-neutral-900 dark:text-white' : 'text-neutral-900 dark:text-white'
              }`}>
              <span className={isScrolled ? 'text-primary-600' : 'text-primary-600 dark:text-primary-300'}>Fab</span>
              <span className={isScrolled ? 'text-accent-500' : 'text-accent-500 dark:text-accent-400'}>-Ai</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`font-display text-sm font-medium transition-colors duration-200 ${isScrolled
                  ? 'text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400'
                  : 'text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-300'
                  }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Theme Toggle & CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun size={18} className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} />
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              <Moon size={18} className={theme === 'dark' ? 'text-neutral-300' : 'text-neutral-400'} />
            </div>
            <button
              onClick={() => navigate('/login?role=buyer')}
              className="font-display bg-primary-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
            >
              Explore Fabrics
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`transition-colors ${isScrolled
              ? 'text-neutral-500 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400'
              : 'text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-300'
              }`}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {
        isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 absolute w-full shadow-xl">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className="block w-full text-left px-3 py-3 text-base font-medium text-neutral-600 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sun size={18} className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Theme</span>
                    <Moon size={18} className={theme === 'dark' ? 'text-neutral-300' : 'text-neutral-400'} />
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
                <button
                  onClick={() => navigate('/login?role=buyer')}
                  className="w-full bg-primary-500 text-white px-4 py-3 rounded-lg text-base font-bold hover:bg-primary-600 transition-colors shadow-md"
                >
                  Explore Fabrics
                </button>
              </div>
            </div>
          </div>
        )
      }
    </nav >
  );
};