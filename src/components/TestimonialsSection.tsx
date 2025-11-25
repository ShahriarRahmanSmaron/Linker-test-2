import React from 'react';
import { TESTIMONIALS } from '../constants';
import { Star } from 'lucide-react';
import { Reveal } from './Reveal';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-neutral-50 dark:bg-neutral-800/30 border-t border-neutral-200 dark:border-neutral-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-3 sm:mb-4">
              What Sourcing Professionals Say
            </h2>
            <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
              Join 500+ fashion brands who have transformed their textile sourcing workflow.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 150} className="h-full">
              <div className="bg-white dark:bg-neutral-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 h-full flex flex-col hover:shadow-md hover:border-primary-500/30 dark:hover:border-primary-700/50 transition-all duration-300">
                {/* Stars */}
                <div className="flex space-x-1 mb-4 sm:mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="fill-warning-400 text-warning-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="flex-grow mb-6 sm:mb-8">
                  <p className="text-neutral-700 dark:text-neutral-300 text-base sm:text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </blockquote>

                {/* Divider */}
                <div className="w-full h-px bg-neutral-100 dark:bg-neutral-700 mb-4 sm:mb-6"></div>

                {/* Author */}
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-neutral-900 dark:bg-neutral-700 flex items-center justify-center text-white dark:text-neutral-200 font-semibold text-base sm:text-lg">
                    {testimonial.initials}
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <div className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">{testimonial.author}</div>
                    <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">{testimonial.role}</div>
                    <div className="text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mt-0.5">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};