import React, { useEffect, useState } from 'react';
import { FabricFilter } from '../types';
import { ChevronRight, Layers, LayoutGrid, Box } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarFiltersProps {
    filters: FabricFilter;
    setFilters: React.Dispatch<React.SetStateAction<FabricFilter>>;
    totalResults: number;
    className?: string;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
    filters,
    setFilters,
    totalResults,
    className,
}) => {
    const [fabricGroups, setFabricGroups] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFabricGroups = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/fabric-groups');
                if (response.ok) {
                    const groups = await response.json();
                    setFabricGroups(groups);
                } else {
                    console.error('Failed to fetch fabric groups');
                }
            } catch (error) {
                console.error('Error fetching fabric groups:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFabricGroups();
    }, []);

    const handleGroupChange = (group: string) => {
        setFilters((prev) => ({
            ...prev,
            fabrication: prev.fabrication === group ? '' : group,
            // Reset other filters when switching main category if desired, 
            // but user only asked to remove Composition/GSM UI, not necessarily logic.
            // However, "All Fabrics > Category" implies a hierarchy.
        }));
    };

    const handleAllClick = () => {
        setFilters((prev) => ({
            ...prev,
            fabrication: '',
            gsmRange: '',
            type: '',
        }));
    };

    const isAllSelected = !filters.fabrication && !filters.gsmRange && !filters.type;

    return (
        <div className={cn("w-full space-y-2 bg-white border border-neutral-200 p-4 rounded-xl", className)}>
            {/* Header / All Components */}
            <div
                onClick={handleAllClick}
                className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 group",
                    isAllSelected
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
            >
                <div className="flex items-center gap-3">
                    <LayoutGrid className={cn("w-5 h-5", isAllSelected ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-600")} />
                    <span className="font-bold text-sm">All Components</span>
                </div>

            </div>

            {/* Categories Header */}
            <div className="pt-4 pb-2 px-3">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Categories
                </p>
            </div>

            {/* Dynamic Categories */}
            <div className="space-y-1">
                {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-9 mx-3 bg-neutral-200/50 rounded-lg animate-pulse" />
                    ))
                ) : (
                    fabricGroups.map((group) => {
                        const isSelected = filters.fabrication === group;
                        return (
                            <div
                                key={group}
                                onClick={() => handleGroupChange(group)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group",
                                    isSelected
                                        ? "bg-neutral-100 text-neutral-900"
                                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-[13px] font-display font-medium")}>
                                        {group}
                                    </span>
                                </div>
                                {isSelected && <ChevronRight className="w-4 h-4 text-neutral-900" />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
