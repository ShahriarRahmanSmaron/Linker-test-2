import React, { useState, useEffect } from 'react';
import { Fabric } from '../types';
import { X, Shirt, ZoomIn, Check, Plus, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/Skeleton';
import { api } from '../lib/api';
import { TechpackPromptModal } from './TechpackPromptModal';

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
  const [showTechpackModal, setShowTechpackModal] = useState(false);
  const [currentGarmentName, setCurrentGarmentName] = useState<string>('');

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
      setCurrentGarmentName(garment.name);
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#F2F1ED] to-[#E6E5E1] pointer-events-none"></div>

            <div className="relative flex flex-col h-full max-h-[95vh]">
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-4 pb-3 border-b border-gray-200/30">
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <h2 className="text-xl font-display font-bold text-gray-900">Fabrication :</h2>
                    {fabricComposition && (
                      <span className="text-sm font-display font-medium text-gray-700">
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
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {viewMode === 'select' && (
                  <>
                    {/* Category Tabs - Horizontal scrollable on mobile, Sidebar on desktop */}
                    <div className="md:w-48 flex-shrink-0 md:px-6 md:py-6 md:border-r border-b md:border-b-0 border-gray-200/30 bg-[#E6E5E1]/50">
                      {/* Mobile: Horizontal scrollable tabs */}
                      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible px-4 py-3 md:px-0 md:py-0 scrollbar-hide">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`
                            px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left border whitespace-nowrap flex-shrink-0
                            ${selectedCategory === category
                                ? 'bg-[#F5F5F0] border-neutral-900 text-neutral-900 shadow-sm font-bold'
                                : 'border-transparent text-gray-700 hover:bg-[#F5F5F0] hover:text-neutral-900'
                              }
                          `}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 md:py-6 bg-[#F2F1ED]/30">
                      {isLoadingGarments && (
                        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-xl bg-white/40 animate-pulse border border-white/30" />
                          ))}
                        </div>
                      )}

                      {!isLoadingGarments && categoryGarments.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                          {categoryGarments.map((garment) => (
                            <button
                              key={garment.name}
                              onClick={() => handleGarmentSelect(garment)}
                              className="group relative flex flex-col bg-white rounded-xl border border-gray-200 p-2 sm:p-3 transition-all duration-300 hover:shadow-lg hover:border-blue-500/30"
                            >
                              <div className="w-full aspect-square bg-gray-50 rounded-lg mb-1.5 sm:mb-3 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:bg-gray-100 transition-colors">
                                {garment.imageUrl ? (
                                  <img
                                    src={garment.imageUrl}
                                    alt={garment.displayName}
                                    className="w-full h-full object-contain p-1 sm:p-2 mix-blend-multiply"
                                    loading="lazy"
                                  />
                                ) : (
                                  <Shirt size={24} className="text-gray-400 sm:w-10 sm:h-10" />
                                )}
                              </div>
                              <div className="w-full text-left">
                                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
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
                  <div className="flex flex-col w-full bg-[#F2F1ED]/30 overflow-hidden">
                    <div className="px-6 pt-2 pb-2 flex-shrink-0">
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

                    <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 overflow-auto min-h-0">
                      {isGenerating && (
                        <div className="relative w-full flex flex-col items-center justify-center gap-4">
                          {/* Skeleton box matching mockup preview */}
                          <div className="relative rounded-xl bg-white/80 border border-white shadow-lg p-4 max-w-[90%] w-auto">
                            {/* Skeleton placeholder */}
                            <div className="w-[300px] h-[50vh] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg animate-pulse flex flex-col items-center justify-center">
                              {/* Magic Hat with Rotating Wand Animation */}
                              <div className="relative w-28 h-28 mb-6">
                                {/* Magic Hat SVG - Classic Magician Style */}
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                  {/* Hat brim shadow */}
                                  <ellipse cx="50" cy="78" rx="42" ry="10" fill="#2a2a2a" opacity="0.3" />
                                  {/* Hat brim */}
                                  <ellipse cx="50" cy="75" rx="40" ry="8" fill="url(#hatBrimGradient)" />
                                  {/* Hat body */}
                                  <path d="M28 75 L35 28 L65 28 L72 75 Z" fill="url(#hatBodyGradient)" />
                                  {/* Hat top */}
                                  <ellipse cx="50" cy="28" rx="15" ry="5" fill="#3a3a3a" />
                                  {/* Red band */}
                                  <rect x="33" y="58" width="34" height="10" rx="1" fill="url(#redBandGradient)" />
                                  {/* Gold star on hat */}
                                  <polygon points="38,42 40,47 45,47.5 41,51 42,56 38,53 34,56 35,51 31,47.5 36,47" fill="#ffd700" />
                                  {/* Purple feather */}
                                  <path d="M62 25 Q75 15, 70 35 Q68 28, 65 32 Q67 22, 62 25" fill="url(#featherGradient)" />
                                  <path d="M64 28 Q72 22, 68 33" stroke="#6b21a8" strokeWidth="0.5" fill="none" />

                                  {/* Sparkles around hat */}
                                  <g className="animate-pulse">
                                    <circle cx="18" cy="45" r="2" fill="#ffd700" opacity="0.9" />
                                    <circle cx="82" cy="50" r="1.5" fill="#ffd700" opacity="0.8" />
                                    <circle cx="78" cy="22" r="2" fill="#ffd700" opacity="0.7" />
                                    <circle cx="22" cy="60" r="1.5" fill="#ffd700" opacity="0.8" />
                                  </g>

                                  {/* Gradients */}
                                  <defs>
                                    <linearGradient id="hatBrimGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#1a1a1a" />
                                      <stop offset="50%" stopColor="#4a4a4a" />
                                      <stop offset="100%" stopColor="#1a1a1a" />
                                    </linearGradient>
                                    <linearGradient id="hatBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#5a5a5a" />
                                      <stop offset="30%" stopColor="#3a3a3a" />
                                      <stop offset="70%" stopColor="#2a2a2a" />
                                      <stop offset="100%" stopColor="#1a1a1a" />
                                    </linearGradient>
                                    <linearGradient id="redBandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#ef4444" />
                                      <stop offset="50%" stopColor="#dc2626" />
                                      <stop offset="100%" stopColor="#b91c1c" />
                                    </linearGradient>
                                    <linearGradient id="featherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#9333ea" />
                                      <stop offset="50%" stopColor="#7c3aed" />
                                      <stop offset="100%" stopColor="#6b21a8" />
                                    </linearGradient>
                                  </defs>
                                </svg>

                                {/* Rotating Magic Wand - Black */}
                                <div className="absolute top-0 left-[60%] -translate-x-1/2 origin-bottom animate-[wandWave_2s_ease-in-out_infinite]">
                                  <svg viewBox="0 0 40 80" className="w-8 h-16">
                                    {/* Wand stick - Black */}
                                    <rect x="17" y="25" width="6" height="50" rx="2" fill="url(#wandGradientBlack)" />
                                    {/* White tip */}
                                    <rect x="17" y="25" width="6" height="8" rx="2" fill="#ffffff" />
                                    {/* Wand tip glow */}
                                    <circle cx="20" cy="20" r="6" fill="url(#glowGradientGold)" className="animate-pulse" />
                                    {/* Sparkle at tip */}
                                    <polygon points="20,12 21,17 26,17.5 22,20 23,25 20,22 17,25 18,20 14,17.5 19,17" fill="#ffd700" />
                                    {/* Mini sparkles from wand */}
                                    <g className="animate-ping">
                                      <circle cx="28" cy="14" r="1.5" fill="#ffd700" />
                                      <circle cx="12" cy="16" r="1" fill="#ffd700" />
                                      <circle cx="26" cy="22" r="1" fill="#fff9c4" />
                                    </g>

                                    <defs>
                                      <linearGradient id="wandGradientBlack" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#1a1a1a" />
                                        <stop offset="50%" stopColor="#3a3a3a" />
                                        <stop offset="100%" stopColor="#1a1a1a" />
                                      </linearGradient>
                                      <radialGradient id="glowGradientGold" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#fff9c4" />
                                        <stop offset="50%" stopColor="#ffd700" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                                      </radialGradient>
                                    </defs>
                                  </svg>
                                </div>
                              </div>

                              {/* Animated text - Montserrat Bold Black */}
                              <p className="font-montserrat font-bold text-xl text-black">
                                Creating Fab-Ai Magic
                              </p>

                              {/* CSS for wand animation */}
                              <style>{`
                                @keyframes wandWave {
                                  0%, 100% { transform: translateX(-50%) rotate(-15deg); }
                                  50% { transform: translateX(-50%) rotate(15deg); }
                                }
                              `}</style>
                            </div>
                          </div>
                        </div>
                      )}

                      {!isGenerating && !error && mockupData && (
                        <div className="relative w-full flex flex-col items-center justify-center gap-4">
                          {/* PERFORMANCE FIX: Simplified preview container */}
                          <div className="relative rounded-xl bg-white/80 border border-white shadow-lg p-4 max-w-[90%] w-auto">
                            <img
                              src={mockupData.mockups[currentView] || ''}
                              alt={`${fabricName} - ${currentView}`}
                              className="w-auto h-auto object-contain max-h-[50vh]"
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

                          <div className="flex-shrink-0 flex gap-3 justify-center pb-2">
                            {/* Download buttons */}
                            <Button onClick={() => window.open(mockupData.mockups[currentView], '_blank')} variant="outline">
                              Download Image
                            </Button>
                            <Button
                              onClick={() => setShowTechpackModal(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <FileText size={16} className="mr-2" />
                              Download Techpack
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

      {/* Techpack Prompt Modal */}
      {fabric && mockupData && (
        <TechpackPromptModal
          isOpen={showTechpackModal}
          onClose={() => setShowTechpackModal(false)}
          mockupData={mockupData.mockups}
          fabricRef={fabric.ref || fabric.id}
          garmentName={currentGarmentName}
          fabrication={fabricComposition}
        />
      )}
    </Dialog>
  );
};
