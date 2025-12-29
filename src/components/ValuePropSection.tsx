
import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { VALUE_PROP_HIGHLIGHTS } from '../constants';
import { useNavigate } from 'react-router-dom';

export const ValuePropSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-50 dark:from-primary-900/20 to-accent-50 dark:to-accent-900/20 rounded-full opacity-40"></div>
              <h2 className="font-display relative text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white leading-tight tracking-tight mb-4 sm:mb-6">
                Tired of endless email threads, messy catalogs, and <span className="text-neutral-400 dark:text-neutral-500">flat fabric images?</span>
              </h2>
              <p className="relative text-base sm:text-lg font-light text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6 sm:mb-8">
                You don't need scattered folders, sample chaos, or outdated vendor lists. Our platform brings everything together — fabric visuals, technical details, and collaboration — in one clean digital experience.
              </p>
              <button onClick={() => navigate('/login?role=buyer')} className="relative inline-flex items-center font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                Start Exploring Fabrics <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:gap-4">
            <Reveal delay={200}>
              <div className="grid gap-3 sm:gap-4">
                {VALUE_PROP_HIGHLIGHTS.map((highlight, index) => (
                  <div
                    key={index}
                    className="group relative flex items-center p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer overflow-hidden"
                    style={{
                      transitionDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Animated background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-50/0 via-accent-50/0 to-primary-50/0 group-hover:from-primary-50/50 group-hover:via-accent-50/30 group-hover:to-primary-50/50 dark:group-hover:from-primary-900/20 dark:group-hover:via-accent-900/10 dark:group-hover:to-primary-900/20 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>

                    <div className="relative flex items-center w-full">
                      <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-neutral-700 rounded-full flex items-center justify-center text-accent-500 dark:text-accent-400 shadow-sm mr-3 sm:mr-4 group-hover:scale-110 group-hover:bg-accent-50 dark:group-hover:bg-accent-900/30 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-accent-300 dark:group-hover:ring-accent-700 transition-all duration-300 animate-pulse-slow">
                        <CheckCircle2 size={20} className="group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                      </div>
                      <span className="text-base sm:text-lg font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 relative z-10">{highlight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
