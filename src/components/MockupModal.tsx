
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
  name: string; // API name (for backend calls, original casing)
  displayName: string; // Display name (for UI, title case)
  imageUrl: string | null;
  isSilhouette?: boolean; // True if this is a pre-made silhouette, false if it needs filtering
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
  const [debugMode, setDebugMode] = useState<boolean>(false); // Set to true to see raw images without filter

  const [mockupData, setMockupData] = useState<MockupData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'face' | 'back' | 'single'>('face');

  // Fetch available garments when modal opens
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
          // Set selected category to first available if current selection doesn't exist
          const categories = Object.keys(data);
          if (categories.length > 0) {
            if (!categories.includes(selectedCategory)) {
              // Try "Men" first, otherwise use first available
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabric]);

  // Generate mockup when garment is selected
  const handleGarmentSelect = async (garment: Garment) => {
    if (!fabric) return;

    try {
      setIsGenerating(true);
      setError(null);
      setSelectedGarment(garment.displayName);
      setViewMode('preview');

      const fabricRef = fabric.ref || fabric.id;

      // Use the garment.name (which has the correct casing from the API)
      console.log('Generating mockup:', {
        fabric_ref: fabricRef,
        mockup_name: garment.name,
        display_name: garment.displayName
      });

      const response = await api.post('/generate-mockup', {
        fabric_ref: fabricRef,
        mockup_name: garment.name, // Use original casing
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Mockup generation response:', data);
        if (data.success) {
          setMockupData(data);
          // Set initial view based on available mockups
          if (data.mockups.face) setCurrentView('face');
          else if (data.mockups.back) setCurrentView('back');
          else if (data.mockups.single) setCurrentView('single');
        } else {
          const errorMsg = data.error || 'Failed to generate mockup';
          console.error('Mockup generation failed:', errorMsg);
          setError(errorMsg);
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP error:', response.status, errorText);
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
  const fabricSupplier = fabric.supplier || 'Unknown Supplier';
  const fabricGsm = typeof fabric.gsm === 'string' ? fabric.gsm : `${fabric.gsm}`;
  const fabricComposition = fabric.composition || fabric.fabrication;

  // Get categories from garments, default to Men, Women, Infant, Big Collection
  const categories = Object.keys(garments).length > 0
    ? Object.keys(garments)
    : ['Men', 'Women', 'Infant', 'Big Collection'];

  // Get garments for selected category
  const categoryGarments = garments[selectedCategory] || [];

  return (
    <Dialog open={!!fabric} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay
        className="backdrop-blur-[40px] bg-black/10"
        style={{
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
        onClick={onClose}
      />
      <DialogContent
        className="max-w-4xl max-h-[95vh] p-0 overflow-hidden border-0 bg-transparent backdrop-blur-none shadow-none [&>button]:hidden"
        style={{
          background: 'transparent',
        }}
        hideOverlay={true}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Glassmorphism Modal with green light refractions */}
        <div className="relative max-w-4xl w-full max-h-[95vh] overflow-hidden animate-fade-in transform transition-all">
          {/* Glass container with frosted effect and green edge highlights */}
          <div
            className="relative rounded-3xl overflow-hidden glass-panel shadow-2xl"
            style={{
              boxShadow: `
              0 8px 32px 0 rgba(0, 0, 0, 0.15),
              inset 0 0 0 1px rgba(34, 197, 94, 0.2),
              0 0 40px rgba(34, 197, 94, 0.1)
            `
            }}
          >
            {/* Green light refraction on edges */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
                linear-gradient(225deg, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                linear-gradient(45deg, transparent 0%, rgba(34, 197, 94, 0.1) 100%),
                linear-gradient(315deg, transparent 0%, rgba(34, 197, 94, 0.15) 100%)
              `
              }}
            ></div>

            {/* Content Container */}
            <div className="relative flex flex-col h-full max-h-[95vh]">
              {/* Top Header with Title */}
              <div className="flex items-start justify-between px-6 pt-4 pb-3">
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <h2 className="text-xl font-bold text-[#111827]">Fabrication :</h2>
                    {fabricComposition && (
                      <span className="text-sm font-medium text-[#111827]/80" style={{ fontFamily: 'inherit' }}>
                        {fabricComposition}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#111827]/70">(Select garment, visualize and save)</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/20 text-[#111827]/60 hover:text-[#111827] transition-all duration-200 active:scale-90"
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Main Content Area - Sidebar + Grid Layout */}
              <div className="flex-1 flex overflow-hidden">
                {viewMode === 'select' && (
                  <>
                    {/* Left Sidebar - Category Menu */}
                    <div className="w-48 flex-shrink-0 px-6 py-6 border-r border-white/20">
                      <div className="flex flex-col gap-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`
                            px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 text-left
                            ${selectedCategory === category
                                ? 'bg-[#0E6FFF] text-white shadow-lg shadow-[#0E6FFF]/30'
                                : 'text-[#111827] hover:bg-white/10'
                              }
                          `}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right Grid - Garment Tiles */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                      {/* Loading Garments */}
                      {isLoadingGarments && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
                              <Skeleton className="w-full h-full opacity-50" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Garment Grid */}
                      {!isLoadingGarments && categoryGarments.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {categoryGarments.map((garment) => (
                            <button
                              key={garment.name}
                              onClick={() => handleGarmentSelect(garment)}
                              className="group relative aspect-square rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                              style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                                overflow: 'visible'
                              }}
                            >
                              {/* Glass tile content */}
                              <div className="w-full h-full flex flex-col items-center justify-center p-3">
                                {/* Image container - simple, no glass effect */}
                                <div className="flex-1 w-full flex items-center justify-center mb-2 overflow-hidden">
                                  {garment.imageUrl ? (
                                    <img
                                      src={garment.imageUrl}
                                      alt={garment.displayName}
                                      className="w-full h-full object-contain"
                                      style={{
                                        maxHeight: '100%',
                                        maxWidth: '100%',
                                        objectFit: 'contain'
                                      }}
                                      onError={(e) => {
                                        console.error('Failed to load image:', garment.imageUrl);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <Shirt size={40} className="text-[#111827]/30" />
                                  )}
                                </div>
                                {/* Item name below */}
                                <p className="text-xs font-medium text-[#111827] text-center">
                                  {garment.displayName}
                                </p>
                              </div>

                              {/* Hover effect - green glow */}
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                                style={{
                                  boxShadow: 'inset 0 0 20px rgba(34, 197, 94, 0.3)',
                                  border: '1px solid rgba(34, 197, 94, 0.4)'
                                }}
                              ></div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No Garments */}
                      {!isLoadingGarments && categoryGarments.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <Shirt size={48} className="text-[#111827]/30 mb-4" />
                          <p className="text-[#111827]/70 font-medium">No garments available in this category</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {viewMode === 'preview' && (
                  <div className="flex flex-col w-full h-full">
                    {/* Back Button */}
                    <div className="px-6 pt-2 pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="flex items-center text-[#111827]/70 hover:text-[#111827] transition-colors font-medium"
                      >
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Selection
                      </Button>
                    </div>

                    {/* Mockup Preview Area */}
                    <div className="flex-1 flex items-center justify-center p-8 pt-4 min-h-[400px] overflow-auto">
                      {/* Loading State with Progress */}
                      {isGenerating && (
                        <div className="flex flex-col items-center justify-center w-full max-w-md px-6">
                          <div
                            className="p-4 rounded-full mb-6"
                            style={{
                              background: 'rgba(37, 99, 235, 0.1)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                            }}
                          >
                            <Loader2 className="h-12 w-12 text-[#0E6FFF] animate-spin" />
                          </div>
                          <p className="text-[#111827]/70 dark:text-white/70 font-medium mb-6 text-center text-lg">Generating mockup...</p>
                          <div className="w-full mb-2">
                            <Progress
                              value={undefined}
                              className="h-2.5 rounded-full overflow-hidden"
                              style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                              }}
                            />
                          </div>
                          <p className="text-[#111827]/50 dark:text-white/50 text-sm text-center">Processing fabric visualization...</p>
                        </div>
                      )}

                      {/* Error State */}
                      {error && !isGenerating && (
                        <div className="flex flex-col items-center justify-center text-center px-4">
                          <div
                            className="p-4 rounded-full mb-4"
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <X className="h-12 w-12 text-red-500" />
                          </div>
                          <p className="text-red-600 font-medium mb-2">Failed to generate mockup</p>
                          <p className="text-[#111827]/60 text-sm mb-4">{error}</p>
                          <Button
                            onClick={handleBack}
                            className="px-4 py-2"
                          >
                            Try Another Garment
                          </Button>
                        </div>
                      )}

                      {/* Mockup Display */}
                      {!isGenerating && !error && mockupData && (
                        <div className="relative w-full flex flex-col items-center justify-center" style={{ maxHeight: 'calc(95vh - 200px)', overflow: 'visible', paddingTop: '5px' }}>
                          <div
                            className="relative rounded-xl overflow-visible"
                            style={{
                              background: 'rgba(255, 255, 255, 0.3)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                              maxWidth: '90%',
                              maxHeight: 'calc(95vh - 250px)',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'center',
                              paddingTop: '10px',
                              paddingBottom: '50px',
                              paddingLeft: '8px',
                              paddingRight: '8px'
                            }}
                          >
                            <img
                              src={mockupData.mockups[currentView] || ''}
                              alt={`${fabricName} - ${currentView}`}
                              className="w-auto h-auto object-contain"
                              style={{
                                maxWidth: 'calc(100% - 16px)',
                                maxHeight: 'calc(95vh - 300px)',
                                width: 'auto',
                                height: 'auto',
                                display: 'block'
                              }}
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%23e5e7eb" width="400" height="600"/%3E%3C/svg%3E';
                              }}
                            />

                            {/* View Selector - Moved to bottom */}
                            {mockupData.views.length > 1 && (
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                {mockupData.views.includes('face') && (
                                  <Button
                                    onClick={() => setCurrentView('face')}
                                    variant={currentView === 'face' ? 'default' : 'outline'}
                                    size="sm"
                                    className={currentView === 'face' ? '' : 'bg-white/30 text-[#111827] hover:bg-white/50 backdrop-blur-sm border-white/30'}
                                  >
                                    Front
                                  </Button>
                                )}
                                {mockupData.views.includes('back') && (
                                  <Button
                                    onClick={() => setCurrentView('back')}
                                    variant={currentView === 'back' ? 'default' : 'outline'}
                                    size="sm"
                                    className={currentView === 'back' ? '' : 'bg-white/30 text-[#111827] hover:bg-white/50 backdrop-blur-sm border-white/30'}
                                  >
                                    Back
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Download Buttons for Face and Back - Outside the image container */}
                          {mockupData.views.length > 1 && (
                            <div className="mt-6 flex gap-3 justify-center">
                              {mockupData.views.includes('face') && mockupData.mockups.face && (
                                <Button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = mockupData.mockups.face!;
                                    link.download = `${fabricName}_front.jpg`;
                                    link.click();
                                  }}
                                  variant="outline"
                                  className="px-6 py-3 backdrop-blur-sm border-white/40 bg-white/30 hover:bg-white/50"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download Front
                                </Button>
                              )}
                              {mockupData.views.includes('back') && mockupData.mockups.back && (
                                <Button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = mockupData.mockups.back!;
                                    link.download = `${fabricName}_back.jpg`;
                                    link.click();
                                  }}
                                  variant="outline"
                                  className="px-6 py-3 backdrop-blur-sm border-white/40 bg-white/30 hover:bg-white/50"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download Back
                                </Button>
                              )}
                            </div>
                          )}
                          {mockupData.views.length === 1 && mockupData.mockups.single && (
                            <div className="mt-6 flex justify-center">
                              <Button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = mockupData.mockups.single!;
                                  link.download = `${fabricName}_mockup.jpg`;
                                  link.click();
                                }}
                                variant="outline"
                                className="px-6 py-3 backdrop-blur-sm border-white/40 bg-white/30 hover:bg-white/50"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Mockup
                              </Button>
                            </div>
                          )}
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
