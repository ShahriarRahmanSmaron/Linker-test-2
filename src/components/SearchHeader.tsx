
import React from 'react';
import { Search } from 'lucide-react';

interface SearchHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="bg-white border-b border-neutral-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">Fabric Library</h1>
        <p className="text-neutral-500 mb-6">Search by fabrication, code, composition, or mill.</p>
        
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-lg leading-5 bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out sm:text-sm"
            placeholder="Search fabrics (e.g. 'Organic Cotton', 'Fleece', 'Masco Knits')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
