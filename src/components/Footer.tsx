import React from 'react';
import { Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 pt-12 sm:pt-16 pb-8 sm:pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          
          <div className="flex items-center mb-6 md:mb-0">
            <div className="bg-primary-50 dark:bg-primary-900/50 p-2 rounded-lg mr-3">
                <Layers className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              <span className="text-primary-600 dark:text-primary-400">Link</span><span className="text-accent-500 dark:text-accent-400">ER</span>
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About</a>
            <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">FAQs</a>
            <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact</a>
            <button onClick={() => navigate('/login')} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Login</button>
            <button onClick={() => navigate('/login')} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Register</button>
          </div>
        </div>
        
        <div className="mt-8 sm:mt-12 border-t border-neutral-100 dark:border-neutral-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-xs text-neutral-400 dark:text-neutral-500 font-medium text-center md:text-left">
             Trusted by buyers from global brands
           </div>
           <div className="text-xs text-neutral-400 dark:text-neutral-500 text-center md:text-right">
             &copy; {new Date().getFullYear()} LinkER Platform. All rights reserved.
           </div>
        </div>
      </div>
    </footer>
  );
};