import React from 'react';
import { COMPARISON_DATA } from '../constants';
import { CheckCircle, XCircle } from 'lucide-react';
import { Reveal } from './Reveal';

export const ComparisonSection: React.FC = () => {
  return (
    <section id="benefits" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">What Makes Us Different?</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto text-lg font-light">
               Compare the traditional workflow with our streamlined digital platform.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr>
                            <th className="py-4 px-6 text-left text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 w-1/3">Feature</th>
                            <th className="py-4 px-6 text-left text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 w-1/3">Traditional Sourcing</th>
                            <th className="py-4 px-6 text-left text-sm font-bold text-primary-600 uppercase tracking-wider border-b border-primary-100 w-1/3 bg-primary-50/30 rounded-t-lg">Our Platform</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COMPARISON_DATA.map((row, index) => (
                            <tr key={index} className="group hover:bg-neutral-50/50 transition-colors">
                                <td className="py-6 px-6 border-b border-neutral-100 text-neutral-900 font-bold">{row.feature}</td>
                                <td className="py-6 px-6 border-b border-neutral-100 text-neutral-500 font-light flex items-center">
                                    <XCircle size={18} className="text-red-300 mr-2 flex-shrink-0" /> {row.traditional}
                                </td>
                                <td className="py-6 px-6 border-b border-neutral-100 bg-primary-50/10 text-neutral-900 font-medium flex items-center relative">
                                    <div className="absolute inset-0 border-l border-primary-100 border-r pointer-events-none"></div>
                                    <CheckCircle size={18} className="text-primary-500 mr-2 flex-shrink-0" /> {row.platform}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Reveal>
      </div>
    </section>
  );
};