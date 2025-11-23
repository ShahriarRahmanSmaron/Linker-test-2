import React from 'react';
import { TESTIMONIALS } from '../constants';
import { Star } from 'lucide-react';
import { Reveal } from './Reveal';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              What Sourcing Professionals Say
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              Join 500+ fashion brands who have transformed their textile sourcing workflow.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 150} className="h-full">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 h-full flex flex-col hover:shadow-md hover:border-primary-500/30 transition-all duration-300">
                {/* Stars */}
                <div className="flex space-x-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} className="fill-warning-400 text-warning-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="flex-grow mb-8">
                  <p className="text-neutral-700 text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </blockquote>

                {/* Divider */}
                <div className="w-full h-px bg-neutral-100 mb-6"></div>

                {/* Author */}
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-neutral-900 flex items-center justify-center text-white font-semibold text-lg">
                    {testimonial.initials}
                  </div>
                  <div className="ml-4">
                    <div className="text-base font-bold text-neutral-900">{testimonial.author}</div>
                    <div className="text-sm text-neutral-500">{testimonial.role}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wider mt-0.5">{testimonial.company}</div>
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