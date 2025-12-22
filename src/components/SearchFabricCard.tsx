
import React from 'react';
import { Fabric } from '../types';
import { Shirt, Presentation, Check } from 'lucide-react';

interface SearchFabricCardProps {
  fabric: Fabric;
  isSelected: boolean;
  onToggleSelect: (fabric: Fabric) => void;
  onOpenMockup: (fabric: Fabric) => void;
  onOpenTechpack: (fabric: Fabric) => void;
}

export const SearchFabricCard: React.FC<SearchFabricCardProps> = ({
  fabric,
  isSelected,
  onToggleSelect,
  onOpenMockup,
  onOpenTechpack
}) => {
  const fabricName = fabric.name || fabric.ref;
  const fabricGsm = typeof fabric.gsm === 'string' ? fabric.gsm : `${fabric.gsm}`;

  return (
    <div className={`group relative bg-white rounded-xl shadow-sm border transition-all duration-300 ease-out flex flex-col h-full hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] ${isSelected ? 'ring-2 ring-primary-500 border-transparent' : 'border-neutral-200 hover:border-primary-200'}`}>

      {/* Visual Swatch Area - Responsive height */}
      <div
        className="relative h-[160px] sm:h-[200px] bg-neutral-100 overflow-hidden rounded-t-xl cursor-pointer group/swatch"
      >
        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-3 left-3 bg-primary-600 text-white p-1.5 rounded-full shadow-lg z-20 animate-fade-in border-2 border-white">
            <Check size={14} strokeWidth={3} />
          </div>
        )}

        {/* Fabric Swatch Image or Fallback */}
        {fabric.swatchUrl ? (
          <>
            <img
              src={fabric.swatchUrl}
              alt={fabricName}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover/swatch:scale-110"
              onError={(e) => {
                // Fallback to color if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Gradient Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/swatch:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <>
            {/* Fallback: Color Block with Pattern */}
            <div
              className="absolute inset-0 opacity-90 mix-blend-multiply transition-transform duration-700 ease-in-out group-hover/swatch:scale-110"
              style={{ backgroundColor: fabric.color || '#9CA3AF' }}
            ></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-20 transition-transform duration-700 ease-in-out group-hover/swatch:scale-110"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/swatch:opacity-100 transition-opacity duration-300"></div>
          </>
        )}

        {/* Action Buttons - Always visible on mobile, hover on desktop */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover/swatch:opacity-100 transition-all duration-300 translate-y-0 md:translate-y-2 md:group-hover/swatch:translate-y-0 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenMockup(fabric); }}
            className="bg-white text-neutral-900 p-3 rounded-full shadow-lg hover:bg-primary-50 hover:text-primary-600 transition-all hover:scale-110 active:scale-95 flex items-center justify-center touch-manipulation"
            title="View Mockup"
          >
            <Shirt size={18} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(fabric); }}
            className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center touch-manipulation ${isSelected ? 'bg-primary-600 text-white' : 'bg-white text-neutral-900 hover:bg-primary-50 hover:text-primary-600'}`}
            title={isSelected ? "Remove from Moodboard" : "Add to Moodboard"}
          >
            <Presentation size={18} />
          </button>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="flex flex-col gap-1 sm:gap-2">
          <p className="text-xs sm:text-sm font-medium text-neutral-900 leading-relaxed" style={{ fontFamily: 'inherit' }}>
            {fabric.fabrication || fabric.group_name}
          </p>
          {fabric.style && fabric.style !== 'N/A' && (
            <span className="text-xs text-neutral-500">{fabric.style}</span>
          )}
        </div>
      </div>
    </div>
  );
};
