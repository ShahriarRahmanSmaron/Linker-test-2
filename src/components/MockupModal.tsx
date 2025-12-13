import React, { useState, useEffect } from 'react';
import { Fabric } from '../types';
import { X, Shirt, ZoomIn, Check, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/Skeleton';
import { api } from '../lib/api';

interface MockupModalProps {
  fabric: Fabric | null;
  isSelected: boolean;
  onClose: () => void;
  onToggleSelect: (fabric: Fabric) => void;
}

interface MockupData {
  success: boolean;
  views: string[];
  mockups: {
    face?: string;
    back?: string;
    single?: string;
  };
}

interface Garment {
  name: string;
  displayName: string;
  imageUrl: string | null;
  isSilhouette?: boolean;
}

interface GarmentsByCategory {
  [category: string]: Garment[];
}

type ViewMode = 'select' | 'preview';

export const MockupModal: React.FC<MockupModalProps> = ({ fabric, isSelected, onClose, onToggleSelect }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [garments, setGarments] = useState<GarmentsByCategory>({});
  const [isLoadingGarments, setIsLoadingGarments] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Men');

  const [mockupData, setMockupData] = useState<MockupData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'face' | 'back' | 'single'>('face');

  useEffect(() => {
    if (!fabric) {
      setGarments({});
      setMockupData(null);
      setError(null);
      setViewMode('select');
      setSelectedGarment(null);
      return;
    }

    const fetchGarments = async () => {
      try {
        setIsLoadingGarments(true);
        const response = await fetch('/api/garments');
        if (response.ok) {
          const data = await response.json();
          setGarments(data);
          const categories = Object.keys(data);
          if (categories.length > 0) {
            if (!categories.includes(selectedCategory)) {
              setSelectedCategory(categories.includes('Men') ? 'Men' : categories[0]);
            }
          }
        } else {
          console.error('Failed to fetch garments');
        }
      } catch (err) {
        console.error('Error fetching garments:', err);
      } finally {
        setIsLoadingGarments(false);
      }
    };

    fetchGarments();
  }, [fabric]);

  const handleGarmentSelect = async (garment: Garment) => {
    if (!fabric) return;

    try {
      setIsGenerating(true);
      setError(null);
      setSelectedGarment(garment.displayName);
      setViewMode('preview');

      const fabricRef = fabric.ref || fabric.id;

      const response = await api.post('/generate-mockup', {
        fabric_ref: fabricRef,
        mockup_name: garment.name,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMockupData(data);
          if (data.mockups.face) setCurrentView('face');
          else if (data.mockups.back) setCurrentView('back');
          else if (data.mockups.single) setCurrentView('single');
        } else {
          setError(data.error || 'Failed to generate mockup');
        }
      } else {
        setError(`Failed to generate mockup (${response.status}). Please try again.`);
      }
    } catch (err) {
      console.error('Error generating mockup:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setViewMode('select');
    setMockupData(null);
    setSelectedGarment(null);
    setError(null);
  };

  if (!fabric) return null;

  const fabricName = fabric.name || fabric.ref;
  const fabricComposition = fabric.composition || fabric.fabrication;
  const categories = Object.keys(garments).length > 0 ? Object.keys(garments) : ['Men', 'Women', 'Infant', 'Big Collection'];
  const categoryGarments = garments[selectedCategory] || [];

  return (
    <Dialog open={!!fabric} onOpenChange={(open) => !open && onClose()}>
      {/* PERFORMANCE FIX: Removed blur, used semi-transparent dark overlay */}
      <DialogOverlay
        className="bg-black/60 transition-opacity"
        onClick={onClose}
      />
      <DialogContent
        className="max-w-4xl max-h-[95vh] p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden"
        hideOverlay={true}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="relative max-w-4xl w-full max-h-[95vh] overflow-hidden animate-fade-in transform transition-all">
          {/* PERFORMANCE FIX: Replaced custom glass styles with optimized .glass-panel class from index.css */}
          <div className="relative rounded-3xl overflow-hidden glass-panel shadow-2xl">
            {/* Simple gradient background instead of complex light refraction layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none"></div>

            <div className="relative flex flex-col h-full max-h-[95vh]">
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-4 pb-3 border-b border-gray-200/30">
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <h2 className="text-xl font-bold text-gray-900">Fabrication :</h2>
                    {fabricComposition && (
                      <span className="text-sm font-medium text-gray-700">
                        {fabricComposition}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">(Select garment, visualize and save)</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-900 transition-all"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {viewMode === 'select' && (
                  <>
                    {/* Sidebar */}
                    <div className="w-48 flex-shrink-0 px-6 py-6 border-r border-gray-200/30 bg-white/30">
                      <div className="flex flex-col gap-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`
                            px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left
                            ${selectedCategory === category
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-700 hover:bg-white/40'
                              }
                          `}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 bg-white/20">
                      {isLoadingGarments && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-xl bg-white/40 animate-pulse border border-white/30" />
                          ))}
                        </div>
                      )}

                      {!isLoadingGarments && categoryGarments.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {categoryGarments.map((garment) => (
                            <button
                              key={garment.name}
                              onClick={() => handleGarmentSelect(garment)}
                              // PERFORMANCE FIX: Removed backdrop-filter, used solid colors with opacity
                              className="group relative aspect-square rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white/60 border border-white/50 hover:border-green-400/50 hover:bg-white/80 overflow-hidden"
                            >
                              <div className="w-full h-full flex flex-col items-center justify-center p-3">
                                <div className="flex-1 w-full flex items-center justify-center mb-2 overflow-hidden">
                                  {garment.imageUrl ? (
                                    <img
                                      src={garment.imageUrl}
                                      alt={garment.displayName}
                                      className="w-full h-full object-contain"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Shirt size={40} className="text-gray-400" />
                                  )}
                                </div>
                                <p className="text-xs font-medium text-gray-800 text-center">
                                  {garment.displayName}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {viewMode === 'preview' && (
                  <div className="flex flex-col w-full h-full bg-white/20">
                    <div className="px-6 pt-2 pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
                      >
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Selection
                      </Button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 pt-4 min-h-[400px] overflow-auto">
                      {isGenerating && (
                        <div className="flex flex-col items-center justify-center w-full max-w-md px-6">
                          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                          <p className="text-gray-700 font-medium mb-2 text-lg">Generating mockup...</p>
                          <p className="text-gray-500 text-sm text-center">Processing fabric visualization...</p>
                        </div>
                      )}

                      {!isGenerating && !error && mockupData && (
                        <div className="relative w-full flex flex-col items-center justify-center">
                          {/* PERFORMANCE FIX: Simplified preview container */}
                          <div className="relative rounded-xl bg-white/80 border border-white shadow-lg p-4 max-w-[90%] w-auto">
                            <img
                              src={mockupData.mockups[currentView] || ''}
                              alt={`${fabricName} - ${currentView}`}
                              className="w-auto h-auto object-contain max-h-[60vh]"
                            />

                            {/* View Toggles */}
                            {mockupData.views.length > 1 && (
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                {['face', 'back'].map(view =>
                                  mockupData.views.includes(view) && (
                                    <Button
                                      key={view}
                                      onClick={() => setCurrentView(view as any)}
                                      variant={currentView === view ? 'default' : 'outline'}
                                      size="sm"
                                      className={currentView === view ? 'bg-blue-600' : 'bg-white/80 text-gray-800'}
                                    >
                                      {view === 'face' ? 'Front' : 'Back'}
                                    </Button>
                                  )
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-6 flex gap-3 justify-center">
                            {/* Download buttons remain same */}
                            <Button onClick={() => window.open(mockupData.mockups[currentView], '_blank')} variant="outline">
                              Download Image
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
