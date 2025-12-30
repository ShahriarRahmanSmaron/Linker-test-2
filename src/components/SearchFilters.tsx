
import React, { useState, useEffect } from 'react';
import { FabricFilter } from '../types';
import { SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectGridContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SearchFiltersProps {
  filters: FabricFilter;
  setFilters: React.Dispatch<React.SetStateAction<FabricFilter>>;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, setFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
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
    // Auto-close the popover after selection
    setIsOpen(false);
  };

  const resetFilters = () => {
    setFilters(prev => ({
      ...prev,
      fabrication: '',
      gsmRange: '',
      type: '',
    }));
    setIsOpen(false);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 border-2 border-neutral-300 rounded-xl bg-white hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300"
        >
          <SlidersHorizontal className="h-5 w-5 text-neutral-600" />
          {activeFilterCount > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary-600"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 bg-white border border-neutral-200 shadow-lg rounded-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">Filters</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-primary-600 hover:text-primary-700 h-auto py-1 px-2"
              >
                Reset all
              </Button>
            )}
          </div>

          {/* Fabrication Group */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Fabrication</label>
            <Select value={filters.fabrication || 'all'} onValueChange={(value) => handleChange('fabrication', value)}>
              <SelectTrigger className="w-full bg-neutral-50 hover:bg-white">
                <SelectValue placeholder="All Fabrications" />
              </SelectTrigger>
              <SelectGridContent columns={3}>
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

          {/* GSM Group */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Weight (GSM)</label>
            <Select value={filters.gsmRange || 'all'} onValueChange={(value) => handleChange('gsmRange', value)}>
              <SelectTrigger className="w-full bg-neutral-50 hover:bg-white">
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
      </PopoverContent>
    </Popover>
  );
};