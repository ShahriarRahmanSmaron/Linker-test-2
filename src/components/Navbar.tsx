import React, { useState, useEffect } from 'react';
import { Menu, X, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-lg shadow-sm py-3 border-b border-neutral-200/50' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-primary-50/80 backdrop-blur-sm p-1.5 rounded-lg mr-2 group-hover:bg-primary-100 transition-colors">
                <Layers className="h-6 w-6 text-primary-600" />
            </div>
            <span className="text-xl font-extrabold text-neutral-900 tracking-tight">
              <span className="text-primary-600">Link</span><span className="text-accent-500">ER</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button
              onClick={() => navigate('/login?role=buyer')}
              className="bg-primary-500 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
            >
              Explore Fabrics
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-neutral-500 hover:text-primary-600 transition-colors">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-neutral-200 absolute w-full shadow-xl">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="block w-full text-left px-3 py-3 text-base font-medium text-neutral-600 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4">
              <button
                onClick={() => navigate('/login?role=buyer')}
                className="w-full bg-primary-500 text-white px-4 py-3 rounded-lg text-base font-bold hover:bg-primary-600 transition-colors shadow-md"
              >
                Explore Fabrics
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};