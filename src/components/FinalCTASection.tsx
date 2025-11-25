
import React from 'react';
import { Reveal } from './Reveal';
import { useNavigate } from 'react-router-dom';

export const FinalCTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 bg-primary-600 dark:bg-primary-700 relative overflow-hidden transition-colors">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full transform -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full transform translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <Reveal>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
            Transform the Way You Source and Showcase Knit Fabrics.
            </h2>
            <p className="text-primary-50 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto font-light">
            Join a growing network of fashion buyers and knit manufacturers redefining textile sourcing — faster, smarter, and visually inspiring.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
                onClick={() => navigate('/login?role=buyer')}
                className="bg-white text-primary-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-xl shadow-black/10 hover:bg-neutral-50 hover:scale-105 transition-all duration-200"
            >
                Explore Fabrics Now
            </button>
            <button 
                onClick={() => navigate('/login?role=manufacturer')}
                className="bg-transparent border border-white/40 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-white/10 hover:border-white transition-colors"
            >
                List Your Fabrics Today
            </button>
            </div>
        </Reveal>
      </div>
    </section>
  );
};
