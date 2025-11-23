
import React from 'react';
import { PRICING_TIERS } from '../constants';
import { Check } from 'lucide-react';
import { Reveal } from './Reveal';
import { useNavigate } from 'react-router-dom';

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-neutral-900 text-white relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-900/40 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">One Platform. Two Worlds.</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-lg font-light">
              Connect seamlessly whether you are sourcing the next big trend or manufacturing it.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {PRICING_TIERS.map((tier, index) => (
            <Reveal key={tier.title} delay={index * 200} className="h-full">
              <div className={`h-full p-8 rounded-2xl border backdrop-blur-sm flex flex-col transition-all duration-300 hover:translate-y-[-5px] ${tier.variant === 'buyer' ? 'bg-white/5 border-white/10 hover:border-primary-500/50 hover:bg-white/10' : 'bg-white/5 border-white/10 hover:border-accent-500/50 hover:bg-white/10'}`}>
                
                <h3 className={`text-2xl font-bold mb-2 ${tier.variant === 'buyer' ? 'text-white' : 'text-white'}`}>{tier.title}</h3>
                <div className="h-1 w-12 rounded bg-neutral-700 mb-8"></div>
                
                <ul className="space-y-4 mb-8 flex-1">
                    {tier.points.map((point, i) => (
                        <li key={i} className="flex items-start">
                            <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-0.5 ${tier.variant === 'buyer' ? 'bg-primary-900/50 text-primary-400' : 'bg-accent-900/50 text-accent-400'}`}>
                                <Check size={14} />
                            </div>
                            <span className="ml-3 text-neutral-300 font-light">{point.text}</span>
                        </li>
                    ))}
                </ul>

                <button 
                    onClick={() => navigate(tier.variant === 'buyer' ? '/login?role=buyer' : '/login?role=manufacturer')}
                    className={`w-full py-4 rounded-lg font-bold transition-all ${tier.variant === 'buyer' ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/50' : 'bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-900/50'}`}
                >
                    {tier.cta}
                </button>

              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
