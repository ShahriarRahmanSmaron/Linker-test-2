
import React, { useState } from 'react';
import { BUYER_STEPS, MANUFACTURER_STEPS } from '../constants';
import { Search, Shirt, LayoutTemplate, Upload, Zap, Globe, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { useNavigate } from 'react-router-dom';

export const HowItWorksSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'buyer' | 'manufacturer'>('buyer');

  const getIcon = (name: string) => {
    switch (name) {
      case 'Search': return <Search size={32} className="text-primary-500" />;
      case 'Shirt': return <Shirt size={32} className="text-primary-500" />;
      case 'LayoutTemplate': return <LayoutTemplate size={32} className="text-primary-500" />;
      case 'Upload': return <Upload size={32} className="text-accent-500" />;
      case 'Zap': return <Zap size={32} className="text-accent-500" />;
      case 'Globe': return <Globe size={32} className="text-accent-500" />;
      default: return null;
    }
  };

  const steps = activeTab === 'buyer' ? BUYER_STEPS : MANUFACTURER_STEPS;
  const colorClass = activeTab === 'buyer' ? 'text-primary-600' : 'text-accent-500';
  const bgClass = activeTab === 'buyer' ? 'bg-primary-50' : 'bg-accent-50';
  const buttonClass = activeTab === 'buyer' ? 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/30' : 'bg-accent-500 hover:bg-accent-600 shadow-accent-500/30';

  return (
    <section id="how-it-works" className="py-24 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-sm text-primary-600 font-bold tracking-wide uppercase mb-2">Workflow</h2>
            <p className="text-3xl md:text-4xl leading-tight font-extrabold text-neutral-900 tracking-tight">
              One Platform. Two Worlds.
            </p>
            
            {/* Toggle */}
            <div className="flex justify-center mt-8">
              <div className="bg-white p-1 rounded-full border border-neutral-200 shadow-sm inline-flex relative">
                <div 
                  className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out shadow-sm ${activeTab === 'buyer' ? 'left-1 w-[140px] bg-primary-500' : 'left-[145px] w-[180px] bg-accent-500'}`}
                ></div>
                <button 
                  onClick={() => setActiveTab('buyer')}
                  className={`relative px-8 py-2 rounded-full text-sm font-bold transition-colors z-10 w-[140px] ${activeTab === 'buyer' ? 'text-white' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  I'm a Buyer
                </button>
                <button 
                  onClick={() => setActiveTab('manufacturer')}
                  className={`relative px-8 py-2 rounded-full text-sm font-bold transition-colors z-10 w-[180px] ${activeTab === 'manufacturer' ? 'text-white' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  I'm a Manufacturer
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-12 relative mt-16">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-neutral-200 -z-10"></div>

          {steps.map((step, index) => (
            <Reveal key={`${activeTab}-${step.id}`} delay={index * 150} className="flex flex-col items-center text-center group">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-md bg-white border border-neutral-100 transition-all duration-300 ease-out`}>
                {getIcon(step.iconName)}
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">{step.title}</h3>
              <p className="text-neutral-500 leading-relaxed font-light px-4">{step.description}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={500}>
          <div className="mt-20 text-center">
             <button 
                onClick={() => navigate(activeTab === 'buyer' ? '/login?role=buyer' : '/login?role=manufacturer')}
                className={`px-8 py-3 text-white rounded-full font-bold shadow-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center mx-auto ${buttonClass}`}
              >
                {activeTab === 'buyer' ? 'Explore as Buyer' : 'Register as Manufacturer'} 
                <ArrowRight size={18} className="ml-2" />
              </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
