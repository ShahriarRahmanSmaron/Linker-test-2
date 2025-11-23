
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
    <div className="group relative bg-white rounded-xl shadow-sm border border-neutral-200 transition-all duration-300 ease-out flex flex-col h-full hover:shadow-xl hover:-translate-y-1 hover:border-primary-200">
      
      {/* Visual Swatch Area - Height set to 200px */}
      <div className="relative h-[200px] bg-neutral-100 overflow-hidden rounded-t-xl cursor-pointer group/swatch" onClick={handleAction}>
        {/* Fabric Pattern / Color */}
        <div
          className="absolute inset-0 opacity-90 mix-blend-multiply transition-transform duration-700 ease-in-out group-hover/swatch:scale-110"
          style={{ backgroundColor: fabric.color }}
        ></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-20 transition-transform duration-700 ease-in-out group-hover/swatch:scale-110"></div>
        
        {/* Gradient Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/swatch:opacity-100 transition-opacity duration-300"></div>

        {/* Hover Actions - Positioned Bottom Right */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover/swatch:opacity-100 transition-all duration-300 translate-y-2 group-hover/swatch:translate-y-0 z-10">
            <button
                onClick={handleAction}
                className="bg-white text-neutral-900 p-2.5 rounded-full shadow-lg hover:bg-primary-50 hover:text-primary-600 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                title="View Mockup"
            >
                <Shirt size={18} />
            </button>
            
            <button
                onClick={handleAction}
                className="bg-white text-neutral-900 p-2.5 rounded-full shadow-lg hover:bg-primary-50 hover:text-primary-600 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                title="Add to Moodboard"
            >
                <Presentation size={18} />
            </button>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-bold text-neutral-900 truncate w-full group-hover:text-primary-600 transition-colors duration-200" title={fabric.name}>{fabric.name}</h3>
        </div>
        
        <div className="text-sm text-neutral-500 flex items-center">
          <span className="font-semibold text-neutral-700 bg-neutral-100 px-2 py-1 rounded mr-2">{fabric.fabrication}</span> 
          <span>{fabric.gsm} GSM</span>
        </div>
      </div>
    </div>
  );
};
