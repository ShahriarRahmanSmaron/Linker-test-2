
import React, { useState, useEffect } from 'react';
import { Fabric } from '../types';
import { X, ChevronUp, ChevronDown, Layout, Trash2 } from 'lucide-react';

interface SelectionPanelProps {
  selectedFabrics: Fabric[];
  onRemove: (fabricId: string) => void;
  onClear: () => void;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({ selectedFabrics, onRemove, onClear }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-open panel when first item is added
  useEffect(() => {
    if (selectedFabrics.length === 1) {
      setIsOpen(true);
    }
  }, [selectedFabrics.length]);

  if (selectedFabrics.length === 0) return null;

  return (
    <div className={`fixed z-40 transition-all duration-500 ease-in-out shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]
      md:right-6 md:top-auto md:bottom-6 md:w-80 md:bg-white md:rounded-2xl md:border md:border-neutral-200
      bottom-0 left-0 right-0 bg-white border-t border-neutral-200
      ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-68px)] md:translate-y-[calc(100%-68px)]'}
    `}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-neutral-100 cursor-pointer bg-white rounded-t-2xl hover:bg-neutral-50/50 transition-colors group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="bg-primary-600 p-2 rounded-lg mr-3 text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200">
            <Layout size={18} />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm group-hover:text-primary-600 transition-colors">Moodboard</h3>
            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wide">{selectedFabrics.length} items selected</p>
          </div>
        </div>
        <div className="text-neutral-400 hover:text-neutral-600 bg-neutral-50 p-1 rounded-full transition-colors">
          {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-[40vh] md:max-h-[300px] space-y-2 bg-neutral-50/50">
        {selectedFabrics.map(fabric => {
          const fabricId = fabric.ref || fabric.id;
          const fabricName = fabric.name || fabric.ref;

          return (
            <div key={fabricId} className="flex items-center bg-white p-2 rounded-xl border border-neutral-100 shadow-sm animate-fade-in group hover:border-primary-200 hover:shadow-md hover:translate-x-1 transition-all duration-200">
              <div className="h-16 w-16 rounded-lg bg-neutral-200 flex-shrink-0 relative overflow-hidden mr-3 shadow-md">
                {/* Fabric Swatch Image or Fallback */}
                {fabric.swatchUrl ? (
                  <>
                    <img
                      src={fabric.swatchUrl}
                      alt={fabricName}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to color if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Fallback color block (hidden unless image fails) */}
                    <div className="absolute inset-0 mix-blend-multiply opacity-80" style={{ backgroundColor: fabric.color || '#9CA3AF' }}></div>
                  </>
                ) : (
                  <>
                    {/* Fallback: Color Block */}
                    <div className="absolute inset-0 mix-blend-multiply opacity-80" style={{ backgroundColor: fabric.color || '#9CA3AF' }}></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-20"></div>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-neutral-800 truncate group-hover:text-primary-700 transition-colors">{fabricName}</h4>
                <p className="text-[10px] text-neutral-500">{fabric.fabrication}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(fabricId); }}
                className="text-neutral-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors active:scale-90"
                title="Remove item"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-neutral-100 bg-white rounded-b-2xl">
        <button
          className="w-full bg-neutral-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-neutral-900/10 hover:bg-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-neutral-900/20 active:scale-95 transition-all duration-200 mb-3 flex items-center justify-center"
          onClick={() => alert('Moodboard creation demo!')}
        >
          Create Moodboard
        </button>
        <button
          onClick={onClear}
          className="w-full flex items-center justify-center text-neutral-400 text-xs font-medium hover:text-red-500 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 size={12} className="mr-1.5" /> Clear Selection
        </button>
      </div>
    </div>
  );
};
