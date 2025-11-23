import React from 'react';
import { Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-neutral-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          
          <div className="flex items-center mb-6 md:mb-0">
            <div className="bg-primary-50 p-2 rounded-lg mr-3">
                <Layers className="h-6 w-6 text-primary-600" />
            </div>
            <span className="text-xl font-extrabold text-neutral-900 tracking-tight">
              <span className="text-primary-600">Link</span><span className="text-accent-500">ER</span>
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-neutral-500">
            <a href="#" className="hover:text-primary-600 transition-colors">About</a>
            <a href="#" className="hover:text-primary-600 transition-colors">FAQs</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
            <button onClick={() => navigate('/login')} className="hover:text-primary-600 transition-colors">Login</button>
            <button onClick={() => navigate('/login')} className="hover:text-primary-600 transition-colors">Register</button>
          </div>
        </div>
        
        <div className="mt-12 border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center">
           <div className="text-xs text-neutral-400 font-medium mb-2 md:mb-0">
             Trusted by buyers from global brands
           </div>
           <div className="text-xs text-neutral-400">
             &copy; {new Date().getFullYear()} LinkER Platform. All rights reserved.
           </div>
        </div>
      </div>
    </footer>
  );
};