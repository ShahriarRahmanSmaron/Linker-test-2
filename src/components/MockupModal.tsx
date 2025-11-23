
import React from 'react';
import { Fabric } from '../types';
import { X, Shirt, ZoomIn, Check, Plus } from 'lucide-react';

interface MockupModalProps {
  fabric: Fabric | null;
  isSelected: boolean;
  onClose: () => void;
  onToggleSelect: (fabric: Fabric) => void;
}

export const MockupModal: React.FC<MockupModalProps> = ({ fabric, isSelected, onClose, onToggleSelect }) => {
  if (!fabric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-fade-in ring-1 ring-white/20 transform transition-all">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white shadow-sm text-neutral-500 hover:text-neutral-900 transition-all duration-200 hover:rotate-90 hover:shadow-md active:scale-90"
        >
            <X size={20} />
        </button>

        {/* Image Area */}
        <div className="w-full md:w-2/3 bg-neutral-100 relative flex items-center justify-center p-8 min-h-[300px] overflow-hidden">
             {/* Mockup Placeholder */}
             <div className="relative w-full max-w-md aspect-[3/4] bg-white shadow-2xl rounded-lg overflow-hidden group cursor-zoom-in transition-transform duration-500 hover:scale-[1.02]">
                {/* Fabric Texture Overlay on a Shirt Shape Mask would go here */}
                <div className="absolute inset-0 bg-neutral-200"></div>
                <div className="absolute inset-0 opacity-50 mix-blend-multiply transition-opacity duration-300" style={{ backgroundColor: fabric.color }}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                    <Shirt size={64} className="mb-4 opacity-50 group-hover:scale-110 group-hover:opacity-70 transition-all duration-500 ease-out" />
                    <span className="text-sm font-medium uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">Interactive 3D View</span>
                </div>
                
                <div className="absolute bottom-4 right-4">
                    <button className="bg-white/90 p-2.5 rounded-xl shadow-lg text-neutral-600 hover:text-primary-600 hover:scale-110 transition-all duration-200">
                        <ZoomIn size={20} />
                    </button>
                </div>
             </div>
        </div>

        {/* Details Sidebar */}
        <div className="w-full md:w-1/3 p-8 flex flex-col bg-white overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-1 leading-tight">{fabric.name}</h2>
                <p className="text-neutral-500 font-medium">{fabric.supplier}</p>
            </div>

            <div className="space-y-6 flex-1">
                <div>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Fabrication</h4>
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2 group hover:bg-neutral-50 transition-colors px-2 rounded">
                        <span className="text-neutral-700 text-sm">Type</span>
                        <span className="font-bold text-neutral-900 text-sm">{fabric.fabrication}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-neutral-100 py-2 group hover:bg-neutral-50 transition-colors px-2 rounded">
                        <span className="text-neutral-700 text-sm">Weight</span>
                        <span className="font-bold text-neutral-900 text-sm">{fabric.gsm} GSM</span>
                    </div>
                     <div className="flex items-center justify-between border-b border-neutral-100 py-2 group hover:bg-neutral-50 transition-colors px-2 rounded">
                        <span className="text-neutral-700 text-sm">Composition</span>
                        <span className="font-bold text-neutral-900 text-right max-w-[60%] text-sm">{fabric.composition}</span>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Mockup Categories</h4>
                    <div className="flex flex-wrap gap-2">
                        {fabric.mockupCategories.map(cat => (
                            <span key={cat} className="px-3 py-1 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300 transition-colors cursor-default">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 space-y-3">
                <button 
                    onClick={() => onToggleSelect(fabric)}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center active:scale-95 shadow-md ${
                        isSelected 
                        ? 'bg-neutral-100 text-primary-700 border-2 border-primary-200 hover:bg-white' 
                        : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30'
                    }`}
                >
                    {isSelected ? <Check size={18} className="mr-2"/> : <Plus size={18} className="mr-2"/>}
                    {isSelected ? 'Added to Moodboard' : 'Add to Moodboard'}
                </button>
                <button className="w-full border border-neutral-200 text-neutral-600 py-3.5 rounded-xl font-bold hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-all duration-200 active:scale-95">
                    Download Image
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
