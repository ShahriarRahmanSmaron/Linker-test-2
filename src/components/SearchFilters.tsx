
import React, { useState } from 'react';
import { FabricFilter } from '../types';
import { Filter, X, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface SearchFiltersProps {
  filters: FabricFilter;
  setFilters: React.Dispatch<React.SetStateAction<FabricFilter>>;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleChange = (key: keyof FabricFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ fabrication: '', type: '', gsmRange: '' });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Shared Options Helpers
  const renderFabricationOptions = () => (
    <>
      <option value="">All Fabrications</option>
      <option value="Single Jersey">Single Jersey</option>
      <option value="Pique">Pique</option>
      <option value="Fleece">Fleece</option>
      <option value="Rib">Rib</option>
      <option value="Interlock">Interlock</option>
      <option value="Terry">Terry</option>
      <option value="Mesh">Mesh</option>
      <option value="Thermal">Thermal</option>
    </>
  );

  const renderTypeOptions = () => (
    <>
      <option value="">All Types</option>
      <option value="Natural">Natural (Cotton, Wool...)</option>
      <option value="Synthetic">Synthetic (Poly, Nylon...)</option>
      <option value="Blend">Blends</option>
    </>
  );

  const renderGsmOptions = () => (
    <>
      <option value="">Any Weight</option>
      <option value="light">Lightweight (&lt;160 GSM)</option>
      <option value="medium">Midweight (160-240 GSM)</option>
      <option value="heavy">Heavyweight (&gt;240 GSM)</option>
    </>
  );

  return (
    <>
      {/* ==========================================
          DESKTOP VIEW: Horizontal Bar
         ========================================== */}
      <div className="hidden md:block bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center text-neutral-500 text-sm font-medium mr-2">
              <Filter size={16} className="mr-2" /> Filters:
            </div>

            <select
              value={filters.fabrication}
              onChange={(e) => handleChange('fabrication', e.target.value)}
              className="block pl-3 pr-8 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-neutral-50 hover:bg-white transition-colors cursor-pointer"
            >
              {renderFabricationOptions()}
            </select>

            <select
              value={filters.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="block pl-3 pr-8 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-neutral-50 hover:bg-white transition-colors cursor-pointer"
            >
              {renderTypeOptions()}
            </select>

            <select
              value={filters.gsmRange}
              onChange={(e) => handleChange('gsmRange', e.target.value)}
              className="block pl-3 pr-8 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-neutral-50 hover:bg-white transition-colors cursor-pointer"
            >
              {renderGsmOptions()}
            </select>

            {activeFilterCount > 0 && (
              <button 
                onClick={resetFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium ml-auto hover:underline transition-all"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          MOBILE VIEW: Sticky Trigger & Slide-over
         ========================================== */}
      
      {/* Sticky Mobile Trigger Bar */}
      <div className="md:hidden bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="text-sm font-medium text-neutral-600">
            {activeFilterCount > 0 ? (
                <span className="text-primary-600 font-bold">{activeFilterCount} filters active</span>
            ) : (
                'Filter results'
            )}
         </div>
         <button 
            onClick={() => setIsMobileOpen(true)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold border transition-all active:scale-95 ${
                activeFilterCount > 0 
                ? 'bg-primary-50 text-primary-700 border-primary-200' 
                : 'bg-white text-neutral-700 border-neutral-200'
            }`}
         >
            <SlidersHorizontal size={16} className="mr-2"/> Filters
            {activeFilterCount > 0 && (
                <span className="ml-2 bg-primary-600 text-white text-[10px] px-1.5 rounded-full h-4 flex items-center justify-center min-w-[16px]">
                    {activeFilterCount}
                </span>
            )}
         </button>
      </div>

      {/* Mobile Slide-over Modal */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm animate-fade-in" 
             onClick={() => setIsMobileOpen(false)}
           ></div>
           
           {/* Slide-in Panel */}
           <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col animate-fade-in">
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-neutral-100 bg-white">
                  <h2 className="text-lg font-bold text-neutral-900 flex items-center">
                    <Filter size={18} className="mr-2 text-primary-500"/> Filter Fabrics
                  </h2>
                  <button 
                    onClick={() => setIsMobileOpen(false)} 
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 rounded-full transition-colors"
                  >
                      <X size={20} />
                  </button>
              </div>
              
              {/* Body (Scrollable) */}
              <div className="p-6 space-y-8 overflow-y-auto flex-1 bg-white">
                 {/* Fabrication Group */}
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">Fabrication</label>
                    <div className="relative">
                        <select 
                            value={filters.fabrication}
                            onChange={(e) => handleChange('fabrication', e.target.value)}
                            className="block w-full p-3.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white appearance-none transition-all"
                        >
                            {renderFabricationOptions()}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>
                 </div>

                 {/* Type Group */}
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">Fiber Type</label>
                    <div className="relative">
                        <select 
                            value={filters.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="block w-full p-3.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white appearance-none transition-all"
                        >
                            {renderTypeOptions()}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>
                 </div>

                 {/* GSM Group */}
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">Weight (GSM)</label>
                    <div className="relative">
                        <select 
                            value={filters.gsmRange}
                            onChange={(e) => handleChange('gsmRange', e.target.value)}
                            className="block w-full p-3.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white appearance-none transition-all"
                        >
                            {renderGsmOptions()}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>
                 </div>
              </div>

              {/* Footer (Sticky) */}
              <div className="p-5 border-t border-neutral-100 bg-neutral-50/50">
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={resetFilters}
                        className="px-4 py-3.5 text-sm font-bold text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
                      >
                        Reset All
                      </button>
                      <button 
                         onClick={() => setIsMobileOpen(false)}
                         className="px-4 py-3.5 text-sm font-bold text-white bg-primary-600 rounded-xl shadow-lg shadow-primary-500/30 active:scale-95 transition-all"
                      >
                        Show Results
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};
