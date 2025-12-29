import React from 'react';
import { COMPARISON_DATA } from '../constants';
import { CheckCircle, XCircle } from 'lucide-react';
import { Reveal } from './Reveal';

export const ComparisonSection: React.FC = () => {
  return (
    <section id="benefits" className="py-16 sm:py-24 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4 tracking-tight">What Makes Us Different?</h2>
            <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto font-light">
               Compare the traditional workflow with our streamlined digital platform.
            </p>
          </div>
        </Reveal>

        <Reveal>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[600px] sm:min-w-[800px] border-collapse">
                    <thead>
                        <tr>
                            <th className="py-3 sm:py-4 px-4 sm:px-6 text-left text-xs sm:text-sm font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 w-1/3">Feature</th>
                            <th className="py-3 sm:py-4 px-4 sm:px-6 text-left text-xs sm:text-sm font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 w-1/3">Traditional Sourcing</th>
                            <th className="py-3 sm:py-4 px-4 sm:px-6 text-left text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider border-b border-primary-100 dark:border-primary-900 w-1/3 bg-primary-50/30 dark:bg-primary-900/20 rounded-t-lg">Our Platform</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COMPARISON_DATA.map((row, index) => (
                            <tr key={index} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-[background-color] duration-150">
                                <td className="py-4 sm:py-6 px-4 sm:px-6 border-b border-neutral-100 dark:border-neutral-800 text-sm sm:text-base text-neutral-900 dark:text-white font-bold">{row.feature}</td>
                                <td className="py-4 sm:py-6 px-4 sm:px-6 border-b border-neutral-100 dark:border-neutral-800 text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-light flex items-center">
                                    <XCircle size={16} className="text-red-300 dark:text-red-500 mr-2 flex-shrink-0" /> {row.traditional}
                                </td>
                                <td className="py-4 sm:py-6 px-4 sm:px-6 border-b border-neutral-100 dark:border-neutral-800 bg-primary-50/10 dark:bg-primary-900/10 text-sm sm:text-base text-neutral-900 dark:text-white font-medium flex items-center relative">
                                    <div className="absolute inset-0 border-l border-primary-100 dark:border-primary-900 border-r pointer-events-none"></div>
                                    <CheckCircle size={16} className="text-primary-500 dark:text-primary-400 mr-2 flex-shrink-0" /> {row.platform}
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