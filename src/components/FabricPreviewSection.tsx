
import React from 'react';
import { MOCK_FABRICS } from '../constants';
import { FabricCard } from './FabricCard';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { useNavigate } from 'react-router-dom';

export const FabricPreviewSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="max-w-2xl">
              <div className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-2">Feature Highlight</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">Fabric-to-Mockup Engine</h2>
              <p className="mt-4 text-lg text-neutral-500 font-light">
                Converts plain fabric images into garment visuals instantly. See how fabrics behave on real silhouettes before you sample.
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <button 
                  onClick={() => navigate('/login?role=buyer')}
                  className="inline-flex items-center text-primary-600 font-bold hover:text-primary-700 transition-colors group"
              >
                View Fabric Library <ArrowRight size={20} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_FABRICS.slice(0, 4).map((fabric, index) => (
            <Reveal key={fabric.id} delay={index * 100} className="h-full">
              <FabricCard fabric={fabric} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
