import React from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { Reveal } from './Reveal';

export const TeamsBenefitsSection: React.FC = () => {
  return (
    <section id="benefits" className="py-24 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Built for modern sourcing teams</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
              We are replacing the fragmented, manual process of fabric selection with a single source of truth.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-20">

          {/* The Old Way */}
          <Reveal delay={100} className="h-full">
            <div className="bg-neutral-800/50 rounded-2xl p-8 border border-neutral-800 h-full hover:bg-neutral-800 transition-colors">
              <h3 className="text-xl font-semibold text-red-400 mb-6 flex items-center">
                <XCircle className="mr-2" /> The Old Way
              </h3>
              <ul className="space-y-4">
                {['Guessing how raw fabric swatches will drape.', 'Managing hundreds of heavy physical swatches.', 'Endless email threads with suppliers.', 'Manually building PowerPoint decks.'].map((item, i) => (
                  <li key={i} className="flex items-start text-neutral-300">
                    <span className="mr-3 mt-2 w-1.5 h-1.5 bg-neutral-600 rounded-full flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* The New Way */}
          <Reveal delay={300} className="h-full">
            <div className="bg-gradient-to-br from-primary-900/50 to-neutral-800 rounded-2xl p-8 border border-primary-900/50 relative overflow-hidden h-full hover:border-primary-800 transition-colors group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 blur-[100px] opacity-20 rounded-full group-hover:opacity-30 transition-opacity"></div>
              <h3 className="text-xl font-semibold text-primary-400 mb-6 flex items-center relative z-10">
                <CheckCircle className="mr-2" /> The Fab-Ai Way
              </h3>
              <ul className="space-y-4 relative z-10">
                {['Visualize fabric, mockups, and techpacks in one dashboard.', 'Shortlist and compare mills digitally.', 'Keep design, sourcing, and merchandising aligned.', 'Export production-ready data directly to PLM.'].map((item, i) => (
                  <li key={i} className="flex items-start text-white">
                    <span className="mr-3 mt-2 w-1.5 h-1.5 bg-primary-400 rounded-full flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

        </div>

        {/* Trust Signals */}
        <Reveal delay={500}>
          <div className="border-t border-neutral-800 pt-12">
            <p className="text-center text-sm text-neutral-500 mb-8 uppercase tracking-widest font-medium">Trusted by sourcing teams at</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {['FASHION GRP', 'NORDIC STYLE', 'EURO WEAR', 'URBAN THREADS', 'GLOBAL KNITS'].map((logo) => (
                <div key={logo} className="h-8 bg-neutral-700 w-32 rounded flex items-center justify-center text-xs font-bold text-neutral-400">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
};