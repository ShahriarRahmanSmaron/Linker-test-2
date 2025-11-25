import React, { useState } from 'react';
import { FAQS } from '../constants';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Reveal } from './Reveal';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-neutral-900 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
            <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
            </div>
        </Reveal>
        
        <div className="space-y-3 sm:space-y-4">
          {FAQS.map((faq, index) => (
            <Reveal key={index} delay={index * 100}>
                <div 
                className={`bg-white dark:bg-neutral-800 rounded-lg border ${openIndex === index ? 'border-primary-200 dark:border-primary-700 shadow-md' : 'border-neutral-200 dark:border-neutral-700'} overflow-hidden transition-all duration-300`}
                >
                <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex justify-between items-center focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                >
                    <span className={`font-medium text-base sm:text-lg ${openIndex === index ? 'text-primary-700 dark:text-primary-400' : 'text-neutral-900 dark:text-white'}`}>{faq.question}</span>
                    {openIndex === index ? (
                    <ChevronUp className="text-primary-500 dark:text-primary-400 flex-shrink-0" size={20} />
                    ) : (
                    <ChevronDown className="text-neutral-400 dark:text-neutral-500 flex-shrink-0" size={20} />
                    )}
                </button>
                
                <div 
                    className={`px-4 sm:px-6 text-neutral-600 dark:text-neutral-300 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 pb-4 sm:pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <p className="text-sm sm:text-base leading-relaxed">{faq.answer}</p>
                </div>
                </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};