
import React, { useState } from 'react';
import { ManufacturerFabric } from '../../types';
import { INITIAL_MANUFACTURER_DATA } from '../../constants';
import { TopBar } from './TopBar';
import { FabricUploadForm } from './FabricUploadForm';
import { FabricTable } from './FabricTable';
import { FabricPreviewCard } from './FabricPreviewCard';
import { StatusToast } from './StatusToast';
import { ConfirmDialog } from './ConfirmDialog';

export const ManufacturerDashboard: React.FC = () => {
  const [fabrics, setFabrics] = useState<ManufacturerFabric[]>(INITIAL_MANUFACTURER_DATA);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: string | number | null }>({ isOpen: false, id: null });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
      setToast({ visible: true, message, type });
  };

  const handleSave = (data: Partial<ManufacturerFabric>) => {
    if (editingId) {
        // Update
        setFabrics(prev => prev.map(f => f.id === editingId ? { ...f, ...data } as ManufacturerFabric : f));
        showToast('Fabric updated successfully.', 'success');
        setEditingId(null);
    } else {
        // Create
        const newFabric = { 
            ...data, 
            id: Date.now(), 
            createdAt: new Date().toISOString() 
        } as ManufacturerFabric;
        setFabrics(prev => [newFabric, ...prev]);
        showToast('New fabric uploaded successfully.', 'success');
    }
  };

  const handleDeleteRequest = (id: string | number) => {
      setConfirmDialog({ isOpen: true, id });
  };

  const confirmDelete = () => {
      if (confirmDialog.id) {
          setFabrics(prev => prev.filter(f => f.id !== confirmDialog.id));
          showToast('Fabric deleted.', 'success');
          setConfirmDialog({ isOpen: false, id: null });
          if (editingId === confirmDialog.id) setEditingId(null);
      }
  };

  const handleToggleStatus = (id: string | number) => {
      setFabrics(prev => prev.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
      showToast('Status updated.', 'info');
  };

  const editingFabric = fabrics.find(f => f.id === editingId) || null;

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <TopBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left Column: Form & Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
                 {/* Form */}
                 <FabricUploadForm 
                    initialData={editingFabric}
                    onSave={handleSave}
                    onCancelEdit={() => setEditingId(null)}
                 />
                 
                 {/* Live Preview Guide */}
                 <div className="hidden lg:block">
                     <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Live Card Preview</h3>
                     <FabricPreviewCard data={editingFabric || { fabricName: 'New Fabric', fabricCode: 'PREVIEW', fabrication: 'Single Jersey' }} />
                 </div>
            </div>

            {/* Right Column: List (7 cols) */}
            <div className="lg:col-span-7">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold text-neutral-900">Your Fabric Library</h2>
                    <span className="text-sm text-neutral-500">{fabrics.length} items</span>
                </div>
                
                <FabricTable 
                    fabrics={fabrics}
                    onEdit={(f) => { setEditingId(f.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    onDelete={handleDeleteRequest}
                    onToggleStatus={handleToggleStatus}
                />
            </div>
        </div>
      </div>

      <StatusToast 
        {...toast}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title="Delete Fabric?"
        message="This action cannot be undone. The fabric will be removed from the buyer search instantly."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, id: null })}
      />
    </div>
  );
};
