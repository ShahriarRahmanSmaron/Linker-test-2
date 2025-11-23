
import React from 'react';
import { ManufacturerFabric } from '../../types';
import { Eye, ShieldCheck } from 'lucide-react';

interface FabricPreviewCardProps {
  data: Partial<ManufacturerFabric>;
}

export const FabricPreviewCard: React.FC<FabricPreviewCardProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden pointer-events-none opacity-90 scale-[0.98] origin-top">
      {/* Header Label */}
      <div className="bg-neutral-900 text-white text-[10px] font-bold px-3 py-1 text-center uppercase tracking-wider">
        Buyer View Preview
      </div>

      {/* Visual Swatch Area */}
      <div className="relative h-48 bg-neutral-100 overflow-hidden">
        <div
          className="absolute inset-0 opacity-80 mix-blend-multiply"
          style={{ backgroundColor: '#3B82F6' }} // Default blue for preview if no image
        ></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-20"></div>
        
        {/* Image Preview */}
        {data.swatchImageUrl && (
             <img src={data.swatchImageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {data.certifications?.map((badge) => (
            <span key={badge} className="bg-white/95 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-full text-neutral-700 flex items-center shadow-sm">
              <ShieldCheck size={10} className="mr-1 text-accent-500" />
              {badge}
            </span>
          ))}
        </div>

        {/* Fake Status Badge */}
        <div className="absolute top-3 right-3">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border ${data.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                {data.isActive ? 'Active' : 'Draft'}
            </span>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-4 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-neutral-900 truncate w-full text-base">
            {data.fabricName || 'Fabric Name'}
          </h3>
        </div>
        <p className="text-xs text-neutral-400 mb-2 font-mono">{data.fabricCode || 'CODE-000'}</p>
        
        <div className="text-xs text-neutral-500 mb-3">
          <span className="font-semibold text-neutral-700">{data.fabrication || 'Fabrication'}</span> • {data.gsm || 0} GSM
        </div>
        
        <div className="text-xs text-neutral-500 mb-4">
           <p className="truncate mb-1">{data.composition || 'Composition'}</p>
           <p className="text-neutral-400">MOQ: {data.minOrderQty || '-'} {data.minOrderQty ? 'kg' : ''}</p>
        </div>

        {/* Dummy Actions */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-50 mt-auto opacity-50">
          <button className="bg-neutral-100 text-neutral-400 text-xs font-bold py-2 rounded-lg">
             See Mockup
          </button>
          <button className="bg-neutral-100 text-neutral-400 text-xs font-bold py-2 rounded-lg">
             Add to Board
          </button>
        </div>
      </div>
    </div>
  );
};
