
import React from 'react';
import { Fabric } from '../types';
import { X, FileText, Download, Table } from 'lucide-react';

interface TechpackModalProps {
  fabric: Fabric | null;
  onClose: () => void;
}

export const TechpackModal: React.FC<TechpackModalProps> = ({ fabric, onClose }) => {
  if (!fabric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in ring-1 ring-white/20">
        
        <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-neutral-50/50">
            <div className="flex items-center text-primary-700">
                <div className="bg-primary-100 p-2 rounded-lg mr-3">
                    <FileText size={20} className="text-primary-600" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Generated Techpack Data</h2>
            </div>
            <button 
                onClick={onClose} 
                className="text-neutral-400 hover:text-neutral-700 p-2 hover:bg-neutral-100 rounded-full transition-all duration-200 hover:rotate-90"
            >
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-6">
            <div className="flex items-start space-x-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-20 h-20 bg-neutral-200 rounded-lg border border-neutral-200 relative overflow-hidden flex-shrink-0 shadow-inner">
                     <div className="absolute inset-0 mix-blend-multiply opacity-80" style={{ backgroundColor: fabric.color }}></div>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-neutral-900">{fabric.name}</h3>
                    <p className="text-neutral-500 text-sm mb-2 font-medium">{fabric.supplier}</p>
                    <span className="inline-block bg-white border border-neutral-200 text-neutral-500 text-[10px] font-mono px-2 py-1 rounded">ID: {fabric.id.toUpperCase()}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <tbody className="divide-y divide-neutral-100">
                        <tr className="flex hover:bg-neutral-50 transition-colors">
                            <td className="w-1/3 p-3.5 text-neutral-500 font-medium bg-neutral-50/50 border-r border-neutral-100">Construction</td>
                            <td className="w-2/3 p-3.5 text-neutral-900 font-semibold">{fabric.fabrication}</td>
                        </tr>
                        <tr className="flex hover:bg-neutral-50 transition-colors">
                            <td className="w-1/3 p-3.5 text-neutral-500 font-medium bg-neutral-50/50 border-r border-neutral-100">Weight (GSM)</td>
                            <td className="w-2/3 p-3.5 text-neutral-900 font-semibold">{fabric.gsm} g/m²</td>
                        </tr>
                        <tr className="flex hover:bg-neutral-50 transition-colors">
                            <td className="w-1/3 p-3.5 text-neutral-500 font-medium bg-neutral-50/50 border-r border-neutral-100">Composition</td>
                            <td className="w-2/3 p-3.5 text-neutral-900 font-semibold">{fabric.composition}</td>
                        </tr>
                        <tr className="flex hover:bg-neutral-50 transition-colors">
                            <td className="w-1/3 p-3.5 text-neutral-500 font-medium bg-neutral-50/50 border-r border-neutral-100">Lead Time</td>
                            <td className="w-2/3 p-3.5 text-neutral-900 font-semibold">{fabric.leadTime || '4-6 Weeks'}</td>
                        </tr>
                         <tr className="flex hover:bg-neutral-50 transition-colors">
                            <td className="w-1/3 p-3.5 text-neutral-500 font-medium bg-neutral-50/50 border-r border-neutral-100">Certifications</td>
                            <td className="w-2/3 p-3.5 text-neutral-900 font-semibold">{fabric.badges.join(', ') || 'None'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start">
                <div className="text-blue-500 mr-2 mt-0.5">
                    <Table size={16} />
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Note:</strong> This is a preliminary data sheet. Dimensions and shrinkage tolerance should be confirmed with {fabric.supplier} before bulk production.
                </p>
            </div>
        </div>

        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-end space-x-3">
            <button 
                onClick={onClose} 
                className="px-5 py-2.5 text-neutral-600 font-bold hover:bg-neutral-200 hover:text-neutral-900 rounded-xl transition-colors active:scale-95"
            >
                Close
            </button>
            <button className="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-600/30 transition-all active:scale-95 flex items-center">
                <Download size={18} className="mr-2" /> Download PDF
            </button>
        </div>

      </div>
    </div>
  );
};
