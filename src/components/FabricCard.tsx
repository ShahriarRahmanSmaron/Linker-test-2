
import React from 'react';
import { Fabric } from '../types';
import { Shirt, Presentation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FabricCardProps {
  fabric: Fabric;
}

export const FabricCard: React.FC<FabricCardProps> = ({ fabric }) => {
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/login?role=buyer');
  };

  return (
    <div className="group relative bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 transition-all duration-300 ease-out flex flex-col h-full hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-700">

      {/* Visual Swatch Area - Responsive height */}
      <div className="relative h-[160px] sm:h-[200px] bg-neutral-100 overflow-hidden rounded-t-xl cursor-pointer group/swatch" onClick={handleAction}>
        {/* Fabric Pattern / Color */}
        <div
          className="absolute inset-0 opacity-90 mix-blend-multiply transition-transform duration-700 ease-in-out group-hover/swatch:scale-110"
          style={{ backgroundColor: fabric.color }}
        ></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-20 transition-transform duration-700 ease-in-out group-hover/swatch:scale-110"></div>

        {/* Gradient Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/swatch:opacity-100 transition-opacity duration-300"></div>

        {/* Action Buttons - Always visible on mobile, hover on desktop */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover/swatch:opacity-100 transition-all duration-300 translate-y-0 md:translate-y-2 md:group-hover/swatch:translate-y-0 z-10">
          <button
            onClick={handleAction}
            className="bg-white text-neutral-900 p-3 rounded-full shadow-lg hover:bg-primary-50 hover:text-primary-600 transition-all hover:scale-110 active:scale-95 flex items-center justify-center touch-manipulation"
            title="View Mockup"
          >
            <Shirt size={18} />
          </button>

          <button
            onClick={handleAction}
            className="bg-white text-neutral-900 p-3 rounded-full shadow-lg hover:bg-primary-50 hover:text-primary-600 transition-all hover:scale-110 active:scale-95 flex items-center justify-center touch-manipulation"
            title="Add to Moodboard"
          >
            <Presentation size={18} />
          </button>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate w-full group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200" title={fabric.name}>{fabric.name}</h3>
        </div>

        <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 flex items-center flex-wrap gap-1 sm:gap-2">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 sm:py-1 rounded text-xs">{fabric.fabrication}</span>
          <span>{fabric.gsm} GSM</span>
        </div>
      </div>
    </div>
  );
};
