import React, { useState, useMemo } from 'react';
import { MOCK_FABRICS } from '../constants';
import { Fabric, FabricFilter } from '../types';
import { SearchHeader } from './SearchHeader';
import { SearchFilters } from './SearchFilters';
import { SearchFabricCard } from './SearchFabricCard';
import { SelectionPanel } from './SelectionPanel';
import { MockupModal } from './MockupModal';
import { TechpackModal } from './TechpackModal';
import { Layers, SearchX, ArrowRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FabricFilter>({ fabrication: '', type: '', gsmRange: '' });
  const [selectedFabrics, setSelectedFabrics] = useState<Fabric[]>([]);
  
  const [mockupModalFabric, setMockupModalFabric] = useState<Fabric | null>(null);
  const [techpackModalFabric, setTechpackModalFabric] = useState<Fabric | null>(null);

  // Filter Logic
  const filteredFabrics = useMemo(() => {
    return MOCK_FABRICS.filter(fabric => {
      // Search Term
      const term = searchTerm.toLowerCase();
      const matchesSearch = fabric.name.toLowerCase().includes(term) || 
                            fabric.composition.toLowerCase().includes(term) ||
                            fabric.supplier.toLowerCase().includes(term);
      if (!matchesSearch) return false;

      // Fabrication Filter
      if (filters.fabrication && fabric.fabrication !== filters.fabrication) return false;

      // Type Filter
      if (filters.type && fabric.type !== filters.type) return false;

      // GSM Range Filter
      if (filters.gsmRange) {
        if (filters.gsmRange === 'light' && fabric.gsm >= 160) return false;
        if (filters.gsmRange === 'medium' && (fabric.gsm < 160 || fabric.gsm > 240)) return false;
        if (filters.gsmRange === 'heavy' && fabric.gsm <= 240) return false;
      }

      return true;
    });
  }, [searchTerm, filters]);

  // Handlers
  const toggleSelection = (fabric: Fabric) => {
    if (selectedFabrics.find(f => f.id === fabric.id)) {
      setSelectedFabrics(prev => prev.filter(f => f.id !== fabric.id));
    } else {
      setSelectedFabrics(prev => [...prev, fabric]);
    }
  };

  const removeSelection = (id: string) => {
    setSelectedFabrics(prev => prev.filter(f => f.id !== id));
  };

  const resetAllFilters = () => {
    setSearchTerm(''); 
    setFilters({fabrication: '', type: '', gsmRange: ''});
  };

  const applyQuickFilter = (key: keyof FabricFilter, value: string) => {
    resetAllFilters();
    setTimeout(() => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Simple Nav for Search Page */}
      <nav className="bg-white border-b border-neutral-200 px-4 py-3 sticky top-0 z-30 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
                <div className="bg-primary-50 p-1.5 rounded-lg mr-2 group-hover:bg-primary-100 transition-colors duration-200">
                    <Layers className="h-5 w-5 text-primary-600 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-neutral-900">
                  <span className="text-primary-600">Link</span><span className="text-accent-500">ER</span>
                </span>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-neutral-500 bg-neutral-50 px-3 py-1 rounded-full border border-neutral-200">
                    Logged in as <span className="text-neutral-900 font-bold">{user?.name || 'Buyer'}</span>
                </div>
                <button 
                    onClick={logout} 
                    className="text-neutral-400 hover:text-red-500 transition-colors"
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </nav>

      <SearchHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <SearchFilters filters={filters} setFilters={setFilters} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between animate-fade-in">
             <div className="text-sm text-neutral-500 font-medium">
                Showing <span className="text-neutral-900 font-bold">{filteredFabrics.length}</span> results
             </div>
             {/* Sort option could go here */}
        </div>

        {/* Grid */}
        {filteredFabrics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            {filteredFabrics.map((fabric, index) => (
                <div key={fabric.id} className="h-full" style={{ animationDelay: `${index * 50}ms` }}>
                    <SearchFabricCard 
                        fabric={fabric}
                        isSelected={!!selectedFabrics.find(f => f.id === fabric.id)}
                        onToggleSelect={toggleSelection}
                        onOpenMockup={setMockupModalFabric}
                        onOpenTechpack={setTechpackModalFabric}
                    />
                </div>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-neutral-300 text-center px-4 animate-fade-in shadow-sm">
                <div className="bg-neutral-50 p-6 rounded-full mb-6 shadow-inner">
                    <SearchX className="h-12 w-12 text-neutral-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-neutral-900 mb-3">No fabrics found</h3>
                <p className="text-neutral-500 mb-8 max-w-md mx-auto text-lg font-light">
                    We couldn't find any fabrics matching <span className="font-semibold text-neutral-700">"{searchTerm}"</span> with the current filters.
                </p>
                
                <button 
                    onClick={resetAllFilters}
                    className="bg-primary-600 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center"
                >
                    Browse All Fabrics <ArrowRight size={18} className="ml-2" />
                </button>

                <div className="mt-10">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Or try a popular category</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <button 
                            onClick={() => applyQuickFilter('fabrication', 'Single Jersey')}
                            className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-600 hover:border-primary-300 hover:text-primary-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Single Jersey
                        </button>
                        <button 
                            onClick={() => applyQuickFilter('fabrication', 'Fleece')}
                            className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-600 hover:border-primary-300 hover:text-primary-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Fleece
                        </button>
                        <button 
                            onClick={() => applyQuickFilter('type', 'Natural')}
                            className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-600 hover:border-primary-300 hover:text-primary-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Sustainable / Natural
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Right/Bottom Panel */}
      <SelectionPanel 
        selectedFabrics={selectedFabrics} 
        onRemove={removeSelection} 
        onClear={() => setSelectedFabrics([])} 
      />

      {/* Modals */}
      <MockupModal 
        fabric={mockupModalFabric} 
        isSelected={!!selectedFabrics.find(f => f.id === mockupModalFabric?.id)}
        onToggleSelect={toggleSelection}
        onClose={() => setMockupModalFabric(null)} 
      />
      <TechpackModal fabric={techpackModalFabric} onClose={() => setTechpackModalFabric(null)} />

    </div>
  );
};