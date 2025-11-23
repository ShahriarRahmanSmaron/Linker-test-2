
import React from 'react';
import { Download, Share2, Check } from 'lucide-react';
import { Reveal } from './Reveal';
import { useNavigate } from 'react-router-dom';

export const MoodboardSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="moodboards" className="py-24 bg-neutral-50 overflow-hidden border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Content */}
          <div className="order-2 lg:order-1">
            <Reveal>
              <div className="text-sm font-bold text-accent-500 uppercase tracking-wider mb-2">Feature Highlight</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-6 tracking-tight">
                Moodboard Generator
              </h2>
              <p className="text-lg text-neutral-500 mb-8 leading-relaxed font-light">
                Select fabrics and export presentation-ready moodboards in seconds. Arranging collections for seasons has never been this fluid.
              </p>
            </Reveal>
            
            <ul className="space-y-4 mb-10">
              {[
                'Drag and drop rearrangement',
                'One-click PDF and PNG export',
                'Share live links with external stakeholders',
                'Version history for seasonal planning'
              ].map((item, idx) => (
                <Reveal key={idx} delay={idx * 100}>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-100 flex items-center justify-center mt-0.5">
                      <Check size={14} className="text-accent-600" />
                    </div>
                    <span className="ml-3 text-neutral-700 font-medium">{item}</span>
                  </li>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={500}>
              <button onClick={() => navigate('/login?role=buyer')} className="bg-neutral-900 text-white px-8 py-3.5 rounded-full font-bold hover:bg-neutral-800 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
                Start Moodboard
              </button>
            </Reveal>
          </div>

          {/* Right: Visual UI Mock */}
          <div className="order-1 lg:order-2 relative perspective-1000">
            <Reveal delay={200} className="transform transition-transform hover:rotate-0 duration-500 lg:rotate-y-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-100 to-accent-100 rounded-3xl transform -rotate-2 opacity-70"></div>
                <div className="relative bg-white/80 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 p-4 sm:p-6">
                
                {/* Fake Toolbar */}
                <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                    <div>
                    <h4 className="font-bold text-neutral-800">SS25 Essentials</h4>
                    <p className="text-xs text-neutral-400">Last edited 2m ago</p>
                    </div>
                    <div className="flex space-x-2">
                    <button className="p-2 bg-neutral-50 rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors"><Share2 size={16} /></button>
                    <button className="p-2 bg-primary-50 rounded-full text-primary-600 hover:bg-primary-100 transition-colors"><Download size={16} /></button>
                    </div>
                </div>

                {/* Masonry Grid Simulation */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <div className="bg-neutral-100 rounded-lg h-40 w-full overflow-hidden relative group cursor-pointer hover:shadow-md transition-shadow">
                            <div className="absolute inset-0 bg-warning-400/20 mix-blend-multiply"></div>
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-neutral-800">Mustard Pique</div>
                        </div>
                        <div className="bg-neutral-100 rounded-lg h-56 w-full overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow">
                            <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
                                {/* Abstract shape for mockup */}
                                <div className="w-24 h-32 bg-primary-200 rounded-t-3xl rounded-b-lg opacity-50"></div>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-neutral-800">Mockup: Polo</div>
                        </div>
                    </div>
                    
                    {/* Column 2 */}
                    <div className="space-y-4 pt-8">
                        <div className="bg-neutral-100 rounded-lg h-48 w-full overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow">
                            <div className="absolute inset-0 bg-accent-50 flex items-center justify-center">
                                <div className="w-20 h-20 bg-accent-200 rounded-full blur-xl opacity-60"></div>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-neutral-800">Sage Fleece</div>
                        </div>
                        <div className="bg-white border border-neutral-100 rounded-lg p-3 shadow-sm cursor-pointer hover:border-primary-200 transition-colors">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
                                <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                                <div className="w-4 h-4 bg-neutral-800 rounded-full"></div>
                            </div>
                            <div className="h-2 w-20 bg-neutral-100 rounded mb-1"></div>
                            <div className="h-2 w-12 bg-neutral-100 rounded"></div>
                        </div>
                    </div>
                </div>

                </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
};
