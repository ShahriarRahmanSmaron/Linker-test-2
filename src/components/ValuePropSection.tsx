
import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { VALUE_PROP_HIGHLIGHTS } from '../constants';
import { useNavigate } from 'react-router-dom';

export const ValuePropSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-white border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-full blur-3xl opacity-40"></div>
              <h2 className="relative text-3xl md:text-4xl font-extrabold text-neutral-900 leading-tight tracking-tight mb-6">
                Tired of endless email threads, messy catalogs, and <span className="text-neutral-400">flat fabric images?</span>
              </h2>
              <p className="relative text-lg font-light text-neutral-600 leading-relaxed mb-8">
                You don’t need scattered folders, sample chaos, or outdated vendor lists. Our platform brings everything together — fabric visuals, technical details, and collaboration — in one clean digital experience.
              </p>
              <button onClick={() => navigate('/login?role=buyer')} className="relative inline-flex items-center font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Start Exploring Fabrics <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="grid gap-4">
              {VALUE_PROP_HIGHLIGHTS.map((highlight, index) => (
                <div key={index} className="flex items-center p-4 bg-neutral-50 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-200">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center text-accent-500 shadow-sm mr-4">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-lg font-medium text-neutral-800">{highlight}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
