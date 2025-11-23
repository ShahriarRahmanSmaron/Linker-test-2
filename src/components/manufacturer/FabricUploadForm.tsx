
import React, { useState, useEffect } from 'react';
import { ManufacturerFabric } from '../../types';
import { Upload, Save, RotateCcw, X } from 'lucide-react';

interface FabricUploadFormProps {
  initialData?: ManufacturerFabric | null;
  onSave: (data: Partial<ManufacturerFabric>) => void;
  onCancelEdit: () => void;
}

const DEFAULT_FORM_STATE = {
    fabricCode: '',
    fabricName: '',
    fabrication: 'Single Jersey',
    fabricType: '100% Cotton',
    gsm: 180,
    composition: '',
    category: [],
    season: 'All Season',
    certifications: [],
    minOrderQty: 0,
    leadTime: 0,
    priceRange: '',
    colorways: '',
    notes: '',
    isActive: true,
    swatchImageUrl: ''
};

export const FabricUploadForm: React.FC<FabricUploadFormProps> = ({ initialData, onSave, onCancelEdit }) => {
  const [formData, setFormData] = useState<Partial<ManufacturerFabric>>(DEFAULT_FORM_STATE);

  useEffect(() => {
    if (initialData) {
        setFormData(initialData);
    } else {
        setFormData(DEFAULT_FORM_STATE);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;

    if (type === 'number') {
        finalValue = parseFloat(value);
    } else if (type === 'checkbox') {
        // @ts-ignore
        finalValue = e.target.checked;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleMultiSelect = (field: 'category' | 'certifications', value: string) => {
      setFormData(prev => {
          const current = prev[field] || [];
          if (current.includes(value)) {
              return { ...prev, [field]: current.filter((item: string) => item !== value) };
          } else {
              return { ...prev, [field]: [...current, value] };
          }
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.fabricCode || !formData.fabricName || !formData.gsm) {
        alert("Please fill in required fields (Code, Name, GSM)");
        return;
    }
    onSave(formData);
    if (!initialData) {
        setFormData(DEFAULT_FORM_STATE); // Reset on create
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-neutral-900">
            {initialData ? 'Edit Fabric' : 'Upload New Fabric'}
        </h2>
        {initialData && (
            <button 
                type="button" 
                onClick={onCancelEdit}
                className="text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center"
            >
                <X size={14} className="mr-1"/> Cancel Edit
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Col 1 */}
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Fabric Code *</label>
                <input 
                    type="text" name="fabricCode" required
                    value={formData.fabricCode} onChange={handleChange}
                    className="w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-neutral-50"
                    placeholder="e.g. MK-2024-001"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Fabric Name *</label>
                <input 
                    type="text" name="fabricName" required
                    value={formData.fabricName} onChange={handleChange}
                    className="w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    placeholder="e.g. Premium Pique"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Fabrication *</label>
                    <select 
                        name="fabrication" value={formData.fabrication} onChange={handleChange}
                        className="w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-accent-500"
                    >
                        {['Single Jersey', 'Pique', 'Fleece', 'Rib', 'Terry', 'Interlock', 'Mesh', 'Jacquard'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">GSM *</label>
                    <input 
                        type="number" name="gsm" required min="50" max="1000"
                        value={formData.gsm} onChange={handleChange}
                        className="w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-accent-500"
                    />
                </div>
            </div>
             <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Composition</label>
                <input 
                    type="text" name="composition"
                    value={formData.composition} onChange={handleChange}
                    className="w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-accent-500"
                    placeholder="e.g. 95% Cotton / 5% Spandex"
                />
            </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">MOQ (kg)</label>
                    <input 
                        type="number" name="minOrderQty"
                        value={formData.minOrderQty || ''} onChange={handleChange}
                        className="w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-accent-500"
                    />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Lead Time (Days)</label>
                    <input 
                        type="number" name="leadTime"
                        value={formData.leadTime || ''} onChange={handleChange}
                        className="w-full p-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-accent-500"
                    />
                </div>
            </div>
            
            <div>
                 <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Certifications</label>
                 <div className="flex flex-wrap gap-2">
                     {['GOTS', 'GRS', 'BCI', 'OEKO-TEX'].map(cert => (
                         <button 
                            type="button" key={cert}
                            onClick={() => handleMultiSelect('certifications', cert)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${formData.certifications?.includes(cert) ? 'bg-accent-100 border-accent-200 text-accent-800 font-bold' : 'bg-white border-neutral-200 text-neutral-500'}`}
                         >
                             {cert}
                         </button>
                     ))}
                 </div>
            </div>

            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-neutral-50 transition-colors cursor-pointer">
                 <Upload size={24} className="text-neutral-400 mb-2" />
                 <span className="text-sm font-bold text-accent-600">Upload Swatch Image</span>
                 <span className="text-xs text-neutral-400">JPG, PNG up to 5MB</span>
            </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-between items-center">
          <div className="flex items-center">
             <input 
                type="checkbox" id="isActive" name="isActive"
                checked={formData.isActive} 
                // @ts-ignore
                onChange={handleChange}
                className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-neutral-300 rounded"
             />
             <label htmlFor="isActive" className="ml-2 block text-sm text-neutral-900">
                 Active (Visible to buyers)
             </label>
          </div>

          <div className="flex space-x-3">
             {!initialData && (
                 <button 
                    type="button" onClick={() => setFormData(DEFAULT_FORM_STATE)}
                    className="px-4 py-2.5 text-neutral-500 font-bold hover:bg-neutral-100 rounded-lg transition-colors text-sm flex items-center"
                >
                    <RotateCcw size={14} className="mr-2" /> Reset
                </button>
             )}
             <button 
                type="submit"
                className="px-6 py-2.5 bg-accent-600 text-white font-bold rounded-lg shadow-lg shadow-accent-500/30 hover:bg-accent-700 transition-all active:scale-95 text-sm flex items-center"
            >
                <Save size={16} className="mr-2" /> {initialData ? 'Update Fabric' : 'Save Fabric'}
            </button>
          </div>
      </div>
    </form>
  );
};
