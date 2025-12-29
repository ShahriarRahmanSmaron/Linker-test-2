
import React, { useState, useEffect } from 'react';
import { FabricFilter } from '../types';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectGridContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SearchFiltersProps {
  filters: FabricFilter;
  setFilters: React.Dispatch<React.SetStateAction<FabricFilter>>;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [fabricGroups, setFabricGroups] = useState<string[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  // Fetch fabric groups from backend on mount
  useEffect(() => {
    const fetchFabricGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const response = await fetch('/api/fabric-groups');
        if (response.ok) {
          const groups = await response.json();
          setFabricGroups(groups);
        } else {
          console.error('Failed to fetch fabric groups');
          setFabricGroups([]);
        }
      } catch (error) {
        console.error('Error fetching fabric groups:', error);
        setFabricGroups([]);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchFabricGroups();
  }, []);

  const handleChange = (key: keyof FabricFilter, value: string) => {
    // Convert "all" back to empty string for filter logic
    const filterValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: filterValue }));
  };

  const resetFilters = () => {
    setFilters({ fabrication: '', type: '', gsmRange: '' });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;


  return (
    <>
      {/* ==========================================
          DESKTOP VIEW: Horizontal Bar
         ========================================== */}
      <div className="hidden md:block bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center text-neutral-500 text-sm font-medium font-display mr-2">
              <Filter size={16} className="mr-2" /> Filters:
            </div>

            <Select value={filters.fabrication || 'all'} onValueChange={(value) => handleChange('fabrication', value)}>
              <SelectTrigger className="w-[180px] bg-neutral-50 hover:bg-white font-display">
                <SelectValue placeholder="All Fabrications" />
              </SelectTrigger>
              <SelectGridContent columns={4}>
                <SelectItem value="all">All Fabrications</SelectItem>
                {isLoadingGroups ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  fabricGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))
                )}
              </SelectGridContent>
            </Select>

            <Select value={filters.type || 'all'} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger className="w-[180px] bg-neutral-50 hover:bg-white font-display">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Natural">Natural (Cotton, Wool...)</SelectItem>
                <SelectItem value="Synthetic">Synthetic (Poly, Nylon...)</SelectItem>
                <SelectItem value="Blend">Blends</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.gsmRange || 'all'} onValueChange={(value) => handleChange('gsmRange', value)}>
              <SelectTrigger className="w-[180px] bg-neutral-50 hover:bg-white font-display">
                <SelectValue placeholder="Any Weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Weight</SelectItem>
                <SelectItem value="light">Lightweight (&lt;160 GSM)</SelectItem>
                <SelectItem value="medium">Midweight (160-240 GSM)</SelectItem>
                <SelectItem value="heavy">Heavyweight (&gt;240 GSM)</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="ml-auto text-primary-600 hover:text-primary-700"
              >
                Reset filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          MOBILE VIEW: Sticky Trigger & Slide-over
         ========================================== */}

      {/* Sticky Mobile Trigger Bar */}
      <div className="md:hidden bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="text-sm font-medium text-neutral-600">
          {activeFilterCount > 0 ? (
            <span className="text-primary-600 font-bold">{activeFilterCount} filters active</span>
          ) : (
            'Filter results'
          )}
        </div>
        <Button
          onClick={() => setIsMobileOpen(true)}
          variant={activeFilterCount > 0 ? "default" : "outline"}
          className="flex items-center"
        >
          <SlidersHorizontal size={16} className="mr-2" /> Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-2 h-4 px-1.5 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="right" className="w-[85%] max-w-sm sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Filter size={18} className="mr-2 text-primary-500" /> Filter Fabrics
            </SheetTitle>
          </SheetHeader>

          {/* Body (Scrollable) */}
          <div className="p-6 space-y-8 overflow-y-auto flex-1">
            {/* Fabrication Group */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">Fabrication</label>
              <Select value={filters.fabrication || 'all'} onValueChange={(value) => handleChange('fabrication', value)}>
                <SelectTrigger className="w-full bg-neutral-50">
                  <SelectValue placeholder="All Fabrications" />
                </SelectTrigger>
                <SelectGridContent columns={2}>
                  <SelectItem value="all">All Fabrications</SelectItem>
                  {isLoadingGroups ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    fabricGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))
                  )}
                </SelectGridContent>
              </Select>
            </div>

            {/* Type Group */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">Fiber Type</label>
              <Select value={filters.type || 'all'} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger className="w-full bg-neutral-50">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Natural">Natural (Cotton, Wool...)</SelectItem>
                  <SelectItem value="Synthetic">Synthetic (Poly, Nylon...)</SelectItem>
                  <SelectItem value="Blend">Blends</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GSM Group */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">Weight (GSM)</label>
              <Select value={filters.gsmRange || 'all'} onValueChange={(value) => handleChange('gsmRange', value)}>
                <SelectTrigger className="w-full bg-neutral-50">
                  <SelectValue placeholder="Any Weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Weight</SelectItem>
                  <SelectItem value="light">Lightweight (&lt;160 GSM)</SelectItem>
                  <SelectItem value="medium">Midweight (160-240 GSM)</SelectItem>
                  <SelectItem value="heavy">Heavyweight (&gt;240 GSM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="w-full"
            >
              Reset All
            </Button>
            <Button
              onClick={() => setIsMobileOpen(false)}
              className="w-full"
            >
              Show Results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};
